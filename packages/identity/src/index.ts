import discord from "./providers/discord";
import facebook from "./providers/facebook";
import github from "./providers/github";
import google from "./providers/google";
import { buildClient } from "./providers/index";
import microsoft from "./providers/microsoft";
import slack from "./providers/slack";
import x from "./providers/x";
import type { Provider, ProviderAdapter, ProviderConfiguration } from "./types";

const providers = { discord, facebook, github, google, microsoft, slack, x } satisfies Record<string, ProviderAdapter>;

export type ProviderName = keyof typeof providers;

export { OAuthError } from "./error";
export type {
	AuthorizationOptions,
	PKCETransaction as OAuthTransaction,
	Provider as OAuthProvider,
	ProviderConfiguration,
	Revocation,
	Tokens as OAuthTokens,
	UserInfo as OAuthUserInfo
} from "./types";

/**
 * Creates an OAuth client for the specified provider using the provided configuration
 * @param provider - The name of the OAuth provider (e.g., "github", "google", "x")
 * @param configuration - The configuration object containing client ID, client secret, redirect URI, and scopes
 * @returns A promise that resolves to an OAuthProvider instance for the specified provider
 * @throws {TypeError} If the specified provider is not recognized
 */
export async function createClient(provider: ProviderName, configuration: ProviderConfiguration): Promise<Provider> {
	if (!Object.hasOwn(providers, provider)) throw new TypeError(`Unknown OAuth provider: ${provider}`);
	return buildClient(configuration, providers[provider]);
}
