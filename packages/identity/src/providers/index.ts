import * as oidc from "openid-client";
import { OAuthError } from "../error";
import type { PKCETransaction, Provider, ProviderAdapter, ProviderConfiguration, UserInfo } from "../types";
import { normalizeTokens, normalizeUserInfo } from "../utils";

/**
 * Builds an OAuth client for the specified provider using the provided configuration and adapter
 * @param configuration - The configuration object containing client ID, client secret, redirect URI, and scopes
 * @param adapter - The provider adapter that implements the necessary methods for the OAuth flow
 * @returns A promise that resolves to an OAuthProvider instance for the specified provider
 * @throws {OAuthError} If the OAuth flow fails at any step
 * @throws {TypeError} If the provided adapter does not implement the required methods
 */
export async function buildClient(
	{ clientID, clientSecret, redirectURI, scopes }: ProviderConfiguration,
	adapter: ProviderAdapter
): Promise<Provider> {
	const { server, clientAuth, getUserInfo, refresh, revokeToken } = adapter;

	// Determine if the provider is an OIDC provider based on the server property in the adapter
	const isOIDC = typeof server === "string";
	const config = isOIDC
		? await oidc.discovery(new URL(server), clientID, clientSecret, clientAuth)
		: new oidc.Configuration(server, clientID, clientSecret, clientAuth);

	const redirect = new URL(redirectURI);
	const scope = [...new Set(isOIDC ? ["openid", ...scopes] : scopes)].join(" ");

	/** Reads the user's information from the provider */
	async function readUserInfo(accessToken: string, expectedSubject?: string): Promise<UserInfo> {
		if (getUserInfo) return normalizeUserInfo(await getUserInfo(config, accessToken));
		if (!expectedSubject) throw new OAuthError("invalid_userinfo", "OIDC login did not supply an account subject");
		return normalizeUserInfo(await oidc.fetchUserInfo(config, accessToken, expectedSubject));
	}

	return {
		async buildAuthorizationRequest(options) {
			// Build the authorization request parameters
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(options?.parameters ?? {})) params.set(key, String(value));

			// Set the scope parameter
			if (scope) params.set("scope", scope);

			// Generate a new OAuth transaction and set the required parameters
			const transaction: PKCETransaction = {
				state: oidc.randomState(),
				codeVerifier: oidc.randomPKCECodeVerifier(),
				...(isOIDC && { nonce: oidc.randomNonce() })
			};

			// Set the redirect URI parameter for the authorization request
			params.set("redirect_uri", redirect.href);

			// Set the required parameters for PKCE and state management
			params.set("state", transaction.state);
			params.set("code_challenge_method", "S256");
			params.set("code_challenge", await oidc.calculatePKCECodeChallenge(transaction.codeVerifier));
			if (transaction.nonce) params.set("nonce", transaction.nonce);

			return { url: oidc.buildAuthorizationUrl(config, params), transaction };
		},

		async handleAuthorizationResponse(callbackUrl, transaction) {
			// Validate the OAuth transaction and the callback URL against the configured redirect URI
			if (!transaction?.state || !transaction.codeVerifier || (isOIDC && !transaction.nonce)) {
				throw new OAuthError("invalid_transaction", "Invalid OAuth login transaction");
			}

			// Validate the callback URL against the configured redirect URI
			if (callbackUrl.origin !== redirect.origin || callbackUrl.pathname !== redirect.pathname) {
				throw new OAuthError("invalid_callback", "OAuth callback does not match the configured redirect URI");
			}

			// Exchange the authorization code for access and refresh tokens
			const response = await oidc.authorizationCodeGrant(config, callbackUrl, {
				expectedState: transaction.state,
				pkceCodeVerifier: transaction.codeVerifier,
				expectedNonce: isOIDC ? transaction.nonce : undefined
			});

			// Normalize the tokens and read the user's info
			const tokens = normalizeTokens(response);
			const userInfo = await readUserInfo(tokens.accessToken, isOIDC ? response.claims()?.sub : undefined);

			return { tokens, userInfo };
		},

		async getUserInfo({ accessToken, expectedSubject }) {
			// Validate the expected subject against the OAuth userinfo
			if (!expectedSubject) throw new OAuthError("subject_mismatch", "Expected OAuth subject is required");

			// Read the user's info
			const userInfo = await readUserInfo(accessToken, expectedSubject);

			// Validate that the subject in the userinfo matches the expected subject
			if (userInfo.sub !== expectedSubject) throw new OAuthError("subject_mismatch", "OAuth userinfo does not match the expected subject");

			return userInfo;
		},

		// If the adapter supports token refresh, provide a method to refresh the access token
		refreshAccessToken: refresh ? async token => normalizeTokens(await oidc.refreshTokenGrant(config, token)) : undefined,

		// If the adapter supports token revocation, provide a method to revoke the access or refresh token
		revokeToken:
			revokeToken?.bind(adapter, config) ??
			(config.serverMetadata().revocation_endpoint
				? ({ type, token }) => oidc.tokenRevocation(config, token, { token_type_hint: type })
				: undefined)
	};
}
