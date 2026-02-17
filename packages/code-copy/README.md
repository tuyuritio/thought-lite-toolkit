# Shiki Code Copy

Shiki transformer that adds a copy-to-clipboard button to code blocks.

## Install

```sh
pnpm add @tuyuritio/shiki-code-copy
```

## Usage

```ts
import codeCopy from "@tuyuritio/shiki-code-copy";
import { codeToHtml } from "shiki";

const html = await codeToHtml('console.log("hello")', {
  lang: "js",
  theme: "github-dark",
  transformers: [
    codeCopy({ duration: 1500 })
  ]
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `1500` | Duration in milliseconds for the "copied" state visual feedback. |

## How It Works

The transformer wraps the code block's `<code>` element in a `<div.code-container>` and appends a `<button>` with an inline `onclick` handler that:

1. Copies the source code to the clipboard via `navigator.clipboard.writeText()`
2. Adds a `code-copied` class to the button for visual feedback
3. Removes the `code-copied` class after the specified `duration`

### Output Structure

```html
<pre>
  <div class="code-container">
    <code>...</code>
    <button type="button" class="code-copy-button" aria-hidden="true">
      <svg class="copy-icon"><!-- clipboard icon --></svg>
      <svg class="done-icon"><!-- checkmark icon --></svg>
    </button>
  </div>
</pre>
```

### Icons

The button contains two SVG icons:

- **`copy-icon`** — clipboard icon, shown by default
- **`done-icon`** — checkmark icon, shown when code is copied

## Styling

The plugin only injects the HTML structure. You need to provide your own CSS to style the button and handle the icon toggle. Here's a minimal example:

```css
.code-container {
  position: relative;
}

.code-copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0.25rem;
  color: inherit;
  opacity: 0;
  transition: opacity 0.2s;
}

.code-container:hover .code-copy-button {
  opacity: 1;
}

.code-copy-button .done-icon {
  display: none;
}

.code-copy-button.code-copied .copy-icon {
  display: none;
}

.code-copy-button.code-copied .done-icon {
  display: block;
}
```

## CSS Classes

| Class | Element | Description |
| --- | --- | --- |
| `code-container` | `<div>` | Wrapper around code and button |
| `code-copy-button` | `<button>` | The copy button |
| `code-copied` | `<button>` | Added temporarily after copying |
| `copy-icon` | `<svg>` | Clipboard icon |
| `done-icon` | `<svg>` | Checkmark icon |

## License

[GPL-3.0-or-later](../../LICENSE)
