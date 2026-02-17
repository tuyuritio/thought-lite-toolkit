import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import remarkGitHubAlert from ".";

const process = async (markdown: string, options?: any) => {
	const result = await unified()
		.use(remarkParse)
		.use(remarkGitHubAlert, options)
		.use(remarkRehype)
		.use(rehypeStringify)
		.process(markdown);
	return result.toString();
};

describe("remark-github-alerts", () => {
	it("should transform a basic [!NOTE] alert", async () => {
		const input = "> [!NOTE]\n> This is a note.";
		const output = await process(input);

		expect(output).toContain('<div class="markdown-alert markdown-alert-note">');
		expect(output).toContain('<p class="markdown-alert-title">');
		expect(output).toContain("<strong>Note</strong>");
		expect(output).toContain("<p>This is a note.</p>");
	});

	it("should support all alert types with correct icons", async () => {
		const types = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
		for (const type of types) {
			const output = await process(`> [!${type}]`);
			expect(output).toContain(`markdown-alert-${type.toLowerCase()}`);
		}
	});

	it("should use custom title when provided", async () => {
		const input = "> [!TIP] Useful Information\n> Content here.";
		const output = await process(input);

		expect(output).toContain("<strong>Useful Information</strong>");
	});

	describe("options: typeFormat", () => {
		const input = "> [!IMPORTANT]";

		it('should capitalize by default ("capitalize")', async () => {
			const output = await process(input);
			expect(output).toContain("<strong>Important</strong>");
		});

		it('should support "uppercase"', async () => {
			const output = await process(input, { typeFormat: "uppercase" });
			expect(output).toContain("<strong>IMPORTANT</strong>");
		});

		it('should support "original"', async () => {
			const output = await process(input, { typeFormat: "original" });
			// The regex match[1] returns exactly what was in the brackets
			expect(output).toContain("<strong>IMPORTANT</strong>");
		});
	});

	it("should not transform regular blockquotes", async () => {
		const input = "> This is just a quote.";
		const output = await process(input);

		expect(output).toContain("<blockquote>");
		expect(output).not.toContain("markdown-alert");
	});

	it("should handle multi-line content correctly", async () => {
		const input = "> [!WARNING]\n> Line 1\n>\n> Line 2";
		const output = await process(input);

		expect(output).toContain("<p>Line 1</p>");
		expect(output).toContain("<p>Line 2</p>");
	});
});
