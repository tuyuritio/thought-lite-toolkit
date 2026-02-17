# Rehype Image Figure

Rehype plugin to transform standalone images into semantic `<figure>` elements with `<figcaption>`.

## Install

```sh
pnpm add @tuyuritio/rehype-image-figure
```

## Usage

```ts
import rehypeImageFigure from "@tuyuritio/rehype-image-figure";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeImageFigure)
  .use(rehypeStringify);
```

## How It Works

The plugin finds `<p>` elements at the root level that contain only a single `<img>`, and converts them into `<figure>` elements. The image's `alt` text is used as the `<figcaption>` content.

### Input

```html
<p><img src="landscape.jpg" alt="A beautiful landscape"></p>
```

### Output

```html
<figure>
  <img src="landscape.jpg" alt="A beautiful landscape">
  <figcaption>A beautiful landscape</figcaption>
</figure>
```

In Markdown, this means:

```md
![A beautiful landscape](landscape.jpg)
```

will be rendered as a `<figure>` instead of a plain `<p><img></p>`.

## Conditions

The transformation only applies when **all** of the following are true:

- The `<p>` is at the root level (not nested inside another element like `<div>`)
- The `<p>` contains exactly **one** child element
- That child is an `<img>` element
- The `<img>` has both `src` and `alt` attributes

Otherwise, the element is left untouched.

### Not Transformed

```html
<!-- Missing alt attribute -->
<p><img src="photo.jpg"></p>

<!-- Paragraph contains additional text -->
<p><img src="photo.jpg" alt="desc"> Some extra text</p>

<!-- Multiple images in one paragraph -->
<p><img src="1.jpg" alt="a"><img src="2.jpg" alt="b"></p>

<!-- Image inside a nested element -->
<div><p><img src="photo.jpg" alt="desc"></p></div>
```

## Image Properties

All original image attributes (`title`, `loading`, `class`, etc.) are preserved on the output `<img>` element.

```html
<!-- Input -->
<p><img src="a.jpg" alt="desc" title="Greeting" loading="lazy"></p>

<!-- Output -->
<figure>
  <img src="a.jpg" alt="desc" title="Greeting" loading="lazy">
  <figcaption>desc</figcaption>
</figure>
```

## License

[GPL-3.0-or-later](../../LICENSE)
