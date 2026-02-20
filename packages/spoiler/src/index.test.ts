import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import remarkSpoiler from ".";

/**
 * Process Markdown to HTML with the remark-spoiler plugin.
 */
async function process(markdown: string) {
	const result = await unified().use(remarkParse).use(remarkSpoiler).use(remarkRehype).use(rehypeStringify).process(markdown);
	return result.toString();
}

/**
 * Roundtrip Markdown through parse → stringify with the remark-spoiler plugin.
 */
async function roundtrip(markdown: string) {
	const result = await unified().use(remarkParse).use(remarkSpoiler).use(remarkStringify).process(markdown);
	return result.toString().trim();
}

describe("remark-spoiler", () => {
	it("should convert basic spoiler syntax", async () => {
		const input = "!!spoiler text!!";
		const output = await process(input);

		expect(output).toBe('<p><span class="spoiler">spoiler text</span></p>');
	});

	it("should handle spoiler with bold content", async () => {
		const input = "!!**bold spoiler**!!";
		const output = await process(input);

		expect(output).toBe('<p><span class="spoiler"><strong>bold spoiler</strong></span></p>');
	});

	it("should handle spoiler with italic content", async () => {
		const input = "!!*italic spoiler*!!";
		const output = await process(input);

		expect(output).toBe('<p><span class="spoiler"><em>italic spoiler</em></span></p>');
	});

	it("should handle spoiler with inline code", async () => {
		const input = "!!`code`!!";
		const output = await process(input);

		expect(output).toBe('<p><span class="spoiler"><code>code</code></span></p>');
	});

	it("should handle spoiler in the middle of text", async () => {
		const input = "This is !!secret!! content.";
		const output = await process(input);

		expect(output).toBe('<p>This is <span class="spoiler">secret</span> content.</p>');
	});

	it("should handle multiple spoilers in one line", async () => {
		const input = "!!first!! and !!second!!";
		const output = await process(input);

		expect(output).toBe('<p><span class="spoiler">first</span> and <span class="spoiler">second</span></p>');
	});

	it("should handle spoiler containing a link", async () => {
		const input = "!![click here](https://example.com)!!";
		const output = await process(input);

		expect(output).toContain('<span class="spoiler">');
		expect(output).toContain('<a href="https://example.com">click here</a>');
	});

	it("should not match single exclamation marks", async () => {
		const input = "!not a spoiler!";
		const output = await process(input);

		expect(output).toBe("<p>!not a spoiler!</p>");
	});

	it("should not match when whitespace follows opening marker", async () => {
		const input = "!! not matched!!";
		const output = await process(input);

		expect(output).toBe("<p>!! not matched!!</p>");
	});

	it("should not match when whitespace precedes closing marker", async () => {
		const input = "!!not matched !!";
		const output = await process(input);

		expect(output).toBe("<p>!!not matched !!</p>");
	});

	it("should not match unmatched opening markers", async () => {
		const input = "!!unclosed spoiler";
		const output = await process(input);

		expect(output).toBe("<p>!!unclosed spoiler</p>");
	});

	it("should not match unmatched closing markers", async () => {
		const input = "unclosed spoiler!!";
		const output = await process(input);

		expect(output).toBe("<p>unclosed spoiler!!</p>");
	});

	it("should preserve normal image syntax", async () => {
		const input = "![alt text](image.png)";
		const output = await process(input);

		expect(output).toContain("<img");
		expect(output).toContain('alt="alt text"');
	});

	it("should not parse contiguous !!!! as two separate spoiler markers", async () => {
		const input = "!!one!!!!two!!";
		const output = await process(input);

		// Adjacent spoilers without a separator cannot be parsed because !!!!
		// is not split into two !! sequences (consistent with GFM strikethrough)
		expect(output).toBe('<p><span class="spoiler">one</span>!!two!!</p>');
	});

	it("should handle spoilers separated by text", async () => {
		const input = "!!one!! !!two!!";
		const output = await process(input);

		expect(output).toContain('<span class="spoiler">one</span>');
		expect(output).toContain('<span class="spoiler">two</span>');
	});

	it("should handle spoiler opening adjacent to CJK character followed by punctuation", async () => {
		// CJK-friendly: a CJK character before !! allows it to open even when the next character is a punctuation mark (e.g. '(' or '（')
		const input = "这是一句!!(内容)!!";
		const output = await process(input);

		expect(output).toBe('<p>这是一句<span class="spoiler">(内容)</span></p>');
	});

	it("should roundtrip spoiler through remark-stringify", async () => {
		const input = "!!spoiler text!!";
		const output = await roundtrip(input);

		expect(output).toBe("!!spoiler text!!");
	});

	it("should roundtrip spoiler with emphasis through remark-stringify", async () => {
		const input = "!!**bold spoiler**!!";
		const output = await roundtrip(input);

		expect(output).toBe("!!**bold spoiler**!!");
	});
});
