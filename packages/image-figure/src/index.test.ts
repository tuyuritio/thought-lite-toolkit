import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import rehypeImageFigure from ".";

/**
 * Helper function to process HTML content with the rehype-image-figure plugin.
 *
 * @param html - The HTML content to process.
 * @returns The processed HTML as a string.
 */
const process = async (html: string) => {
	const result = await unified().use(rehypeParse, { fragment: true }).use(rehypeImageFigure).use(rehypeStringify).process(html);
	return result.toString();
};

describe("rehype-figure", () => {
	it("should transform a standalone image into a figure with figcaption", async () => {
		const input = '<p><img src="landscape.jpg" alt="A beautiful landscape"></p>';
		const output = await process(input);

		expect(output).toBe('<figure><img src="landscape.jpg" alt="A beautiful landscape"><figcaption>A beautiful landscape</figcaption></figure>');
	});

	it("should not transform if the image lacks an alt attribute", async () => {
		const input = '<p><img src="landscape.jpg"></p>';
		const output = await process(input);

		expect(output).toBe(input);
	});

	it("should not transform if the paragraph contains additional text", async () => {
		const input = '<p><img src="img.jpg" alt="desc"> Some extra text</p>';
		const output = await process(input);

		// Should remain a paragraph because node.children.length !== 1
		expect(output).toContain("<p>");
		expect(output).not.toContain("<figure>");
	});

	it("should not transform if the paragraph contains multiple images", async () => {
		const input = '<p><img src="1.jpg" alt="a"><img src="2.jpg" alt="b"></p>';
		const output = await process(input);

		expect(output).toContain("<p>");
		expect(output).not.toContain("<figure>");
	});

	it("should preserve other image properties like title or loading", async () => {
		const input = '<p><img src="a.jpg" alt="desc" title="Greeting" loading="lazy"></p>';
		const output = await process(input);

		expect(output).toContain('title="Greeting"');
		expect(output).toContain('loading="lazy"');
	});

	it("should only transform top-level paragraphs (root children)", async () => {
		const input = '<div><p><img src="a.jpg" alt="desc"></p></div>';
		const output = await process(input);

		// According to your logic (!parent || parent.type === "root")
		// This should NOT be transformed because parent is a 'div'
		expect(output).toBe(input);
	});
});
