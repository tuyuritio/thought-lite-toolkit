# @tuyuritio/inline-display-math

## 1.0.1

### Refactor

Complete rewrite of the traversal logic.

- visits `paragraph`
- reconstructs blocks using a buffer
- avoids mutation during iteration

### Fix

- supports multiple `$$...$$` inside a paragraph
- prevents traversal corruption

## 1.0.0

Initial release.

### Features

- detect inline `$$...$$`
- convert them to `math` block nodes
- split paragraph around display math