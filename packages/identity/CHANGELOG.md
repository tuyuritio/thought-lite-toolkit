# @tuyuritio/identity

## 0.2.1

### Patch Changes

- 6f45a80: Fix GitHub OAuth callback validation by updating `issuer` to `https://github.com/login/oauth` to match GitHub's RFC 9207 `iss` parameter.

## 0.2.0

### Minor Changes

- 7e550b5: Replace createClient with createIdentity router factory.

## 0.1.0

### Minor Changes

- fc6eaa2: Introduced @tuyuritio/identity for server-side OAuth 2.0 and OpenID Connect authentication.
