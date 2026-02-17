# Remark Spoiler

Remark plugin to support spoiler syntax.

Converts `!!content!!` into `<span class="spoiler">content</span>`, allowing inline formatting (bold, italic, links, code, etc.) inside spoiler markers.

## Install

```sh
pnpm add @tuyuritio/remark-spoiler
```

## Usage

```ts
import remarkSpoiler from "@tuyuritio/remark-spoiler";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkSpoiler)
  .use(remarkRehype)
  .use(rehypeStringify);
```

## Syntax

```
!!content!!
```

Wrap any inline content with double exclamation marks to create a spoiler. The content is hidden by default and can be revealed with CSS or JavaScript.

### Rules

- The opening `!!` must **not** be followed by whitespace.
- The closing `!!` must **not** be preceded by whitespace.
- Single `!` is never treated as a spoiler marker (no conflict with image syntax `![]()`).
- Inline formatting inside spoilers is fully supported.

## Output

The plugin produces a `<span class="spoiler">` element. You can style it with CSS:

```css
.spoiler {
  background: currentColor;
  color: transparent;
  transition: color 0.3s;
}
.spoiler:hover,
.spoiler:focus {
  color: inherit;
}
```

## Examples

| Markdown | HTML |
| --- | --- |
| `!!secret!!` | `<span class="spoiler">secret</span>` |
| `!!**bold secret**!!` | `<span class="spoiler"><strong>bold secret</strong></span>` |
| `!!*italic secret*!!` | `<span class="spoiler"><em>italic secret</em></span>` |
| `` !!`code`!! `` | `<span class="spoiler"><code>code</code></span>` |
| `!![link](url)!!` | `<span class="spoiler"><a href="url">link</a></span>` |

## License

[GPL-3.0](../../LICENSE)
