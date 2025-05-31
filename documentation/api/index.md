---
outline: false
editLink: false
lastUpdated: false
---

# API reference

This handbook provides detailed reference documentation for working with Reago. It covers the core
`reago` package and other official related packages, such as the React bindings.

The API reference is intended for developers already familiar with Reago concepts and looking for an
exhaustive technical breakdown of its features.

For an introduction to Reago, please start with our official [user guide](/guide/) first.

## Core principles

* **Framework agnostic** :leaves:

  Reago makes no assumptions about your stack. Vanilla JavaScript is a first-class citizen. Official
  framework bindings are built on top of the public `reago` API.

* **Lightweight** :zap:

  Reago implements the minimal set of features required for standard use. It is designed to be lightweight
  and blazing fast. A minified + gzipped core package weighs only a few kilobytes. Any framework bindings,
  extensions and extra utilities belong in separate packages.

* **TypeScript-first** :blue_book:

  Reago is written entirely in TypeScript. Type safety is a priority.

* **Dependency-free** :package:

  Reago does not depend on other packages, and never will. It is easy to audit and does not bloat your
  `node_modules`.
