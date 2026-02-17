import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkAbbreviation from "../src/index";

/**
 * Helper function to process markdown content with the remark abbreviation plugin.
 *
 * @param markdown - The markdown content to process.
 * @returns The processed markdown as a string.
 */
async function process(markdown: string) {
	const result = await unified().use(remarkParse).use(remarkAbbreviation).use(remarkRehype).use(rehypeStringify).process(markdown);
	return result.toString();
}

describe("remark-abbreviation", () => {
	it("should replace abbreviations with <abbr> elements and remove definitions", async () => {
		const input = `
HTML is a markup language.

*[HTML]: HyperText Markup Language
`;
		const output = await process(input);

		expect(output).not.toContain("*[HTML]");
		expect(output).not.toContain('*[<abbr title="HyperText Markup Language">HTML</abbr>]');
		expect(output).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
	});

	it("should only replace whole word matches, not substrings", async () => {
		const input = `
HTML5 is the latest version of HTML.

*[HTML]: HyperText
`;
		const output = await process(input);

		expect(output).toContain("HTML5");
		expect(output).toContain('<abbr title="HyperText">HTML</abbr>');
	});

	it("should handle multiple abbreviations in the same document", async () => {
		const input = `
Rust and TS are popular programming languages.

*[Rust]: Rust Programming Language
*[TS]: TypeScript
`;
		const output = await process(input);

		expect(output).toContain('<abbr title="Rust Programming Language">Rust</abbr>');
		expect(output).toContain('<abbr title="TypeScript">TS</abbr>');
	});

	it("", async () => {
		const input = `
*[NOT_A_DEFINITION]
这只是一行普通的文本。
`;
		const output = await process(input);

		expect(output).toContain("*[NOT_A_DEFINITION]");
	});
});
