<a href="https://reago.dev">
  <picture>
    <source srcset="./documentation/public/logo-full.dark.svg" media="(prefers-color-scheme: dark)">
    <img src="./documentation/public/logo-full.light.svg" alt="Reago logo" width="280">
  </picture>
</a>
<br>
<br>

[![Build status](https://img.shields.io/github/actions/workflow/status/areven/reago/code-validation.yml?branch=main&style=flat&colorA=a76733&colorB=3c3c43)](https://github.com/pmndrs/jotai/actions?query=workflow%3ALint)
[![Build size](https://img.shields.io/bundlephobia/minzip/reago?label=bundle%20size&style=flat&colorA=a76733&colorB=3c3c43)](https://bundlephobia.com/result?p=reago)
[![Version](https://img.shields.io/npm/v/reago?style=flat&colorA=a76733&colorB=3c3c43)](https://www.npmjs.com/package/reago)
[![Downloads](https://img.shields.io/npm/dt/reago.svg?style=flat&colorA=a76733&colorB=3c3c43)](https://www.npmjs.com/package/reago)

#

**Reago** is a _declarative_, atomic state management library for JavaScript and TypeScript.

Compose complex state from independent atoms. Use hooks to store values, memoize computations, and declare
side effects. Reago tracks atom usage and dependencies automatically, so updates are lazy and scoped to the
affected parts of the graph.

Use Reago with Vanilla JS or drop in bindings for your favorite framework. Extensions and tooling make it easy to
integrate into real-world, enterprise projects. Despite its capabilities, Reago stays tiny - just a few kilobytes
when minified and gzipped.


## Installation

Reago packages are published on [npm](https://npmjs.com).

The `reago` package implements the whole state management system and is the only package you need
if you are not using any frameworks, or you are implementing your own bindings.

You might also want to install the official integrations for your framework of choice.

```sh
npm install reago
npm install reago-react
```

If you are using TypeScript, the type definitions are already included.


## Documentation

The official documentation is available at https://reago.dev. It includes a complete API reference and
a structured user guide to help you get started quickly.

* [Reago website](https://reago.dev)
* [User guide](https://reago.dev/guide/)
* [API reference](https://reago.dev/api/)


## Basic example

```ts
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

Reago uses a novel generator-based approach to track computation context across asynchronous calls.


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


## Contributing

Development of Reago happens in the open on GitHub, and we are grateful to the community for
contributing bugfixes and improvements.


## License

Reago is [MIT licensed](./license.md).
