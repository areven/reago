# Getting started

Reago packages are published on [npm](https://npmjs.com).

The `reago` package implements the whole state management system and is the only package you need
if you are not using any frameworks, or you are implementing your own bindings.

You might also want to install the official integrations for your framework of choice.


## Installation

Open your project and install the latest stable versions of required packages.

::: code-group
```sh [Reago]
npm install reago
```

```sh [Reago for React]
npm install reago reago-react
```
:::

If you are using TypeScript, the type definitions are already included.


## Versioning

It is worth mentioning that each official package in the Reago ecosystem is versioned independently. The version
number of `reago-react`, for example, does not mirror the version of the core `reago` package. They evolve at their
own pace and should not be expected to track each other numerically.

This means:
* You may use `reago@2.0.0` with `reago-react@1.3.4` if they are compatible.
* A major version bump in `reago` does not imply a bump in `reago-react`, and vice versa.

You can read more about it [here](/api/versioning).
