import type { Data, Paragraph, Root, Text } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import type { Plugin, Transformer } from "unified";
import type { Parent } from "unist";
import { SKIP, visit } from "unist-util-visit";

/** Regex to match abbreviation definitions: *[ABBR]: Definition */
const REGEX_ABBREVIATION = /^\*\[(?<abbr>[^\]]+)\]:\s*(?<title>.+)$/;

/** Data for `abbr` element */
interface AbbrData extends Data {
	hName: "abbr";
}

/** Custom `abbr` node interface */
interface Abbr extends Parent {
	type: "abbr";
	children: Text[];
	data?: AbbrData;
}

// Extend mdast types to include custom nodes
declare module "mdast" {
	interface PhrasingContentMap {
		abbr: Abbr;
	}
}

/**
 * Remark plugin to process abbreviations.
 *
 * Syntax: *[ABBR]: Definition
 *
 * @example
 * ```md
 * *[HTML]: HyperText Markup Language
 * ```
 */
const plugin: Plugin<[], Root> = () => {
	const transformer: Transformer<Root> = tree => {
		const definitions = new Map<string, string>();

		// Collect abbreviation definitions and remove them from the tree
		visit(tree, "paragraph", (node: Paragraph, index, parent) => {
			if (node.children?.length !== 1 || !parent || typeof index !== "number") return;

			const child = node.children[0];
			if (child.type !== "text") return;

			const lines = child.value.split("\n");
			const current = new Map<string, string>();
			for (const line of lines) {
				const match = line.match(REGEX_ABBREVIATION);
				if (!match) return;

				const [, abbr, title] = match;
				current.set(abbr.trim(), title.trim());
			}

			if (current.size > 0) {
				for (const [abbr, title] of current) definitions.set(abbr, title);

				// Remove the abbreviation definition from the tree
				parent.children.splice(index, 1);

				return [SKIP, index];
			}
		});

		// Replace abbreviations in text nodes
		if (definitions.size > 0) {
			findAndReplace(
				tree,
				[
					new RegExp(`\\b(${Array.from(definitions.keys()).join("|")})\\b`, "g"),
					match => ({
						type: "abbr",
						children: [{ type: "text", value: match }],
						data: { hName: "abbr", hProperties: { title: definitions.get(match) } }
					})
				],
				{ ignore: ["link", "code", "inlineCode"] }
			);
		}
	};

	return transformer;
};

export default plugin;
