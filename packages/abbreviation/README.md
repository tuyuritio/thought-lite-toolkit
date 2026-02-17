# Remark Abbreviation

Remark plugin to support abbreviation definitions in Markdown, converting them into `<abbr>` elements with `title` attributes.

## Install

```sh
pnpm add @tuyuritio/remark-abbreviation
```

## Usage

```ts
import remarkAbbreviation from "@tuyuritio/remark-abbreviation";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkAbbreviation)
  .use(remarkRehype)
  .use(rehypeStringify);
```

## Syntax

```md
*[ABBR]: Full text
```

Define abbreviations anywhere in the document. The definition itself will be removed from the output, and all matching occurrences of the abbreviation in the text will be wrapped in `<abbr>` elements.

### Example

```md
HTML is a markup language.

*[HTML]: HyperText Markup Language
```

Output:

```html
<p><abbr title="HyperText Markup Language">HTML</abbr> is a markup language.</p>
```

### Multiple Abbreviations

Multiple definitions can be placed together in a single block:

```md
Rust and TS are popular programming languages.

*[Rust]: Rust Programming Language
*[TS]: TypeScript
```

Output:

```html
<p><abbr title="Rust Programming Language">Rust</abbr> and <abbr title="TypeScript">TS</abbr> are popular programming languages.</p>
```

## Behavior

- **Whole word matching** — Only exact word boundaries are matched. For example, defining `*[HTML]` will match `HTML` but not `HTML5`.
- **Ignored contexts** — Abbreviations inside `link`, `code`, and `inlineCode` nodes are not replaced.
- **Definition removal** — All `*[ABBR]: ...` definition blocks are removed from the final output.

## License

[GPL-3.0-or-later](../../LICENSE)
