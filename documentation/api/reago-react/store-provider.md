---
titleTemplate: :title | Reago for React
---

# StoreProvider

`StoreProvider` is a React component that lets you set a custom active Reago store for a component tree.
A store is where values of atoms are stored. A single atom can have different values in different stores.

```tsx
<StoreProvider store={store}>...</StoreProvider>
```

Using a `StoreProvider` is entirely optional.  If you don't use a `StoreProvider`, Reago will fallback to using
the built-in default store.


## Reference

### `<StoreProvider store={store}/>`

Wrap your component tree with a `StoreProvider` to change the active Reago store for those components.

```tsx
import {createStore, type Store} from 'reago';
import {StoreProvider} from 'reago-react';

const customStore: Store = createStore();

function MyComponent1() {
  // reago react hooks placed here will use the default store
  return (
    <StoreProvider store={customStore}>
      <MyComponent2/>
    </StoreProvider>
  )
}

function MyComponent2() {
  // reago react hooks placed here will use the custom store
}
```

#### Parameters

* `store` (optional): The store you've previously created with `createStore`, or the default store retrieved
via `getDefaultStore`. If you omit this parameter, `StoreProvider` will create a new store for you under the hood.

#### Behavior

All Reago React hooks use an internal React context to determine which Reago store they should read from or write to.

Reago has a built-in default store which is used if no store is provided manually. This is the preferred approach
for most applications. This store can be retrieved by calling `getDefaultStore` from the core package.

A `StoreProvider` uses React context to set a custom active store for the component tree it wraps. All Reago React
hooks inside the subtree will use this new store for their operations.

#### Caveats

* If you nest multiple `StoreProvider` components in each other, the innermost one will take precedence.


## Examples

### Using the default store

To use the default Reago store, we recommend not creating a `StoreProvider` at all.

```tsx
import {useAtom} from 'reago-react';

export default function App() {
  const [value, dispatch] = useAtom(...); // will use the default store
  // ...
}
```


However, if you want to be verbose, you can pass it down explicitly.

```tsx
import {getDefaultStore} from 'reago';
import {StoreProvider, useAtom} from 'reago-react';

export default function App() {
  return (
    <StoreProvider store={getDefaultStore()}>
      <MyComponent/>
    </StoreProvider>
  )
}

function MyComponent() {
    const [value, dispatch] = useAtom(...); // will use the default store
  // ...
}
```

### Using an explicitly created custom store

Create a custom store and pass it down using `StoreProvider`.

```tsx
import {createStore} from 'reago';
import {StoreProvider, useStore} from 'reago-react';

const customStore = createStore();

export default function App() {
  return (
    <StoreProvider store={customStore}>
      <ComponentWithCustomStore/>
    </StoreProvider>
  );
}

function ComponentWithCustomStore() {
  const store = useStore(); // returns `customStore`
  // ...
}
```

### Using an implicitly  created custom store

If you're not using the custom store outside of React, you can avoid keeping an external reference.
If you don't pass a store to `StoreProvider`, it will create a new store for you.

```tsx
import {StoreProvider, useStore} from 'reago-react';

export default function App() {
  return (
    <StoreProvider>
      <ComponentWithCustomStore/>
    </StoreProvider>
  );
}

function ComponentWithCustomStore() {
  const store = useStore(); // returns a custom store
  // ...
}
```

### Using multiple stores

You can have multiple stores in your app at the same time - simply use multiple store providers for different
component trees.

```tsx
import {createStore} from 'reago';
import {StoreProvider, useStore} from 'reago-react';

const customStore1 = createStore();
const customStore2 = createStore();

export default function App() {
  return (
    <>
      <ComponentWithDefaultStore/>
      <StoreProvider store={customStore1}>
        <ComponentWithCustomStore/>
      </StoreProvider>
     <StoreProvider store={customStore2}>
        <ComponentWithCustomStore/>
      </StoreProvider>
    </>
  );
}

function ComponentWithDefaultStore() {
  const store = useStore(); // returns the default store
  // ...
}

function ComponentWithCustomStore() {
  const store = useStore(); // returns `customStore1` or `customStore2`
  // ...
}
```

### Reverting to the default store

If you find yourself deep in the component tree, you are within a custom store context and want to revert
to the default Reago store, combine `StoreProvider` with `getDefaultStore`.

```tsx
import {getDefaultStore} from 'reago';
import {StoreProvider, useStore} from 'reago-react';

export default function App() {
  const store = useStore(); // returns the default store
  return (
    <StoreProvider>
      <ComponentWithCustomStore/>
    </StoreProvider>
  );
}

function ComponentWithCustomStore() {
  const store = useStore(); // returns the custom store
  return (
    <StoreProvider store={getDefaultStore()}>
      <ComponentWithDefaultStore/>
    </StoreProvider>
  );
}

function ComponentWithDefaultStore() {
  const store = useStore(); // returns the default store again
  // ...
}
```
