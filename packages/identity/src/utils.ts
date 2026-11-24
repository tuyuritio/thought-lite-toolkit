import type * as oidc from "openid-client";
import { OAuthError } from "./error";
import type { Tokens, UserInfo } from "./types";

export function optionalString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeUserInfo(raw: Partial<Record<keyof UserInfo, unknown>>): UserInfo {
	const sub = optionalString(raw.sub);
	if (!sub) throw new OAuthError("invalid_userinfo", "OAuth userinfo did not contain a valid subject");
	const preferred_username = optionalString(raw.preferred_username);
	return {
		sub,
		name: optionalString(raw.name) ?? preferred_username,
		preferred_username,
		description: optionalString(raw.description),
		picture: optionalString(raw.picture),
		email: optionalString(raw.email)
	};
}

export function normalizeTokens(response: oidc.TokenEndpointResponse): Tokens {
	return {
		accessToken: response.access_token,
		refreshToken: response.refresh_token,
		expiresAt: response.expires_in === undefined ? undefined : Date.now() + response.expires_in * 1000
	};
}
