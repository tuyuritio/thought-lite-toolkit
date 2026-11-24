import * as oidc from "openid-client";
import { OAuthError } from "../error";
import type { ProviderAdapter } from "../types";

export default {
	server: {
		issuer: "https://www.facebook.com",
		authorization_endpoint: "https://www.facebook.com/dialog/oauth",
		token_endpoint: "https://graph.facebook.com/oauth/access_token"
	},

	async getUserInfo(config, token) {
		const url = new URL("https://graph.facebook.com/me");
		url.searchParams.set("fields", "id,name,email,picture.type(large)");
		const response = await oidc.fetchProtectedResource(config, token, url, "GET");
		if (!response.ok) throw new OAuthError("invalid_userinfo", `Facebook userinfo request failed with HTTP ${response.status}`);

		const user = (await response.json()) as {
			id?: unknown;
			name?: unknown;
			email?: unknown;
			picture?: { data?: { url?: unknown } };
		} | null;
		return {
			sub: user?.id,
			name: user?.name,
			picture: user?.picture?.data?.url,
			email: user?.email
		};
	}
} satisfies ProviderAdapter;
