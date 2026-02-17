import type { Data, Node, PhrasingContent } from "mdast";

export interface SpoilerData extends Data {
	hName: "span";
	hProperties: { className: string[] };
}

export interface Spoiler extends Node {
	type: "spoiler";
	children: PhrasingContent[];
	data?: SpoilerData | undefined;
}

declare module "mdast" {
	interface PhrasingContentMap {
		spoiler: Spoiler;
	}

	interface RootContentMap {
		spoiler: Spoiler;
	}
}
