# Rehype Table Wrapper

A rehype plugin to wrap `<table>` elements in a `<div>` for responsive styling.

## Install

```sh
pnpm add @tuyuritio/rehype-table-wrapper
```

## Usage

```ts
import rehypeTableWrapper from "@tuyuritio/rehype-table-wrapper";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(rehypeParse)
  .use(rehypeTableWrapper)
  .use(rehypeStringify);
```

### With Remark

```ts
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeTableWrapper from "@tuyuritio/rehype-table-wrapper";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeTableWrapper)
  .use(rehypeStringify);
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | `"table-wrapper"` | The CSS class name to apply to the wrapper `<div>`. |

### Custom Class Name

```ts
.use(rehypeTableWrapper, { className: "custom-scroll" })
```

## How It Works

The plugin traverses the HAST tree and wraps each `<table>` element in a `<div>` with the specified class name. Tables that are already inside a `<div>` wrapper will not be wrapped again.

### Input

```html
<table>
  <thead>
    <tr><th>Name</th><th>Value</th></tr>
  </thead>
  <tbody>
    <tr><td>A</td><td>1</td></tr>
  </tbody>
</table>
```

### Output

```html
<div class="table-wrapper">
  <table>
    <thead>
      <tr><th>Name</th><th>Value</th></tr>
    </thead>
    <tbody>
      <tr><td>A</td><td>1</td></tr>
    </tbody>
  </table>
</div>
```

You can then style the wrapper to enable horizontal scrolling on narrow screens:

```css
.table-wrapper {
  overflow-x: auto;
}
```

## License

[GPL-3.0-or-later](../../LICENSE)
