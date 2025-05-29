---
titleTemplate: :title | Reago for React
---

# useReadAtom

`useReadAtom` is a React hook that lets you subscribe to an atom's value in the currently active Reago store.

```tsx
const value = useReadAtom($atom, ...familyArgs)
```

The value is returned as is, without any special handling for asynchronous atoms and `Promise`-like objects.


## Reference

### `useReadAtom(atom, ...familyArgs)`

Call `useReadAtom` at the top level of your component to subscribe to the value of the given
atom.


```tsx
import {useReadAtom} from 'reago-react';

function $atom() {
  // ...
}

function $atomFamily(someArgument: string) {
  // ...
}

function MyComponent() {
  const value1 = useReadAtom($atom);
  const value2 = useReadAtom($atomFamily, 'someValue');
  // ...
}
```

#### Parameters

* `atom`: A reference to an atom you want to subscribe to.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Returns

`useReadAtom` returns the exact value of the given atom, without any processing.

Internally, it uses a combination of `store.read()` and `store.watch()` calls to keep the returned value up
to date. This means the given atom is mounted for the lifespan of the calling component, and unmounted if
it is no longer referenced elsewhere.

The hook uses the active Reago store provided by the closest `StoreProvider` in the component tree above, or the
built-in default store if no custom store is set.

The returned value is the same as the value returned by a `store.read(atom, ...args)` call.

If an atom returns a `Promise`, or it's a generative atom that implicitly returns a `Promise`, the hook will
return the `Promise` directly and you will have to handle it manually. For automated handling of asynchronous
atoms, see `useReadAsyncAtom` and `useReadDeasyncAtom` hooks.

The returned value is stable. The hook will re-render only if the atom is recomputed and the new value
differs - based on an `Object.is()` comparison. Obviously, a change of the referenced atom, the family args or
the active store will trigger a re-render too.

#### Caveats

* Note that generative atoms are asynchronous by nature and will always return a `Promise` that resolves
  to the atom's value.


## Examples

### Subscribing to a simple atom

Call `useReadAtom` to subscribe to a simple atom.

```tsx
import {atomMountEffect, atomReducer} from 'reago';
import {useReadAtom} from 'reago-react';

export default function App() {
  const seconds = useReadAtom($secondsMounted);
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

### Subscribing to an atom that returns a `Promise`

Call `useReadAtom` to obtain the returned `Promise` and handle it manually.

```tsx
import {useEffect, useState} from 'react';
import {atomMemo, read} from 'reago';
import {useReadAtom} from 'reago-react';

export default function App() {
  const [data, setData] = useState(null);
  const promise = useReadAtom($currentUserData);

  useEffect(
    () => promise.then(
      response => {
        setData(response.json())
      },
      err => {
        // ...
      }
    ),
    [promise]
  );

  // ...
}

function $currentUserId() {
  return 123;
}

function $currentUserData() {
  const userId = read($currentUserId);
  const userData = atomMemo(
    () => fetch('/api/user-data/' + userId),
    [userId]
  );
  return userData;
}
```

::: warning
You should avoid unpacking `Promises` manually in favor of `useReadAsyncAtom` and `useReadDeasyncAtom` hooks.
They plug into the Reago's internal `Promise` tracking system and can make efficient use of advanced features
such as React Suspense.
:::
