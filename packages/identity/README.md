# @tuyuritio/identity

Server-side OAuth 2.0 and OpenID Connect clients.

```ts
import { createClient } from "@tuyuritio/identity";

const google = await createClient("google", {
	clientID,
	clientSecret,
	redirectURI: "https://example.com/auth/google/callback",
	scopes: ["profile"]
});

// In the login route
const { url, transaction } = await google.buildAuthorizationRequest({
	parameters: { access_type: "offline" }
});
await storeLoginTransaction(transaction);
return Response.redirect(url, 302);
```

In the callback route, read and consume the transaction from the same session, then pass the complete callback URL to `handleAuthorizationResponse()`.

```ts
const transaction = await consumeLoginTransaction();
const { userInfo, tokens } = await google.handleAuthorizationResponse(new URL(request.url), transaction);
```

The storage functions in the example belong to the application. Keep the transaction in a short-lived, integrity-protected session and consume it once. Configure the same provider, client credentials, and redirect URI in both routes. Use an absolute HTTP(S) redirect URI without a query or fragment.

Use the provider name and `userInfo.sub` together as the external account key. Pass that subject as `expectedSubject` to `getUserInfo()` when synchronizing a stored account. OIDC providers always request the `openid` scope.

Configure `scopes` on `createClient()`. `buildAuthorizationRequest()` forwards provider-specific `parameters` such as Google's `login_hint`. Protocol parameters (`redirect_uri`, `scope`, `state`, PKCE, and `nonce`) always take precedence.

`refreshAccessToken()` and `revokeToken()` are available where the provider supports them. After a refresh, save the returned access token and expiry. Preserve the previous refresh token if the response omits a replacement. Revocation follows the provider's rules and can invalidate related credentials. GitHub requests single-token revocation.

## Protocol terminology

| Method | Protocol step | Behavior |
| --- | --- | --- |
| `createClient()` | [Client](https://www.rfc-editor.org/rfc/rfc6749.html#section-1.1) | Configures an OAuth client for the selected provider. |
| `buildAuthorizationRequest()` | [Authorization Request](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.1) | Builds the authorization URL and returns the login transaction. OpenID Connect calls this an [Authentication Request](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest). |
| `handleAuthorizationResponse()` | [Authorization Response](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) and [Access Token Request](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.3) | Validates the callback, exchanges the authorization code, and fetches the normalized user info. Returns both the tokens and the user info. |
| `getUserInfo()` | [UserInfo Request](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoRequest) for OpenID Connect | Fetches normalized user info (`sub`, `name`, `preferred_username`, `description`, `picture`, `email`) and checks its subject. Non-OIDC providers use their own user endpoints. |
| `refreshAccessToken()` | [Refreshing an Access Token](https://www.rfc-editor.org/rfc/rfc6749.html#section-6) | Uses a refresh token to obtain a new access token. |
| `revokeToken()` | [Token Revocation](https://www.rfc-editor.org/rfc/rfc7009.html#section-2) | Requests revocation of the specified token. |
