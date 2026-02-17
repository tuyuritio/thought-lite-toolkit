import type { Code, Construct, Event, Extension, Resolver, State, Token, Tokenizer, TokenizeContext } from "micromark-util-types";
import { splice } from "micromark-util-chunked";
import { classifyCharacter } from "micromark-util-classify-character";
import { resolveAll } from "micromark-util-resolve-all";

declare module "micromark-util-types" {
	interface TokenTypeMap {
		spoiler: "spoiler";
		spoilerSequence: "spoilerSequence";
		spoilerSequenceTemporary: "spoilerSequenceTemporary";
		spoilerText: "spoilerText";
	}
}

/**
 * Create a micromark extension to support spoiler syntax (`!!content!!`).
 *
 * Tokenizes sequences of exactly two exclamation marks (`!!`) as attention-like
 * markers, then pairs matching openers and closers via a resolver — similar to
 * how GFM strikethrough (`~~`) works.
 */
export function spoilerSyntax(): Extension {
	const tokenizer: Tokenizer = function (effects, ok, nok) {
		const previous = this.previous;
		const events = this.events;
		let size = 0;

		return start;

		function start(code: Code): ReturnType<State> {
			if (previous === 33 && events[events.length - 1][1].type !== "characterEscape") {
				return nok(code);
			}

			effects.enter("spoilerSequenceTemporary");
			return more(code);
		}

		function more(code: Code): ReturnType<State> {
			if (code === 33 && size < 2) {
				effects.consume(code);
				size++;
				return more;
			}

			// Require exactly 2 exclamation marks
			if (size !== 2) return nok(code);

			const before = classifyCharacter(previous);
			const after = classifyCharacter(code);

			// Left-flanking (can open): not followed by whitespace, and either
			// not followed by punctuation or preceded by whitespace/punctuation.
			const open = !!(!after || (after === 2 && before));
			// Right-flanking (can close): not preceded by whitespace, and either
			// not preceded by punctuation or followed by whitespace/punctuation.
			const close = !!(!before || (before === 2 && after));

			const token = effects.exit("spoilerSequenceTemporary");
			token._open = open;
			token._close = close;

			return ok(code);
		}
	};

	const resolveAllSpoiler: Resolver = (events: Event[], context: TokenizeContext): Event[] => {
		let index = -1;

		// Walk forward through all events to find matching opener/closer pairs
		while (++index < events.length) {
			if (events[index][0] === "enter" && events[index][1].type === "spoilerSequenceTemporary" && events[index][1]._close) {
				let open = index;

				// Search backwards for a matching opener
				while (open--) {
					if (
						events[open][0] === "exit" &&
						events[open][1].type === "spoilerSequenceTemporary" &&
						events[open][1]._open &&
						// Ensure the sequences are the same length
						events[index][1].end.offset - events[index][1].start.offset === events[open][1].end.offset - events[open][1].start.offset
					) {
						// Found a matching pair — promote temporary tokens
						events[index][1].type = "spoilerSequence";
						events[open][1].type = "spoilerSequence";

						const spoiler = {
							type: "spoiler",
							start: { ...events[open][1].start },
							end: { ...events[index][1].end }
						} as Token;

						const text = {
							type: "spoilerText",
							start: { ...events[open][1].end },
							end: { ...events[index][1].start }
						} as Token;

						// Build the replacement event sequence
						const nextEvents: Event[] = [
							["enter", spoiler, context],
							["enter", events[open][1], context],
							["exit", events[open][1], context],
							["enter", text, context]
						];

						// Resolve inner content (handles nested emphasis, links, etc.)
						splice(
							nextEvents,
							nextEvents.length,
							0,
							resolveAll(context.parser.constructs.insideSpan.null!, events.slice(open + 1, index), context)
						);

						nextEvents.push(
							["exit", text, context],
							["enter", events[index][1], context],
							["exit", events[index][1], context],
							["exit", spoiler, context]
						);

						splice(events, open - 1, index - open + 3, nextEvents);
						index = open + nextEvents.length - 2;
						break;
					}
				}
			}
		}

		// Convert any unmatched sequences back to plain data
		index = -1;
		while (++index < events.length) {
			if (events[index][1].type === "spoilerSequenceTemporary") {
				events[index][1].type = "data";
			}
		}

		return events;
	};

	const construct: Construct = {
		tokenize: tokenizer,
		resolveAll: resolveAllSpoiler
	};

	return {
		text: { 33: construct },
		insideSpan: { null: [construct] },
		attentionMarkers: { null: [33] }
	};
}
