import discord from "./providers/discord";
import facebook from "./providers/facebook";
import github from "./providers/github";
import google from "./providers/google";
import { buildClient } from "./providers/index";
import microsoft from "./providers/microsoft";
import slack from "./providers/slack";
import x from "./providers/x";
import type { Identity, Provider, ProviderAdapter, ProviderConfiguration } from "./types";

const adapters = { discord, facebook, github, google, microsoft, slack, x } satisfies Record<string, ProviderAdapter>;

export type ProviderName = keyof typeof adapters;
export type IdentityConfiguration = Partial<Record<ProviderName, ProviderConfiguration | undefined>>;

export { OAuthError } from "./error";
export type {
	AuthorizationOptions,
	Identity,
	PKCETransaction as OAuthTransaction,
	ProviderConfiguration,
	Revocation,
	Tokens as OAuthTokens,
	UserInfo as OAuthUserInfo
} from "./types";

/**
 * Creates a configured identity router for the enabled OAuth 2.0 / OpenID Connect providers.
 * Provider clients are initialized lazily on first use and cached for subsequent requests.
 * @param configurations - Map of provider names to their client configurations (`undefined` entries are ignored)
 * @returns An Identity router that dispatches OAuth operations by provider name
 * @throws {TypeError} If an unknown provider name is supplied in `configurations`
 */
export function createIdentity(configurations: IdentityConfiguration): Identity<ProviderName> {
	const configs = new Map<ProviderName, ProviderConfiguration>();
	for (const [name, config] of Object.entries(configurations)) {
		if (!config) continue;
		if (!Object.hasOwn(adapters, name)) throw new TypeError(`Unknown OAuth provider: ${name}`);
		configs.set(name as ProviderName, config);
	}

	const enabled = Object.freeze([...configs.keys()]);
	const clients = new Map<ProviderName, Promise<Provider>>();

	function getClient(provider: ProviderName): Promise<Provider> {
		const config = configs.get(provider);
		if (!config) throw new TypeError(`Unconfigured OAuth provider: ${provider}`);
		let client = clients.get(provider);
		if (!client) {
			client = buildClient(config, adapters[provider]).catch(error => {
				clients.delete(provider);
				throw error;
			});
			clients.set(provider, client);
		}
		return client;
	}

	return {
		providers: enabled,
		has(provider: string): provider is ProviderName {
			return configs.has(provider as ProviderName);
		},
		async buildAuthorizationRequest(provider, options) {
			return (await getClient(provider)).buildAuthorizationRequest(options);
		},
		async handleAuthorizationResponse(provider, callbackUrl, transaction) {
			return (await getClient(provider)).handleAuthorizationResponse(callbackUrl, transaction);
		},
		async getUserInfo(provider, input) {
			return (await getClient(provider)).getUserInfo(input);
		},
		async refreshAccessToken(provider, refreshToken) {
			const client = await getClient(provider);
			if (!client.refreshAccessToken) throw new TypeError(`Provider "${provider}" does not support token refresh`);
			return client.refreshAccessToken(refreshToken);
		},
		async revokeToken(provider, input) {
			const client = await getClient(provider);
			if (!client.revokeToken) throw new TypeError(`Provider "${provider}" does not support token revocation`);
			return client.revokeToken(input);
		}
	};
}
