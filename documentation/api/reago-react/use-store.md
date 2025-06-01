---
titleTemplate: :title | Reago for React
---

# useStore

`useStore` is a React hook that lets you access the currently active Reago store.

::: code-group
```tsx [Syntax]
const store = useStore()
```

```ts [Types]
function useStore(): Store
```
:::


## Reference

### `useStore()`

Call `useStore` at the top level of your component to access the active Reago store.

```tsx
import {useStore} from 'reago-react';

function MyComponent() {
  const store = useStore();
  // ...
}
```

#### Returns

`useStore` returns the currently active Reago store for the calling component.

It is determined as the store passed to the closest `StoreProvider` above the calling component in the tree.
If there is no such provider, then the returned value will be the default Reago store, also available via
`getDefaultStore` in the core package.

The returned value is always up-to-date. React automatically re-renders components if active store changes.

#### Caveats

* `useStore()` call in a component is not affected by providers returned from the same component. The corresponding
`<StoreProvider>` needs to be above the component doing the `useStore()` call.


## Examples

### Accessing the default store

Call `useStore()` without using any `StoreProvider` in the component tree above.

```tsx
import {useStore} from 'reago-react';

export default function App() {
  const store = useStore(); // returns the default store
  // ...
}
```

Alternatively, since the default store reference is immutable, you can skip the hook and obtain the store directly.

```tsx
import {getDefaultStore} from 'reago';

export default function App() {
  const store = getDefaultStore(); // returns the default store
  // ...
}
```

### Using a custom store

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
      <StoreProvider store={customStore1}>
        <ComponentWithCustomStore/>
      </StoreProvider>
     <StoreProvider store={customStore2}>
        <ComponentWithCustomStore/>
      </StoreProvider>
    </>
  );
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
