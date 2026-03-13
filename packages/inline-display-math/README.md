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

| Option    | Type                      | Default        |                                                                      Description                                                                       |
| --------- | ------------------------- | -------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------: |
| `enabled` | `boolean`                 | `true`         |                                                                          `-`                                                                           |
| `mode`    | `block` \| `displaystyle` | `displaystyle` | "block" will convert inline $$...$$ into block math, while "displaystyle" will keep paragraph structure, rewrite inline $$...$$ as {\displaystyle ...} |

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

The implementation was redesigned to operate at the **paragraph level**.

1. visits each paragraph node
2. scans its children
3. detects inline `$$...$$`
4. splits the paragraph into multiple blocks

For example:

```
text $$x^2$$ text
```

becomes:

- displaystyle mode:
  ```
  paragraph("text" math("\displaystyle x^2") "text")
  ```
- block mode:
  ```
  paragraph("text")

  math("x^2")

  paragraph("text")
  ```

## License

[GPL-3.0-or-later](../../LICENSE)
