import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeTableWrapper from ".";

/**
 * Helper function to process HTML content with the rehype-table-wrapper plugin.
 *
 * @param html - The HTML content to process.
 * @param options - Optional configuration for the plugin.
 * @returns The processed HTML as a string.
 */
const process = async (html: string, options = {}) => {
	const result = await unified().use(rehypeParse, { fragment: true }).use(rehypeTableWrapper, options).use(rehypeStringify).process(html);
	return result.toString();
};

describe("rehype-table-wrapper", () => {
	it("should wrap tables in a div with the default class name", async () => {
		const input = "<table><thead><tr><th>Title</th></tr></thead></table>";
		const output = await process(input);

		expect(output).toBe('<div class="table-wrapper"><table><thead><tr><th>Title</th></tr></thead></table></div>');
	});

	it("should use a custom class name when provided", async () => {
		const input = "<table></table>";
		const output = await process(input, { className: "custom-scroll" });

		expect(output).toContain('<div class="custom-scroll"><table>');
	});

	it("should not wrap tables that are already wrapped", async () => {
		const input = '<div class="table-wrapper"><table></table></div>';
		const output = await process(input);

		const wrapperCount = (output.match(/class="table-wrapper"/g) || []).length;
		expect(wrapperCount).toBe(1);
	});

	it("should wrap multiple tables in the same document", async () => {
		const input = "<table></table><p>text</p><table></table>";
		const output = await process(input);

		expect(output).toBe('<div class="table-wrapper"><table></table></div><p>text</p><div class="table-wrapper"><table></table></div>');
	});
});
