import * as oidc from "openid-client";
import { OAuthError } from "../error";
import type { ProviderAdapter } from "../types";

export default {
	server: {
		issuer: "https://x.com",
		authorization_endpoint: "https://x.com/i/oauth2/authorize",
		token_endpoint: "https://api.x.com/2/oauth2/token",
		revocation_endpoint: "https://api.x.com/2/oauth2/revoke"
	},
	clientAuth(_server, { client_id: clientID, client_secret: clientSecret }, _body, headers) {
		headers.set("Authorization", `Basic ${btoa(`${clientID}:${clientSecret}`)}`);
	},
	refresh: true,

	async getUserInfo(config, token) {
		const url = new URL("https://api.x.com/2/users/me");
		url.searchParams.set("user.fields", "description,profile_image_url");
		const response = await oidc.fetchProtectedResource(config, token, url, "GET");
		if (!response.ok) throw new OAuthError("invalid_userinfo", `X userinfo request failed with HTTP ${response.status}`);

		const payload = (await response.json()) as { data?: Record<string, unknown> } | null;
		const user = payload?.data;
		return {
			sub: user?.id,
			name: user?.name,
			preferred_username: user?.username,
			description: user?.description,
			picture: typeof user?.profile_image_url === "string" ? user.profile_image_url.replace("_normal.", ".") : undefined,
			email: user?.confirmed_email
		};
	}
} satisfies ProviderAdapter;
