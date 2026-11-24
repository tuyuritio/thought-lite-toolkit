export class OAuthError extends Error {
	constructor(
		public readonly code: "invalid_transaction" | "invalid_callback" | "invalid_userinfo" | "subject_mismatch" | "revocation_failed",
		message: string
	) {
		super(message);
		this.name = "OAuthError";
	}
}
