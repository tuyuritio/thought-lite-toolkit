# Remark Ruby

Remark plugin to support ruby annotations.

Converts `{base}(reading)` syntax into HTML `<ruby>` elements, supporting both group and character-by-character annotation modes.

## Install

```sh
pnpm add @tuyuritio/remark-ruby
```

## Usage

```ts
import remarkRuby from "@tuyuritio/remark-ruby";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRuby)
  .use(remarkRehype)
  .use(rehypeStringify);
```

## Syntax

```
{base}(reading)
```

The plugin recognizes the pattern `{base}(reading)` in Markdown and converts it to `<ruby>` HTML elements. It supports two modes:

### Group Mode

When the reading is a single string (without `|` separators matching the base character count), the entire base text shares one annotation.

```md
{今日}(きょう)
```

```html
<ruby>今日<rp>(</rp><rt>きょう</rt><rp>)</rp></ruby>
```

### Character-by-Character Mode

When the number of `|`-separated segments in the reading matches the number of characters in the base text, each character gets its own annotation.

```md
{拼音}(pīn|yīn)
```

```html
<ruby>拼<rp>(</rp><rt>pīn</rt><rp>)</rp>音<rp>(</rp><rt>yīn</rt><rp>)</rp></ruby>
```

#### Empty Readings

Use an empty segment between `|` separators to skip annotation for a specific character. This is useful when some characters in the base text don't need ruby (e.g. hiragana within kanji).

```md
{振り仮名}(ふ||が|な)
```

```html
<ruby>振<rp>(</rp><rt>ふ</rt><rp>)</rp>り仮<rp>(</rp><rt>が</rt><rp>)</rp>名<rp>(</rp><rt>な</rt><rp>)</rp></ruby>
```

Here `り` has an empty reading, so it is rendered without any annotation.

## Examples

| Markdown | Output |
| --- | --- |
| `{漢字}(かんじ)` | <ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby> |
| `{漢字}(かん\|じ)` | <ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp>字<rp>(</rp><rt>じ</rt><rp>)</rp></ruby> |
| `{拼音}(pīn\|yīn)` | <ruby>拼<rp>(</rp><rt>pīn</rt><rp>)</rp>音<rp>(</rp><rt>yīn</rt><rp>)</rp></ruby> |
| `{振り仮名}(ふ\|\|が\|な)` | <ruby>振<rp>(</rp><rt>ふ</rt><rp>)</rp>り仮<rp>(</rp><rt>が</rt><rp>)</rp>名<rp>(</rp><rt>な</rt><rp>)</rp></ruby> |
| `{🌟🌙}(star\|moon)` | <ruby>🌟<rp>(</rp><rt>star</rt><rp>)</rp>🌙<rp>(</rp><rt>moon</rt><rp>)</rp></ruby> |

## License

[GPL-3.0](../../LICENSE)
