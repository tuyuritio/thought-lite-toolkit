# Inline Display Math

A **remark plugin** that treats inline `$$...$$` as display math.

Normally, `remark-math` only recognizes display math when `$$...$$` appears as a block separated by line breaks.

This plugin allows display math to appear inline inside paragraphs, such as:

```
text $$x^2$$ text
```

and transforms the AST so the expression becomes a proper display math block.

---

## Install

```sh
pnpm add @tuyuritio/inline-display-math
```

---

## Usage

```ts
import inlineDisplayMath from "@tuyuritio/inline-display-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(inlineDisplayMath)
  .use(remarkRehype)
  .use(rehypeStringify);
```

---

## Options

| Option    | Type      | Default |
| --------- | --------- | ------- |
| `enabled` | `boolean` | `true`  |

---

## How It Works

Markdown math plugins typically require display math to be written as block elements:

```
$$
x^2
$$
```

However, authors frequently write expressions inline:

```
text $$x^2$$ text
```

In Markdown AST (mdast), this is parsed as an `inlineMath` node inside a paragraph.
Display math, however, must be represented as a `math` block node.

This plugin rewrites the AST so that inline `$$...$$` becomes a proper block math node.

The initial implementation visited `inlineMath` nodes directly:

```
visitParents(tree, "inlineMath")
```

When a `$$...$$` expression was detected, the plugin split the surrounding paragraph and inserted a `math` block.

This worked for simple cases but had a fundamental issue:
the AST was being mutated while the traversal was still in progress.

That approach could lead to traversal inconsistencies when multiple math nodes appeared in the same paragraph.

## License

[GPL-3.0-or-later](../../LICENSE)
