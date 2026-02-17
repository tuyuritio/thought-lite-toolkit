import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import remarkAttribute from ".";

/**
 * Helper function to process markdown content with the remark attribute plugin.
 *
 * @param markdown - The markdown content to process.
 * @returns The processed markdown as a string.
 */
async function process(markdown: string) {
	const result = await unified().use(remarkParse).use(remarkAttribute).use(remarkRehype).use(rehypeStringify).process(markdown);
	return result.toString();
}

describe("remark-attribute", () => {
	it("should parse attributes for headings", async () => {
		const input = "## Heading {#custom-id .class-name}";
		const output = await process(input);

		expect(output).toContain('<h2 id="custom-id" class="class-name">Heading</h2>');
	});

	it("should parse multiple classes for headings", async () => {
		const input = "## Heading {.class1 .class2}";
		const output = await process(input);

		expect(output).toContain('<h2 class="class1 class2">Heading</h2>');
	});

	it("should parse key-value attributes for headings", async () => {
		const input = '## Heading {attr="value" data-test=123}';
		const output = await process(input);

		expect(output).toContain('<h2 attr="value" data-test="123">Heading</h2>');
	});

	it("should parse attributes for links", async () => {
		const input = "[text](url){target=_blank .external}";
		const output = await process(input);

		expect(output).toContain('<a href="url" target="_blank" class="external">text</a>');
	});

	it("should parse attributes for images", async () => {
		const input = "![alt](img.png){width=500 .responsive}";
		const output = await process(input);

		expect(output).toContain('<img src="img.png" alt="alt" width="500" class="responsive">');
	});

	it("should parse attributes for strong text", async () => {
		const input = "**bold text**{.red-text}";
		const output = await process(input);

		expect(output).toContain('<strong class="red-text">bold text</strong>');
	});

	it("should parse attributes for emphasis text", async () => {
		const input = "*italic text*{.blue-text}";
		const output = await process(input);

		expect(output).toContain('<em class="blue-text">italic text</em>');
	});

	it("should parse attributes for inline code", async () => {
		const input = "`code`{.highlight}";
		const output = await process(input);

		expect(output).toContain('<code class="highlight">code</code>');
	});

	it("should handle text after attribute wrapper", async () => {
		const input = "**bold**{.red} and normal text";
		const output = await process(input);

		expect(output).toContain('<strong class="red">bold</strong> and normal text');
	});

	it("should handle complex attribute values with quotes", async () => {
		const input = '## Heading {title="Hello World" data-info=\'Some "info"\'}';
		const output = await process(input);

		expect(output).toContain('<h2 title="Hello World" data-info="Some &#x22;info&#x22;">Heading</h2>');
	});

	it("should not affect elements without attributes", async () => {
		const input = "## Normal Heading\n\n[normal link](url)\n\n**normal bold**";
		const output = await process(input);

		expect(output).toContain("<h2>Normal Heading</h2>");
		expect(output).toContain('<a href="url">normal link</a>');
		expect(output).toContain("<strong>normal bold</strong>");
	});

	it("should handle attributes with only keys (boolean-like)", async () => {
		const input = "## Heading {data-disabled}";
		const output = await process(input);

		expect(output).toContain('<h2 data-disabled="">Heading</h2>');
	});

	it("should handle multiple elements with attributes in the same line", async () => {
		const input = "**bold**{.red} and *italic*{.blue}";
		const output = await process(input);

		expect(output).toContain('<strong class="red">bold</strong>');
		expect(output).toContain('<em class="blue">italic</em>');
	});

	it("should handle attributes with spaces and different quotes", async () => {
		const input = "[link1](url){title=\"double quotes\"} and [link2](url){title='single quotes'}";
		const output = await process(input);

		expect(output).toContain('<a href="url" title="double quotes">link1</a>');
		expect(output).toContain('<a href="url" title="single quotes">link2</a>');
	});
});
