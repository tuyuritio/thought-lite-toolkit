import type { Data, PhrasingContent, Root } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import type { Plugin, Transformer } from "unified";
import type { Parent } from "unist";
import { u } from "unist-builder";

/** Data for ruby parenthesis (`rp`) element */
interface RubyParenthesisData extends Data {
	hName: "rp";
}

/** Specific node for ruby parenthesis (`rp`) */
interface RubyParenthesis extends Parent {
	type: "rp";
	children: PhrasingContent[];
	data?: RubyParenthesisData;
}

/** Data for ruby text (`rt`) element */
interface RubyTextData extends Data {
	hName: "rt";
}

/** Specific node for ruby text (`rt`) */
interface RubyText extends Parent {
	type: "rt";
	children: PhrasingContent[];
	data?: RubyTextData;
}

/** Data for `ruby` element */
interface RubyData extends Data {
	hName: "ruby";
}

/** Root node of a ruby transformation, wrapping base text and readings */
interface Ruby extends Parent {
	type: "ruby";
	children: PhrasingContent[];
	data?: RubyData;
}

// Extend mdast types to include custom nodes
declare module "mdast" {
	interface PhrasingContentMap {
		ruby: Ruby;
		rp: RubyParenthesis;
		rt: RubyText;
	}
}

/**
 * Regex to capture the ruby syntax: `{base}(reading)`
 * - Group 1: The base text.
 * - Group 2: The reading text (supports `|` as a separator).
 */
const REGEX_RUBY = /\{([^{}]+?)\}\(([^()]+?)\)/g;

/**
 * Remark plugin to convert `{base}(reading)` syntax to `<ruby>` HAST node tree.
 *
 * This plugin supports two modes of operation:
 * 1. **Group Mode**: `{漢字}(かんじ)` -> A single ruby block for the whole word.
 * 2. **Character-by-Character Mode**: `{漢字}(かん|じ)` -> Distributed readings per character, triggered when the number of `|` separators matches the base length.
 *
 * @example
 * ```md
 * {今日}(きょう)
 * ```
 *
 * ```md
 * {拼音}(pīn|yīn)
 * ```
 *
 * ```md
 * {振り仮名}(ふ||が|な)
 * ```
 */
const plugin: Plugin<[], Root> = () => {
	const transformer: Transformer<Root> = tree => {
		findAndReplace(tree, [
			REGEX_RUBY,
			(_, base: string, ruby: string) => {
				const bases = Array.from(base);
				const readings = ruby.split("|");

				const children: PhrasingContent[] = [];

				if (bases.length === readings.length) {
					// Character-by-character ruby mode
					bases.forEach((char, index) => {
						children.push(u("text", char));

						const reading = readings[index].trim();
						if (reading) children.push({ type: "rp", children: [u("text", "(")], data: { hName: "rp" } });
						children.push({ type: "rt", children: [u("text", reading)], data: { hName: "rt" } });
						if (reading) children.push({ type: "rp", children: [u("text", ")")], data: { hName: "rp" } });
					});
				} else {
					// Group ruby mode
					children.push(u("text", base));
					children.push({ type: "rp", children: [u("text", "(")], data: { hName: "rp" } });
					children.push({ type: "rt", children: [u("text", ruby)], data: { hName: "rt" } });
					children.push({ type: "rp", children: [u("text", ")")], data: { hName: "rp" } });
				}

				return { type: "ruby", children, data: { hName: "ruby" } };
			}
		]);
	};

	return transformer;
};

export default plugin;
