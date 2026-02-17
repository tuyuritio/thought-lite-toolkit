import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import type { Plugin, Transformer } from "unified";

interface Options {
	/**
	 * The CSS class name to apply to the wrapper div.
	 * @default "table-wrapper"
	 */
	className?: string;
}

/**
 * Rehype plugin to wrap table elements in a div with a specified class name.
 *
 * @example
 * Input:  <table>...</table>
 *
 * Output: <div class="table-wrapper">
 *           <table>...</table>
 *         </div>
 */
const plugin: Plugin<[Options?], Root> = (options = {}) => {
	const className = options.className || "table-wrapper";

	const transformer: Transformer<Root> = tree => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName === "table" && parent && typeof index === "number" && (parent as Element).tagName !== "div") {
				const wrapper: Element = {
					type: "element",
					tagName: "div",
					properties: { className: [className] },
					children: [node]
				};

				parent.children[index] = wrapper;

				return "skip";
			}
		});
	};

	return transformer;
};

export default plugin;
