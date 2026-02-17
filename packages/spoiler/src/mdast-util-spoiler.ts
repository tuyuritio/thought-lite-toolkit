import type { Spoiler } from "./types";

/**
 * Create an extension for `mdast-util-from-markdown` to handle spoiler tokens
 * produced by the micromark spoiler syntax extension.
 *
 * Converts `spoiler` / `spoilerText` tokens into a `Spoiler` mdast node with
 * `data.hName = "span"` and `data.hProperties.className = ["spoiler"]` so that
 * `remark-rehype` produces `<span class="spoiler">…</span>`.
 */
export function spoilerFromMarkdown() {
	return {
		canContainEols: ["spoiler"],
		enter: {
			spoiler(this: { enter: (node: Spoiler, token: unknown) => void }, token: unknown) {
				this.enter(
					{
						type: "spoiler",
						children: [],
						data: {
							hName: "span",
							hProperties: { className: ["spoiler"] }
						}
					},
					token
				);
			}
		},
		exit: {
			spoiler(this: { exit: (token: unknown) => void }, token: unknown) {
				this.exit(token);
			}
		}
	};
}

/**
 * Create an extension for `mdast-util-to-markdown` to serialize `Spoiler`
 * mdast nodes back to the `!!content!!` syntax.
 */
export function spoilerToMarkdown() {
	return {
		unsafe: [{ character: "!", inConstruct: "phrasing", after: "!" }],
		handlers: {
			spoiler(
				node: Spoiler,
				_parent: unknown,
				state: {
					createTracker: (info: unknown) => { move: (v: string) => string; current: () => Record<string, unknown> };
					enter: (construct: string) => () => void;
					containerPhrasing: (node: Spoiler, info: Record<string, unknown>) => string;
				},
				info: unknown
			) {
				const tracker = state.createTracker(info);
				const exit = state.enter("spoiler");
				let value = tracker.move("!!");
				value += state.containerPhrasing(node, {
					...tracker.current(),
					before: value,
					after: "!"
				});
				value += tracker.move("!!");
				exit();
				return value;
			}
		}
	};
}
