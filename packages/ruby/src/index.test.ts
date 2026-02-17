import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkRuby from ".";

/**
 * Helper function to process markdown content with the remark abbreviation plugin.
 *
 * @param content - The markdown content to process.
 * @returns The processed markdown as a string.
 */
async function process(content: string) {
	const result = await unified().use(remarkParse).use(remarkRuby).use(remarkRehype).use(rehypeStringify).process(content);
	return result.toString();
}

describe("`remark-ruby` Plugin", () => {
	it("should convert basic group ruby syntax", async () => {
		const input = "{漢字}(かんじ)";
		const output = await process(input);

		expect(output).toBe("<p><ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby></p>");
	});

	it("should support character-by-character ruby when lengths match", async () => {
		const input = "{漢字}(かん|じ)";
		const output = await process(input);

		expect(output).toBe("<p><ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp>字<rp>(</rp><rt>じ</rt><rp>)</rp></ruby></p>");
	});

	it("should handle empty readings in character-by-character mode", async () => {
		const input = "{振り仮名}(ふ||が|な)";
		const output = await process(input);

		expect(output).toBe(
			"<p><ruby>振<rp>(</rp><rt>ふ</rt><rp>)</rp>り仮<rp>(</rp><rt>が</rt><rp>)</rp>名<rp>(</rp><rt>な</rt><rp>)</rp></ruby></p>"
		);
	});

	it("should fallback to group ruby when separator count does not match base length", async () => {
		const input = "{京都市}(きょうと|し)";
		const output = await process(input);

		expect(output).toBe("<p><ruby>京都市<rp>(</rp><rt>きょうと|し</rt><rp>)</rp></ruby></p>");
	});

	it("should process multiple ruby tags in the same paragraph", async () => {
		const input = "{漢字}(かんじ) and {仮名}(かな) are used together.";
		const output = await process(input);

		expect(output).toContain("<ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>");
		expect(output).toContain("<ruby>仮名<rp>(</rp><rt>かな</rt><rp>)</rp></ruby>");
	});

	it("should handle complex characters like emojis or surrogate pairs", async () => {
		const input = "{🌟🌙}(star|moon)";
		const output = await process(input);

		expect(output).toBe("<p><ruby>🌟<rp>(</rp><rt>star</rt><rp>)</rp>🌙<rp>(</rp><rt>moon</rt><rp>)</rp></ruby></p>");
	});

	it("should not match incomplete syntax", async () => {
		const input = "{Base}only and (Reading)only or {Base}(unclosed";
		const output = await process(input);

		// Should remain as plain text within a paragraph
		expect(output).toBe("<p>{Base}only and (Reading)only or {Base}(unclosed</p>");
	});
});
