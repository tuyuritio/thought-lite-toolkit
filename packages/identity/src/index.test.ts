import { afterEach, describe, expect, it, vi } from "vitest";
import { createIdentity, OAuthError, type ProviderConfiguration } from ".";

const config = {
	clientID: "example-client",
	clientSecret: "example-secret",
	redirectURI: "https://thought.example/callback",
	scopes: ["read:user"]
} satisfies ProviderConfiguration;

function callback(state: string) {
	const url = new URL(config.redirectURI);
	url.searchParams.set("code", "example-code");
	url.searchParams.set("state", state);
	return url;
}

function stubFetch(respond: (request: Request) => Response | Promise<Response>) {
	const request = vi.fn(async (...args: Parameters<typeof globalThis.fetch>) => respond(new Request(...args)));
	vi.stubGlobal("fetch", request);
	return request;
}

afterEach(() => vi.unstubAllGlobals());

describe("createIdentity", () => {
	it("exposes enabled providers, ignores undefined entries, and lazily caches OIDC discovery", async () => {
		const fetch = stubFetch(request => {
			if (request.url === "https://accounts.google.com/.well-known/openid-configuration") return googleDiscovery();
			throw new Error(`Unexpected request: ${request.url}`);
		});

		const identity = createIdentity({ github: config, google: { ...config, scopes: ["profile"] }, x: undefined });
		expect(identity.providers).toEqual(["github", "google"]);
		expect(identity.has("github")).toBe(true);
		expect(identity.has("google")).toBe(true);
		expect(identity.has("x")).toBe(false);
		expect(identity.has("unknown")).toBe(false);
		expect(fetch).not.toHaveBeenCalled();

		await identity.buildAuthorizationRequest("google");
		await identity.buildAuthorizationRequest("google");
		expect(fetch).toHaveBeenCalledOnce();

		await expect(identity.buildAuthorizationRequest("x")).rejects.toThrow("Unconfigured OAuth provider: x");
	});

	it("completes a GitHub login and returns the normalized account and credentials", async () => {
		const fetch = stubFetch(async request => {
			switch (request.url) {
				case "https://github.com/login/oauth/access_token": {
					const form = new URLSearchParams(await request.text());
					expect(form.get("code")).toBe("example-code");
					expect(form.get("code_verifier")).toBe(transaction.codeVerifier);
					expect(form.get("redirect_uri")).toBe(config.redirectURI);
					return Response.json({ access_token: "github-token", token_type: "bearer" });
				}
				case "https://api.github.com/user":
					expect(request.headers.get("authorization")).toBe("Bearer github-token");
					expect(request.headers.has("user-agent")).toBe(true);
					return Response.json({ id: 42, name: null, login: "octocat", email: null });
				default:
					throw new Error("Unexpected request");
			}
		});

		const identity = createIdentity({ github: config });
		const { url, transaction } = await identity.buildAuthorizationRequest("github", { parameters: { allow_signup: false } });
		expect(url.searchParams.get("state")).toBe(transaction.state);
		expect(url.searchParams.get("code_challenge_method")).toBe("S256");
		expect(url.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(url.searchParams.get("allow_signup")).toBe("false");

		const githubCallback = callback(transaction.state);
		githubCallback.searchParams.set("iss", "https://github.com/login/oauth");
		const result = await identity.handleAuthorizationResponse("github", githubCallback, JSON.parse(JSON.stringify(transaction)));
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(result.userInfo).toMatchObject({ sub: "42", name: "octocat", preferred_username: "octocat" });
		expect(result.userInfo.email).toBeUndefined();
		expect(result.tokens).toMatchObject({ accessToken: "github-token" });
		await expect(identity.refreshAccessToken("github", "token")).rejects.toThrow(TypeError);
	});

	it("forwards additional provider authorization parameters", async () => {
		const identity = createIdentity({ github: config });
		const { url } = await identity.buildAuthorizationRequest("github", { parameters: { provider_option: "custom value" } });

		expect(url.searchParams.get("provider_option")).toBe("custom value");
	});

	it("does not allow custom parameters to override protocol parameters", async () => {
		const identity = createIdentity({ github: config });
		const { url, transaction } = await identity.buildAuthorizationRequest("github", {
			parameters: { redirect_uri: "https://evil.example", scope: "admin", state: "forged" }
		});

		expect(url.searchParams.get("redirect_uri")).toBe(config.redirectURI);
		expect(url.searchParams.get("scope")).toBe("read:user");
		expect(url.searchParams.get("state")).toBe(transaction.state);
	});

	it("rejects a callback at a different origin or path, or with a mismatched transaction or state", async () => {
		const fetch = stubFetch(() => {
			throw new Error("Invalid callbacks should never use the network");
		});
		const identity = createIdentity({ github: config });
		const { transaction } = await identity.buildAuthorizationRequest("github");

		const wrongOrigin = callback(transaction.state);
		wrongOrigin.hostname = "other.example";
		const wrongPath = callback(transaction.state);
		wrongPath.pathname = "/other";

		await expect(identity.handleAuthorizationResponse("github", wrongOrigin, transaction)).rejects.toMatchObject({ code: "invalid_callback" });
		await expect(identity.handleAuthorizationResponse("github", wrongPath, transaction)).rejects.toMatchObject({ code: "invalid_callback" });
		await expect(
			identity.handleAuthorizationResponse("github", callback(transaction.state), { ...transaction, codeVerifier: "" })
		).rejects.toMatchObject({ code: "invalid_transaction" });
		await expect(identity.handleAuthorizationResponse("github", callback("wrong-state"), transaction)).rejects.toThrow();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("rejects profile synchronization when the account subject differs", async () => {
		stubFetch(() => Response.json({ id: 42 }));
		const identity = createIdentity({ github: config });

		await expect(identity.getUserInfo("github", { accessToken: "example-token", expectedSubject: "43" })).rejects.toMatchObject({
			code: "subject_mismatch"
		});
	});

	it("revokes a single GitHub token and propagates HTTP failures", async () => {
		const fetch = stubFetch(async request => {
			expect(request.url).toBe("https://api.github.com/applications/example-client/token");
			expect(request.method).toBe("DELETE");
			expect(await request.json()).toEqual({ access_token: "example-token" });
			return new Response(null, { status: 403 });
		});

		const identity = createIdentity({ github: config });
		await expect(identity.revokeToken("github", { type: "access_token", token: "example-token" })).rejects.toMatchObject({
			code: "revocation_failed"
		});
		expect(fetch).toHaveBeenCalledOnce();
	});

	it("validates Google's nonce and UserInfo subject before returning the login", async () => {
		let nonce = "";
		let subject = "google-user";
		const fetch = stubFetch(request => {
			switch (request.url) {
				case "https://accounts.google.com/.well-known/openid-configuration":
					return googleDiscovery();
				case "https://oauth2.googleapis.com/token": {
					const now = Math.floor(Date.now() / 1000);
					const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
					const claims = Buffer.from(
						JSON.stringify({
							iss: "https://accounts.google.com",
							aud: config.clientID,
							sub: "google-user",
							iat: now,
							exp: now + 600,
							nonce
						})
					).toString("base64url");
					const idToken = `${header}.${claims}.c2lnbmF0dXJl`;
					return Response.json({ access_token: "google-token", token_type: "bearer", id_token: idToken });
				}
				case "https://openidconnect.googleapis.com/v1/userinfo":
					return Response.json({ sub: subject, name: "Example User" });
				default:
					throw new Error("Unexpected request");
			}
		});

		const identity = createIdentity({ google: { ...config, scopes: ["email"] } });
		const { url, transaction } = await identity.buildAuthorizationRequest("google", { parameters: { login_hint: "user@example.com" } });
		expect(url.searchParams.get("scope")).toBe("openid email");
		expect(url.searchParams.get("login_hint")).toBe("user@example.com");
		expect(url.searchParams.get("nonce")).toBe(transaction.nonce);
		expect(transaction.nonce).toBeTruthy();
		nonce = transaction.nonce!;
		const complete = () => identity.handleAuthorizationResponse("google", callback(transaction.state), transaction);

		await expect(complete()).resolves.toMatchObject({
			userInfo: { sub: subject, name: "Example User" },
			tokens: { accessToken: "google-token" }
		});
		subject = "other-google-user";
		await expect(complete()).rejects.toThrow();
		fetch.mockClear();
		nonce = "different-nonce";
		await expect(complete()).rejects.toThrow();
		expect(fetch).toHaveBeenCalledOnce();
		await expect(
			identity.handleAuthorizationResponse("google", callback(transaction.state), { ...transaction, nonce: undefined })
		).rejects.toBeInstanceOf(OAuthError);
		expect(fetch).toHaveBeenCalledOnce();
	});

	it("returns refreshed Google tokens and propagates revocation failures", async () => {
		stubFetch(async request => {
			switch (request.url) {
				case "https://accounts.google.com/.well-known/openid-configuration":
					return googleDiscovery();
				case "https://oauth2.googleapis.com/token": {
					const form = new URLSearchParams(await request.text());
					expect(form.get("grant_type")).toBe("refresh_token");
					expect(form.get("refresh_token")).toBe("old-refresh");
					return Response.json({ access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600, token_type: "bearer" });
				}
				case "https://oauth2.googleapis.com/revoke": {
					const form = new URLSearchParams(await request.text());
					expect(form.get("token")).toBe("new-refresh");
					expect(form.get("token_type_hint")).toBe("refresh_token");
					return Response.json({ error: "invalid_token" }, { status: 400 });
				}
				default:
					throw new Error("Unexpected request");
			}
		});

		const identity = createIdentity({ google: config });
		const tokens = await identity.refreshAccessToken("google", "old-refresh");
		expect(tokens).toMatchObject({ accessToken: "new-access", refreshToken: "new-refresh", expiresAt: expect.any(Number) });
		expect(tokens.expiresAt).toBeGreaterThan(Date.now());
		await expect(identity.revokeToken("google", { type: "refresh_token", token: "new-refresh" })).rejects.toMatchObject({
			error: "invalid_token"
		});
	});

	it("uses HTTP Basic authentication for X token exchange and revocation", async () => {
		stubFetch(async request => {
			switch (new URL(request.url).pathname) {
				case "/2/oauth2/token": {
					expect(request.headers.get("authorization")).toBe(`Basic ${btoa("example-client:example-secret")}`);
					const form = new URLSearchParams(await request.text());
					expect(form.has("client_secret")).toBe(false);
					return Response.json({ access_token: "x-token", token_type: "bearer", refresh_token: "x-refresh" });
				}
				case "/2/oauth2/revoke": {
					expect(request.headers.get("authorization")).toBe(`Basic ${btoa("example-client:example-secret")}`);
					const form = new URLSearchParams(await request.text());
					expect(form.get("token")).toBe("x-refresh");
					expect(form.get("token_type_hint")).toBe("refresh_token");
					return new Response(null, { status: 200 });
				}
				case "/2/users/me":
					return Response.json({ data: { id: "42", name: "Example User", username: "example" } });
				default:
					throw new Error("Unexpected request");
			}
		});

		const identity = createIdentity({ x: config });
		const { transaction } = await identity.buildAuthorizationRequest("x");
		await expect(identity.handleAuthorizationResponse("x", callback(transaction.state), transaction)).resolves.toMatchObject({
			userInfo: { sub: "42", preferred_username: "example" },
			tokens: { accessToken: "x-token", refreshToken: "x-refresh" }
		});
		await expect(identity.revokeToken("x", { type: "refresh_token", token: "x-refresh" })).resolves.toBeUndefined();
	});

	it("completes Discord login, refresh, and revocation", async () => {
		stubFetch(async request => {
			switch (request.url) {
				case "https://discord.com/api/oauth2/token": {
					const form = new URLSearchParams(await request.text());
					if (form.get("grant_type") === "refresh_token") {
						return Response.json({
							access_token: "discord-new",
							refresh_token: "discord-refresh-2",
							token_type: "bearer",
							expires_in: 604800
						});
					}
					return Response.json({
						access_token: "discord-token",
						refresh_token: "discord-refresh",
						token_type: "bearer",
						expires_in: 604800
					});
				}
				case "https://discord.com/api/users/@me":
					return Response.json({ id: "99", global_name: "Wumpus", username: "wumpus", avatar: "a_hash", email: "wumpus@discord.example" });
				case "https://discord.com/api/oauth2/token/revoke":
					return new Response(null, { status: 200 });
				default:
					throw new Error(`Unexpected request: ${request.url}`);
			}
		});

		const identity = createIdentity({ discord: { ...config, scopes: ["identify", "email"] } });
		const { transaction } = await identity.buildAuthorizationRequest("discord");
		await expect(identity.handleAuthorizationResponse("discord", callback(transaction.state), transaction)).resolves.toMatchObject({
			userInfo: {
				sub: "99",
				name: "Wumpus",
				preferred_username: "wumpus",
				picture: "https://cdn.discordapp.com/avatars/99/a_hash.gif",
				email: "wumpus@discord.example"
			},
			tokens: { accessToken: "discord-token", refreshToken: "discord-refresh" }
		});
		await expect(identity.refreshAccessToken("discord", "discord-refresh")).resolves.toMatchObject({
			accessToken: "discord-new",
			refreshToken: "discord-refresh-2"
		});
		await expect(identity.revokeToken("discord", { type: "access_token", token: "discord-new" })).resolves.toBeUndefined();
	});

	it("completes Facebook login and extracts nested picture URL", async () => {
		stubFetch(async request => {
			const url = new URL(request.url);
			if (url.href === "https://graph.facebook.com/oauth/access_token") {
				return Response.json({ access_token: "fb-token", token_type: "bearer", expires_in: 5184000 });
			}
			if (url.origin === "https://graph.facebook.com" && url.pathname === "/me") {
				expect(url.searchParams.get("fields")).toBe("id,name,email,picture.type(large)");
				return Response.json({
					id: "101",
					name: "FB User",
					email: "fb@example.com",
					picture: { data: { url: "https://cdn.facebook.example/avatar.jpg" } }
				});
			}
			throw new Error(`Unexpected request: ${request.url}`);
		});

		const identity = createIdentity({ facebook: { ...config, scopes: ["public_profile", "email"] } });
		const { transaction } = await identity.buildAuthorizationRequest("facebook");
		await expect(identity.handleAuthorizationResponse("facebook", callback(transaction.state), transaction)).resolves.toMatchObject({
			userInfo: { sub: "101", name: "FB User", picture: "https://cdn.facebook.example/avatar.jpg", email: "fb@example.com" },
			tokens: { accessToken: "fb-token" }
		});
		await expect(identity.refreshAccessToken("facebook", "token")).rejects.toThrow(TypeError);
		await expect(identity.revokeToken("facebook", { type: "access_token", token: "fb-token" })).rejects.toThrow(TypeError);
	});

	it("completes Microsoft multi-tenant OIDC login and token refresh", async () => {
		let nonce = "";
		const tenantId = "9188040d-6c67-4c5b-b112-36a304b66dad";
		stubFetch(async request => {
			switch (request.url) {
				case "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration":
					return Response.json({
						issuer: "https://login.microsoftonline.com/{tenantid}/v2.0",
						authorization_endpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
						token_endpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
						userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo"
					});
				case "https://login.microsoftonline.com/common/oauth2/v2.0/token": {
					const form = new URLSearchParams(await request.text());
					if (form.get("grant_type") === "refresh_token") {
						return Response.json({ access_token: "ms-new", refresh_token: "ms-refresh-2", token_type: "bearer", expires_in: 3600 });
					}
					const now = Math.floor(Date.now() / 1000);
					const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
					const claims = Buffer.from(
						JSON.stringify({
							iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
							aud: config.clientID,
							sub: "ms-user",
							tid: tenantId,
							iat: now,
							exp: now + 600,
							nonce
						})
					).toString("base64url");
					return Response.json({
						access_token: "ms-token",
						refresh_token: "ms-refresh",
						token_type: "bearer",
						id_token: `${header}.${claims}.c2lnbmF0dXJl`
					});
				}
				case "https://graph.microsoft.com/oidc/userinfo":
					return Response.json({ sub: "ms-user", name: "MS User", email: "ms@example.com" });
				default:
					throw new Error(`Unexpected request: ${request.url}`);
			}
		});

		const identity = createIdentity({ microsoft: { ...config, scopes: ["profile", "email", "offline_access"] } });
		const { transaction } = await identity.buildAuthorizationRequest("microsoft");
		nonce = transaction.nonce!;
		await expect(identity.handleAuthorizationResponse("microsoft", callback(transaction.state), transaction)).resolves.toMatchObject({
			userInfo: { sub: "ms-user", name: "MS User", email: "ms@example.com" },
			tokens: { accessToken: "ms-token", refreshToken: "ms-refresh" }
		});
		await expect(identity.refreshAccessToken("microsoft", "ms-refresh")).resolves.toMatchObject({
			accessToken: "ms-new",
			refreshToken: "ms-refresh-2"
		});
		await expect(identity.revokeToken("microsoft", { type: "access_token", token: "ms-token" })).rejects.toThrow(TypeError);
	});

	it("completes Slack OIDC login and handles auth.revoke errors", async () => {
		let nonce = "";
		stubFetch(async request => {
			switch (request.url) {
				case "https://slack.com/.well-known/openid-configuration":
					return Response.json({
						issuer: "https://slack.com",
						authorization_endpoint: "https://slack.com/openid/connect/authorize",
						token_endpoint: "https://slack.com/api/openid.connect.token",
						userinfo_endpoint: "https://slack.com/api/openid.connect.userInfo"
					});
				case "https://slack.com/api/openid.connect.token": {
					const now = Math.floor(Date.now() / 1000);
					const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
					const claims = Buffer.from(
						JSON.stringify({
							iss: "https://slack.com",
							aud: config.clientID,
							sub: "U0R7JM",
							iat: now,
							exp: now + 600,
							nonce
						})
					).toString("base64url");
					return Response.json({
						ok: true,
						access_token: "xoxp-slack",
						token_type: "Bearer",
						id_token: `${header}.${claims}.c2lnbmF0dXJl`
					});
				}
				case "https://slack.com/api/openid.connect.userInfo":
					return Response.json({
						ok: true,
						sub: "U0R7JM",
						name: "Slack User",
						email: "slack@example.com",
						picture: "https://slack.example/a.png"
					});
				case "https://slack.com/api/auth.revoke":
					expect(request.headers.get("authorization")).toBe("Bearer xoxp-slack");
					return Response.json({ ok: false, error: "token_revoked" });
				default:
					throw new Error(`Unexpected request: ${request.url}`);
			}
		});

		const identity = createIdentity({ slack: { ...config, scopes: ["profile", "email"] } });
		const { transaction } = await identity.buildAuthorizationRequest("slack");
		nonce = transaction.nonce!;
		await expect(identity.handleAuthorizationResponse("slack", callback(transaction.state), transaction)).resolves.toMatchObject({
			userInfo: { sub: "U0R7JM", name: "Slack User", email: "slack@example.com", picture: "https://slack.example/a.png" },
			tokens: { accessToken: "xoxp-slack" }
		});
		await expect(identity.revokeToken("slack", { type: "access_token", token: "xoxp-slack" })).rejects.toMatchObject({
			code: "revocation_failed"
		});
	});
});

function googleDiscovery() {
	return Response.json({
		issuer: "https://accounts.google.com",
		authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
		token_endpoint: "https://oauth2.googleapis.com/token",
		userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
		revocation_endpoint: "https://oauth2.googleapis.com/revoke"
	});
}
