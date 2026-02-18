# ThoughtLite Toolkit

A collection of extensions designed for [`astro-theme-thought-lite`](https://github.com/tuyuritio/astro-theme-thought-lite).

## Extensions

| Package | Description |
|:- |:- |
| [`@tuyuritio/remark-ruby`](packages/ruby) | Remark plugin to support ruby annotations. |
| [`@tuyuritio/rehype-table-wrapper`](packages/table-wrapper) | Rehype plugin to wrap tables in a div for responsive styling. |
| [`@tuyuritio/remark-github-alert`](packages/github-alert) | Remark plugin to convert GitHub-style alert syntax in blockquotes into styled divs with icons. |
| [`@tuyuritio/rehype-image-figure`](packages/image-figure) | Rehype plugin to transform standalone images into semantic `<figure>` elements with `<figcaption>`. |
| [`@tuyuritio/shiki-code-copy`](packages/code-copy) | Shiki transformer to add copy-to-clipboard buttons to code blocks with customizable feedback duration. |
| [`@tuyuritio/remark-spoiler`](packages/spoiler) | Remark plugin to process spoiler syntax. |
| [`@tuyuritio/remark-abbreviation`](packages/abbreviation) | Remark plugin to process abbreviations. |
| [`@tuyuritio/remark-attribute`](packages/attribute) | Remark plugin to inject HTML attributes. |

## Scripts

| Command | Action |
|:- |:- |
| `pnpm dev` | Start Vitest in watch mode. |
| `pnpm test` | Run Vitest once. |
| `pnpm build` | Build packages. |
| `pnpm lint` | Check code. |

## License

[GPL-3.0](LICENSE)
