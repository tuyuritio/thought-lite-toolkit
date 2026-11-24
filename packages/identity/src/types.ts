import type * as oidc from "openid-client";

export interface ProviderConfiguration {
	clientID: string;
	clientSecret: string;
	redirectURI: string;
	scopes: readonly string[];
}

export interface AuthorizationOptions {
	parameters?: Readonly<Record<string, string | boolean>>;
}

/** Keep this value in the initiating session and consume it when handling the callback. */
export interface PKCETransaction {
	state: string;
	codeVerifier: string;
	nonce?: string;
}

export interface UserInfo {
	sub: string;
	name?: string;
	preferred_username?: string;
	description?: string;
	picture?: string;
	email?: string;
}

export interface Tokens {
	accessToken: string;
	refreshToken?: string;
	/** Access token expiration as milliseconds since the Unix epoch. */
	expiresAt?: number;
}

export interface Revocation {
	type: "access_token" | "refresh_token";
	token: string;
}

export interface Provider {
	buildAuthorizationRequest(options?: AuthorizationOptions): Promise<{ url: URL; transaction: PKCETransaction }>;
	handleAuthorizationResponse(callbackUrl: URL, transaction: PKCETransaction): Promise<{ userInfo: UserInfo; tokens: Tokens }>;
	getUserInfo(input: { accessToken: string; expectedSubject: string }): Promise<UserInfo>;
	refreshAccessToken?(refreshToken: string): Promise<Tokens>;
	revokeToken?(input: Revocation): Promise<void>;
}

export type ProviderAdapter = {
	clientAuth?: oidc.ClientAuth;
	refresh?: boolean;
	revokeToken?(config: oidc.Configuration, input: Revocation): Promise<void>;
} & (
	| { server: string; getUserInfo?: never }
	| { server: oidc.ServerMetadata; getUserInfo(config: oidc.Configuration, token: string): Promise<Partial<Record<keyof UserInfo, unknown>>> }
);
