import type { Root } from "mdast";
import type { Plugin } from "unified";
import { spoilerFromMarkdown, spoilerToMarkdown } from "./mdast-util-spoiler";
import { spoilerSyntax } from "./micromark-extension-spoiler";

/**
 * Remark plugin to support spoiler syntax.
 *
 * Turns `!!text!!` into `<span class="spoiler">text</span>`.
 *
 * Works at the micromark (tokenizer) level so that inline constructs such as
 * emphasis, links, and code spans inside spoilers are handled correctly.
 */
const plugin: Plugin<[], Root> = function () {
	const data = this.data() as Record<string, unknown[]>;

	const add = (key: string, value: unknown) => {
		const list = data[key] ?? (data[key] = []);
		list.push(value);
	};

	add("micromarkExtensions", spoilerSyntax());
	add("fromMarkdownExtensions", spoilerFromMarkdown());
	add("toMarkdownExtensions", spoilerToMarkdown());
};

export default plugin;
