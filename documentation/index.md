---
outline: false
editLink: false
lastUpdated: false
---

<picture>
  <source srcset="/logo-full.dark.svg" media="(prefers-color-scheme: dark)">
  <img src="/logo-full.light.svg" alt="Reago logo" width="220">
</picture>

<style module>
  .badges img {
    display: inline-block;
    margin-right: 4px;
  }
</style>

<div :class="$style.badges">

[![Version](https://img.shields.io/npm/v/reago?style=flat&colorA=a76733&colorB=3c3c43)](https://www.npmjs.com/package/reago)
[![Downloads](https://img.shields.io/npm/dt/reago.svg?style=flat&colorA=a76733&colorB=3c3c43)](https://www.npmjs.com/package/reago)
[![Build size](https://img.shields.io/bundlephobia/minzip/reago?label=bundle%20size&style=flat&colorA=a76733&colorB=3c3c43)](https://bundlephobia.com/result?p=reago)
[![Build status](https://img.shields.io/github/actions/workflow/status/areven/reago/code-validation.yml?branch=main&style=flat&colorA=a76733&colorB=3c3c43)](https://github.com/areven/reago/actions/workflows/code-validation.yml)
[![Code coverage](https://img.shields.io/codecov/c/github/areven/reago?token=69NO8U9S3W&style=flat&labelColor=a76733&color=3c3c43)](https://app.codecov.io/gh/areven/reago/tree/main)

</div>

---

**Reago** is a _declarative_, atomic state management library for JavaScript and TypeScript.

Compose complex state from independent atoms. Use hooks to store values, memoize computations, and declare
side effects. Reago tracks atom usage and dependencies automatically, so updates are lazy and scoped to the
affected parts of the graph.

Use Reago with Vanilla JS or drop in bindings for your favorite framework. Extensions and tooling make it easy to
integrate into real-world, enterprise projects. Despite its capabilities, Reago stays tiny - just a few kilobytes
when minified and gzipped.

::: code-group
```ts [Vanilla JS]
import {atomAction, atomState, dispatch, read} from 'reago';

function $repositoryName() {
  const [name, setName] = atomState('');
  atomAction(newName => setName(`areven/${newName}`), []);
  return name;
}

function* $repositoryData() {
  const name = read($repositoryName);
  const query = yield fetch(`https://api.github.com/repos/${name}`);
  return yield query.json();
}

function* $repositoryStarsCount() {
  const data = yield read($repositoryData);
  return data.stargazers_count;
}

dispatch($repositoryName)('reago');
console.log(`Nice, ${await read($repositoryStarsCount)} stars!`);
```

```tsx [React]
import {Suspense} from 'react';
import {read} from 'reago';
import {useReadAsyncAtom} from 'reago-react';

export default function App() {
  return (
    <Suspense fallback={<Loading/>}>
      <ReagoStars/>
    </Suspense>
  );
}

function Loading() {
  return <div>Loading data...</div>;
}

function ReagoStars() {
  const starsCount = useReadAsyncAtom($repositoryStarsCount);
  return <div>Nice, {starsCount} stars!</div>;
}

function* $repositoryData() {
  const query = yield fetch('https://api.github.com/repos/areven/reago');
  return yield query.json();
}

function* $repositoryStarsCount() {
  const data = yield read($repositoryData);
  return data.stargazers_count;
}
```
:::

<div class="tip custom-block" style="padding-top: 8px">

Just want to try it out? Skip to [Getting started](/guide/getting-started).

</div>

## Why Reago?

* **Lightweight - only a few kB, minified + gzipped** :zap:

  Reago implements the minimal set of features required for standard use. It is designed to be lightweight
  and blazing fast. A minified + gzipped core package weighs only a few kilobytes. Any framework bindings,
  extensions and extra utilities belong in separate packages.

  Atoms are independent, can be defined anywhere, and are tree-shakeable. After all, they are simply functions.
  Your bundle size stays under control.

* **Framework-agnostic - no tight coupling** :leaves:

  Reago makes no assumptions about your stack. Vanilla JavaScript is a first-class citizen. Enterprise-size
  projects often combine multiple technologies. Reago can interact with them all.

  Official framework bindings are built on top of the public `reago` API - with no shortcuts.
  The public API is sufficient for any type of integration.

* **Easy to learn - you probably already know it** :student:

  Reago does not reinvent the wheel - it builds on top of the industry standards. If you have ever used React
  with hooks, you already know the basics. Reago atoms are declarative, like React functional components -
  but instead of JSX, they return computed state.

  With so many state management libraries on the market, onboarding new engineers does not have to be costly.
  They can be productive on day one.

* **Fully type-safe - built in TypeScript** :dart:

  Reago is built in TypeScript and exports proper type definitions. Catch common mistakes before they reach
  production.

* **Supports asynchronous data - with a touch of magic** :fairy:

  Reago implements an innovative approach to asynchronous state called generative atoms. Handling `Promises`
  does not have to be complicated and verbose. Reago can correctly track dependencies across asynchronous
  computations using an `await`-like syntax.

* **Scales with your requirements** :rocket:

  Reago is suitable for tiny hobby projects, startups and large enterprise deployments. The atomic
  state model reliably scales to any size.

* **Easy to audit** :mag:

  Reago does not depend on other packages, and never will. Its source code is tiny and easy to audit.
  It does not bloat your `node_modules`.

* **MIT license** :balance_scale:

  Released under the MIT license, Reago is free to use, forever. No gotchas.

## What next?

If you are curious about the motivation behind building yet another state management library, we explain
it in [the next article](/guide/motivation).

Otherwise, let us jump straight into [coding](/guide/getting-started).
