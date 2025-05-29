---
titleTemplate: :title | Reago for React
---

# useReadAsyncAtom

`useReadAsyncAtom` is a React hook that lets you subscribe to a _resolved_ atom's value in the
currently active Reago store.

```tsx
const resolvedValue = useReadAsyncAtom($atom, ...familyArgs)
```

If an atom is asynchronous or returns a `Promise`-like object, the hook uses React Suspense and Reago's
internal `Promise` tracking system to unpack it. The returned value is _always_ already resolved.


## Reference

### `useReadAsyncAtom(atom, ...familyArgs)`

Call `useReadAsyncAtom` at the top level of your component to subscribe to the resolved value of a possibly
asynchronous atom.


```tsx
import {useReadAsyncAtom} from 'reago-react';

function $atom() {
  // ...
}

function* $atomFamily(someArgument: string) {
  // ...
}

function MyComponent() {
  const resolvedValue1 = useReadAsyncAtom($atom);
  const resolvedValue2 = useReadAsyncAtom($atomFamily, 'someValue');
  // ...
}
```

#### Parameters

* `atom`: A reference to an atom you want to subscribe to.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Returns

`useReadAsyncAtom` returns the resolved value of the given atom, or triggers React Suspense until it
becomes available.

Internally, it uses a combination of `store.read()` and `store.watch()` calls to keep the returned value up
to date. This means the given atom is mounted for the lifespan of the calling component, and unmounted if
it is no longer referenced elsewhere.

The hook uses the active Reago store provided by the closest `StoreProvider` in the component tree above, or the
built-in default store if no custom store is set.

If an atom returns a value that is not a `Promise`-like object, it is returned as is. The behavior is identical
to the `useReadAtom` hook.

Otherwise, the hook uses React Suspense to wait for a `Promise` to resolve and then returns the value.
If a `Promise` is rejected, the error is thrown and can be handled using React's `<ErrorBoundary/>`.


## Examples

### Subscribing to any atom

Call `useReadAsyncAtom` to subscribe to the resolved value of any atom. The atom can be functional,
generative, synchronous, asynchronous - it does not matter.

```tsx
import {atomMountEffect, atomReducer} from 'reago';
import {useReadAsyncAtom} from 'reago-react';

export default function App() {
  const seconds = useReadAsyncAtom($secondsMounted);
  return <div>
    Atom was mounted for {seconds} seconds so far.
  </div>;
}

function $secondsMounted() {
  const [seconds, tick] = atomReducer(x => x + 1, 0);

  atomMountEffect(() => {
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, []);

  return seconds;
}
```

### Using Suspense with asynchronous atoms

A component that calls `useReadAsyncAtom` on an asynchronous atom might trigger the React Suspense
mechanism while waiting for a `Promise` to settle. Wrap the component with `<Suspense/>` to handle
the loading state gracefully.

```tsx
import {Suspense} from 'react';
import {useReadAsyncAtom} from 'reago-react';

export default function App() {
  return <Suspense fallback={<Loading/>}>
    <AsyncComponent/>
  </Suspense>;
}

function Loading() {
  return <div>Loading data...</div>;
}

function AsyncComponent() {
  const userBirthday = useReadAsyncAtom($userBirthday);
  return <div>User was born on {userBirthday}</div>;
}

function* $userBirthday {
  yield new Promise(resolve => setTimeout(resolve, 1000));
  return 'Mar 8, 1993';
}
```
