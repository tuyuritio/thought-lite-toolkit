# Remark GitHub Alert

Remark plugin to convert GitHub-style alert syntax in blockquotes into styled `<div>` elements with icons.

## Install

```sh
pnpm add @tuyuritio/remark-github-alert
```

## Usage

```ts
import remarkGitHubAlert from "@tuyuritio/remark-github-alert";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGitHubAlert)
  .use(remarkRehype)
  .use(rehypeStringify);
```

## Syntax

```md
> [!TYPE] Optional Title
> Content
```

### Supported Types

| Type | Class |
| --- | --- |
| `NOTE` | `markdown-alert-note` |
| `TIP` | `markdown-alert-tip` |
| `IMPORTANT` | `markdown-alert-important` |
| `WARNING` | `markdown-alert-warning` |
| `CAUTION` | `markdown-alert-caution` |

Each type comes with its own SVG icon from GitHub's [Octicons](https://github.com/primer/octicons) library.

### Examples

#### Basic alert (type as title)

```md
> [!NOTE]
> This is a note.
```

```html
<div class="markdown-alert markdown-alert-note">
  <p class="markdown-alert-title">
    <svg>...</svg>
    <strong>Note</strong>
  </p>
  <p>This is a note.</p>
</div>
```

#### Custom title

```md
> [!TIP] Useful Information
> Content here.
```

```html
<div class="markdown-alert markdown-alert-tip">
  <p class="markdown-alert-title">
    <svg>...</svg>
    <strong>Useful Information</strong>
  </p>
  <p>Content here.</p>
</div>
```

#### Multi-line content

```md
> [!WARNING]
> Line 1
>
> Line 2
```

Regular blockquotes without the `[!TYPE]` syntax are left untouched.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `typeFormat` | `"capitalize" \| "uppercase" \| "original"` | `"capitalize"` | Controls the format of the alert type displayed in the title. |

### `typeFormat`

- **`"capitalize"`** (default) — First letter uppercase, rest lowercase (e.g., `Note`, `Important`)
- **`"uppercase"`** — All uppercase (e.g., `NOTE`, `IMPORTANT`)
- **`"original"`** — Keep the original casing from the Markdown source

```ts
.use(remarkGitHubAlert, { typeFormat: "uppercase" })
```

## Output Structure

The plugin transforms matching blockquotes into the following HTML structure:

```html
<div class="markdown-alert markdown-alert-{type}">
  <p class="markdown-alert-title">
    <svg><!-- octicon --></svg>
    <strong>{title}</strong>
  </p>
  <!-- content -->
</div>
```

CSS classes applied:

- `markdown-alert` — on every alert wrapper
- `markdown-alert-{type}` — type-specific class (e.g., `markdown-alert-note`)
- `markdown-alert-title` — on the title paragraph

## License

[GPL-3.0-or-later](../../LICENSE)
