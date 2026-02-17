import { defineConfig } from "vitest/config";

// See https://vitest.dev/config/ for more details.
export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts"],
		exclude: ["**/node_modules/**", "**/dist/**"]
	}
});
