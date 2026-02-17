# Remark Attribute

Remark plugin to inject HTML attributes.

## Install

```sh
pnpm add @tuyuritio/remark-attribute
```

## Usage

```ts
import remarkAttribute from "@tuyuritio/remark-attribute";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkAttribute)
  .use(remarkRehype)
  .use(rehypeStringify);
```

## Syntax

Append `{...}` after a supported element to attach HTML attributes.

### Attribute Formats

| Format | Description | Example |
| --- | --- | --- |
| `#id` | Set element ID | `{#custom-id}` |
| `.class` | Add CSS class (multiple allowed) | `{.class1 .class2}` |
| `key=value` | Key-value attribute | `{width=500}` |
| `key="value"` | Quoted value (supports spaces) | `{title="Hello World"}` |
| `key='value'` | Single-quoted value | `{title='Hello World'}` |
| `key` | Boolean attribute (empty value) | `{data-disabled}` |

## Supported Elements

### Headings

Attributes are placed at the end of the heading text.

```md
## Heading {#custom-id .class-name}
```

```html
<h2 id="custom-id" class="class-name">Heading</h2>
```

### Links

```md
[text](url){target=_blank .external}
```

```html
<a href="url" target="_blank" class="external">text</a>
```

### Images

```md
![alt](img.png){width=500 .responsive}
```

```html
<img src="img.png" alt="alt" width="500" class="responsive">
```

### Strong

```md
**bold text**{.red-text}
```

```html
<strong class="red-text">bold text</strong>
```

### Emphasis

```md
*italic text*{.blue-text}
```

```html
<em class="blue-text">italic text</em>
```

### Inline Code

```md
`code`{.highlight}
```

```html
<code class="highlight">code</code>
```

## Examples

### Multiple classes

```md
## Heading {.class1 .class2}
```

```html
<h2 class="class1 class2">Heading</h2>
```

### Key-value with quotes

```md
## Heading {title="Hello World" data-info='Some "info"'}
```

```html
<h2 title="Hello World" data-info="Some &quot;info&quot;">Heading</h2>
```

### Multiple elements in one line

```md
**bold**{.red} and *italic*{.blue}
```

```html
<strong class="red">bold</strong> and <em class="blue">italic</em>
```

### Text after attributes

```md
**bold**{.red} and normal text
```

```html
<strong class="red">bold</strong> and normal text
```

Elements without `{...}` are left untouched.

## License

[GPL-3.0-or-later](../../LICENSE)
