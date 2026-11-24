import * as oidc from "openid-client";
import { OAuthError } from "../error";
import type { ProviderAdapter } from "../types";

export default {
	server: {
		issuer: "https://discord.com",
		authorization_endpoint: "https://discord.com/oauth2/authorize",
		token_endpoint: "https://discord.com/api/oauth2/token",
		revocation_endpoint: "https://discord.com/api/oauth2/token/revoke"
	},
	refresh: true,

	async getUserInfo(config, token) {
		const response = await oidc.fetchProtectedResource(config, token, new URL("https://discord.com/api/users/@me"), "GET");
		if (!response.ok) throw new OAuthError("invalid_userinfo", `Discord userinfo request failed with HTTP ${response.status}`);

		const user = (await response.json()) as Record<string, unknown> | null;
		const sub = typeof user?.id === "string" && user.id ? user.id : undefined;
		const avatar = typeof user?.avatar === "string" && user.avatar ? user.avatar : undefined;
		const ext = avatar?.startsWith("a_") ? "gif" : "png";
		return {
			sub,
			name: user?.global_name,
			preferred_username: user?.username,
			picture: sub && avatar ? `https://cdn.discordapp.com/avatars/${sub}/${avatar}.${ext}` : undefined,
			email: user?.email
		};
	}
} satisfies ProviderAdapter;
