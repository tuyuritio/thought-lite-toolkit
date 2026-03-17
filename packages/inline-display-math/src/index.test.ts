import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import remarkInlineDisplayMath from ".";

async function process(markdown: string, options?: Parameters<typeof remarkInlineDisplayMath>[0]) {
	const result = await unified()
		.use(remarkParse)
		.use(remarkMath)
		.use(remarkInlineDisplayMath, options)
		.use(remarkRehype)
		.use(rehypeStringify)
		.process(markdown);

	return result.toString();
}

describe("remark-inline-display-math", () => {
	/**
	 * === Block Mode ===
	 */
	describe('mode="block"', () => {
		/**
		 * delimiter detection
		 */

		it("should keep $...$ as inline math", async () => {
			const output = await process("test $x^2$ test", { layout: "block" });

			expect(output).toContain("math-inline");
			expect(output).not.toContain("math-display");
		});

		it("should convert $$...$$ to display math", async () => {
			const output = await process("test $$x^2$$ test", { layout: "block" });

			expect(output).toContain("math-display");
			expect(output.match(/<p>/g)?.length).toBe(2);
		});

		it("should distinguish $ and $$ correctly", async () => {
			const output = await process("$x$ $$y$$", { layout: "block" });

			expect(output).toContain("math-inline");
			expect(output).toContain("math-display");
		});
		
		it("should support multiple display math", async () => {
			const output = await process("$$a$$ $$b$$ $$c$$", { layout: "block" });
			
			expect(output.match(/math-display/g)?.length).toBe(3);
		});

		/**
		 * paragraph splitting
		 */

		it("should split paragraph around display math", async () => {
			const output = await process("before $$x^2$$ after", { layout: "block" });

			expect(output).toContain("before");
			expect(output).toContain("math-display");
			expect(output).toContain("after");
			expect(output.match(/<p>/g)?.length).toBe(2);
		});

		it("should preserve punctuation near math", async () => {
			const output = await process("text $$x^2$$, next", { layout: "block" });

			expect(output).toContain("math-display");
			expect(output).toContain(", next");
			expect(output.match(/<p>/g)?.length).toBe(2);
		});

		/**
		 * container hierarchy
		 */

		it("should preserve list hierarchy", async () => {
			const output = await process(`\n1. before $$x^2$$ after\n`, { layout: "block" });

			expect(output).toContain("<ol>");
			expect(output).toContain("<li>");
			expect(output).toContain("math-display");
		});

		it("should preserve blockquote hierarchy", async () => {
			const output = await process(`\n> before $$x^2$$ after\n`, { layout: "block" });

			expect(output).toContain("<blockquote>");
			expect(output).toContain("math-display");
		});

		it("should preserve nested quote + list hierarchy", async () => {
			const output = await process(`\n> 1. before $$x^2$$ after\n`, { layout: "block" });

			expect(output).toContain("<blockquote>");
			expect(output).toContain("<ol>");
			expect(output).toContain("<li>");
			expect(output).toContain("math-display");
		});

		/**
		 * real world case
		 */

		it("should handle complex academic example", async () => {
			const output = await process(`\n1. $\\mathbb{E}[R_{t+1}|S_{t}=s]$:$$\\begin{align}\na &= b + c\n\\end{align}$$\n`, { layout: "block" });

			expect(output).toContain("math-inline");
			expect(output).toContain("math-display");
		});
	});

	/**
	 * === Displaystyle Mode (default) ===
	 */
	describe('mode="displaystyle"', () => {
		it("should keep $...$ as normal inline math", async () => {
			const output = await process("test $x^2$ test");

			expect(output).not.toContain("math-display");
			expect(output).not.toContain("math-displaystyle");
		});

		it("should rewrite $$...$$ as displaystyle inline math", async () => {
			const output = await process("test $$x^2$$ test");

			expect(output).toContain("math-displaystyle");
			expect(output.match(/<p>/g)?.length).toBe(1);
		});

		it("should distinguish $ and $$ correctly", async () => {
			const output = await process("$x$ $$y$$");

			expect(output).toContain("math-displaystyle");
			expect(output.match(/<p>/g)?.length).toBe(1);
		});

		it("should support multiple displaystyle inline math", async () => {
			const output = await process("$$a$$ $$b$$ $$c$$");

			expect(output.match(/math-displaystyle/g)?.length).toBe(3);
			expect(output.match(/<p>/g)?.length).toBe(1);
		});

		it("should not split paragraph around $$...$$", async () => {
			const output = await process("before $$x^2$$ after");

			expect(output).toContain("<p>");
			expect(output).toContain("before");
			expect(output).toContain("after");
			expect(output).toContain("math-displaystyle");
			expect(output.match(/<p>/g)?.length).toBe(1);
		});

		it("should preserve punctuation near inline displaystyle math", async () => {
			const output = await process("text $$x^2$$, next");

			expect(output).toContain("math-displaystyle");
			expect(output).toContain(", next");
			expect(output.match(/<p>/g)?.length).toBe(1);
		});

		it("should preserve list hierarchy without promoting to block math", async () => {
			const output = await process(`\n1. before $$x^2$$ after\n`);

			expect(output).toContain("<ol>");
			expect(output).toContain("<li>");
			expect(output).toContain("math-displaystyle");
		});

		it("should preserve blockquote hierarchy without promoting to block math", async () => {
			const output = await process(`\n> before $$x^2$$ after\n`);

			expect(output).toContain("<blockquote>");
			expect(output).toContain("math-displaystyle");
		});

		it("should preserve nested quote + list hierarchy without promoting to block math", async () => {
			const output = await process(`\n> 1. before $$x^2$$ after\n`);

			expect(output).toContain("<blockquote>");
			expect(output).toContain("<ol>");
			expect(output).toContain("<li>");
			expect(output).toContain("math-displaystyle");
		});

		it("should handle complex academic example in displaystyle mode", async () => {
			const output = await process(`\n1. $\\mathbb{E}[R_{t+1}|S_{t}=s]$:$$\\begin{align}\na &= b + c\n\\end{align}$$\n`);

			expect(output).toContain("math-displaystyle");
		});
	});
});
