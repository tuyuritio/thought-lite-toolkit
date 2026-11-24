import { OAuthError } from "../error";
import type { ProviderAdapter } from "../types";

export default {
	server: "https://slack.com",
	refresh: true,

	async revokeToken(_config, { token, type }) {
		if (type !== "access_token") throw new TypeError("Slack revokes access tokens");
		const response = await fetch("https://slack.com/api/auth.revoke", {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!response.ok) throw new OAuthError("revocation_failed", `Slack token revocation failed with HTTP ${response.status}`);

		const payload = (await response.json()) as { ok?: boolean; error?: string } | null;
		if (!payload?.ok) throw new OAuthError("revocation_failed", `Slack token revocation failed: ${payload?.error ?? "unknown error"}`);
	}
} satisfies ProviderAdapter;
