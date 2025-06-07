# Creating custom stores

Atom values, state of their hooks, dependencies and similar are stored in a _store_.

Reago provides a default store that we have been using implicitly. Functions such as `read`, `watch`,
`dispatch` and `invalidate` detect the execution context and _proxy_ the call to the active store.

But sometimes that is not enough.

Maybe you want to run multiple copies of a module and make each copy independent. Or maybe
you just want to have strong isolation of critical data. Whatever the use case is, Reago solves
that by allowing you to create custom stores.


## Using a custom store

To create a custom store, simply call `createStore`.

```ts
import {createStore} from 'reago';

const store = createStore()
```

It offers the same methods you are already familiar with, but bound to a specific store instance.

```ts
store.read(...);
store.watch(...);
store.dispatch(...)(...);
store.invalidate(...);
```

Here is an example.

```ts
import {atomAction, atomState, createStore} from 'reago';

const store1 = createStore();
const store2 = createStore();

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

store1.dispatch($atom)(1);
store2.dispatch($atom)(2);

assert(store1.read($atom) === 1);
assert(store2.read($atom) === 2);
```


## Using the default store explicitly

Reago exposes the default store via `getDefaultStore`. You can use it explicitly.

```ts
import {getDefaultStore} from 'reago';

function $atom() {
  return 'Hello world';
}

const store = getDefaultStore();
assert(store.read($atom) === 'Hello world');
```


## Usage in atoms

Store calls inside atoms __remain unchanged__.

You are still going to use `read()` instead of `customStore.read()`.

The `read()` function detects its execution context and automatically uses the active store. It allows
you to use the same atom in multiple stores, without changing the implementation.

If you were to use `customStore.read()` instead, you would do a one-off read that would not
register the dependency in the graph.

```ts
import {atomAction, atomState, createStore, read} from 'reago';

const store1 = createStore();
const store2 = createStore();

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

function $doubledAtom() {
  return read($atom) * 2;
}

store1.dispatch($atom)(3);
store2.dispatch($atom)(4);

assert(store1.read($doubledAtom) === 6);
assert(store2.read($doubledAtom) === 12);
```

## Usage with frameworks

If you are using Reago with a third-party framework through an official integration, please refer to the
[API reference](/api/) of the package for the details on how to use custom stores.

For example, the `reago-react` integration provides:
* A `StoreProvider` component, that provides a custom store to its component subtree.
* A `useStore()` hook, that returns the active store.
