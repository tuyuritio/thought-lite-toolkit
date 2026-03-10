import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import remarkInlineDisplayMath from ".";

async function process(markdown: string) {
	const result = await unified()
		.use(remarkParse)
		.use(remarkMath)
		.use(remarkInlineDisplayMath)
		.use(remarkRehype)
		.use(rehypeStringify)
		.process(markdown);

	return result.toString();
}

describe("remark-inline-display-math", () => {
	/**
	 * delimiter detection
	 */

	it("should keep $...$ as inline math", async () => {
		const output = await process("test $x^2$ test");

		expect(output).toContain("math-inline");
		expect(output).not.toContain("math-display");
	});

	it("should convert $$...$$ to display math", async () => {
		const output = await process("test $$x^2$$ test");

		expect(output).toContain("math-display");
	});

	it("should distinguish $ and $$ correctly", async () => {
		const output = await process("$x$ $$y$$");

		expect(output).toContain("math-inline");
		expect(output).toContain("math-display");
	});

	it("should support multiple display math", async () => {
		const output = await process("$$a$$ $$b$$ $$c$$");

		expect(output.match(/math-display/g)?.length).toBe(3);
	});

	/**
	 * paragraph splitting
	 */

	it("should split paragraph around display math", async () => {
		const output = await process("before $$x^2$$ after");

		expect(output).toContain("before");
		expect(output).toContain("math-display");
		expect(output).toContain("after");
	});

	it("should preserve punctuation near math", async () => {
		const output = await process("text $$x^2$$, next");

		expect(output).toContain("math-display");
		expect(output).toContain(", next");
	});

	/**
	 * container hierarchy
	 */

	it("should preserve list hierarchy", async () => {
		const output = await process(`
1. before $$x^2$$ after
`);

		expect(output).toContain("<ol>");
		expect(output).toContain("<li>");
		expect(output).toContain("math-display");
	});

	it("should preserve blockquote hierarchy", async () => {
		const output = await process(`
> before $$x^2$$ after
`);

		expect(output).toContain("<blockquote>");
		expect(output).toContain("math-display");
	});

	it("should preserve nested quote + list hierarchy", async () => {
		const output = await process(`
> 1. before $$x^2$$ after
`);

		expect(output).toContain("<blockquote>");
		expect(output).toContain("<ol>");
		expect(output).toContain("<li>");
		expect(output).toContain("math-display");
	});

	/**
	 * real world case
	 */

	it("should handle complex academic example", async () => {
		const output = await process(`
1. $\\mathbb{E}[R_{t+1}|S_{t}=s]$:$$\\begin{align}
a &= b + c
\\end{align}$$
`);

		expect(output).toContain("math-inline");
		expect(output).toContain("math-display");
	});
});
