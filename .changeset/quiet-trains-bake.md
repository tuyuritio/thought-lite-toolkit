---
"@tuyuritio/identity": patch
---

Fix GitHub OAuth callback validation by updating `issuer` to `https://github.com/login/oauth` to match GitHub's RFC 9207 `iss` parameter.
