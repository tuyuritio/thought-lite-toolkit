import * as oidc from "openid-client";
import { OAuthError } from "../error";
import type { ProviderAdapter } from "../types";

const userAgent = "thought-lite-toolkit";

export default {
	server: {
		issuer: "https://github.com/login/oauth",
		authorization_endpoint: "https://github.com/login/oauth/authorize",
		token_endpoint: "https://github.com/login/oauth/access_token"
	},

	async getUserInfo(config, token) {
		const headers = new Headers({ "User-Agent": userAgent });
		const response = await oidc.fetchProtectedResource(config, token, new URL("https://api.github.com/user"), "GET", undefined, headers);
		if (!response.ok) throw new OAuthError("invalid_userinfo", `GitHub userinfo request failed with HTTP ${response.status}`);

		const user = (await response.json()) as Record<string, unknown> | null;
		const sub = typeof user?.id === "number" && Number.isSafeInteger(user.id) && user.id > 0 ? String(user.id) : undefined;
		return {
			sub,
			name: user?.name,
			preferred_username: user?.login,
			description: user?.bio,
			picture: user?.avatar_url,
			email: user?.email
		};
	},

	async revokeToken(config, { token, type }) {
		if (type !== "access_token") throw new TypeError("GitHub OAuth apps revoke access tokens");
		const { client_id: clientID, client_secret: clientSecret } = config.clientMetadata();
		const response = await fetch(`https://api.github.com/applications/${encodeURIComponent(clientID)}/token`, {
			method: "DELETE",
			headers: {
				"User-Agent": userAgent,
				"Content-Type": "application/json",
				Accept: "application/vnd.github+json",
				Authorization: `Basic ${btoa(`${clientID}:${clientSecret}`)}`
			},
			body: JSON.stringify({ access_token: token })
		});

		if (!response.ok) throw new OAuthError("revocation_failed", `GitHub token revocation failed with HTTP ${response.status}`);
	}
} satisfies ProviderAdapter;
