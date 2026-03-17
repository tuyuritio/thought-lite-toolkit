# @tuyuritio/inline-display-math

## 1.0.3

### Fix

In version `1.0.2`, I misunderstood what `\displaystyle` does. The [KaTeX documentation](https://katex.org/docs/options.html) clearly states that `displaystyle` and `displayMode` are two different concepts:

1. `displaystyle` only affects the rendering style, so symbols such as `\int` and `\sum` become **larger**
2. `displayMode` is stronger: it **actually treats the formula as display math**, meaning it takes up its own line and is centered

This issue has now been fixed. The plugin now uses four different `layout` options to provide finer control over the exact behavior.

### Features

Added a `layout` option, and removed the previous `enabled` and `mode` options:

```ts
interface Options {
	layout?: "block" | "display" | "displaystyle" | "inline";
}
```

Specifically:

* `"block"`: convert inline `$$...$$` into block math (break paragraph structure)
* `"display"`: keep the structure, but render with display layout (centers math on its own line)
* `"displaystyle"`: keep the structure and inline layout, only apply `\displaystyle`
* `"inline"`: do nothing


## 1.0.2

6713ba7: Add `displaystyle` mode.

### Features

Add a new `mode` option:
- `block`: preserve current behavior and promote inline `$$...$$` to block math
- `displaystyle`: keep paragraph structure unchanged and rewrite inline `$$...$$` as `{\displaystyle ...}`

## 1.0.1

1767229: Complete rewrite of the traversal logic.

### Refactor

- visits `paragraph`
- reconstructs blocks using a buffer
- avoids mutation during iteration

### Fix

- supports multiple `$$...$$` inside a paragraph
- prevents traversal corruption

## 1.0.0

5bbf31e: Initial release.

### Features

- detect inline `$$...$$`
- convert them to `math` block nodes
- split paragraph around display math