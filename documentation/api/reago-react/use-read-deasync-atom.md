---
titleTemplate: :title | Reago for React
---

# useReadDeasyncAtom

`useReadDeasyncAtom` is a React hook that lets you subscribe to _unpacked_ atom's value in the
currently active Reago store.

::: code-group
```tsx [Syntax]
const {status, result, error} = useReadDeasyncAtom($atom, ...familyArgs)
```

```ts [Types]
function useReadDeasyncAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): DeasyncStateOf<T>

type DeasyncStateOf<T extends AnyAtom> =
  DeasyncState<Awaited<AtomResultOf<T>>>

type DeasyncState<ResultType = unknown, ErrorType = unknown> = (
  PendingDeasyncState |
  ResolvedDeasyncState<ResultType> |
  RejectedDeasyncState<ErrorType>
);

interface PendingDeasyncState {
  status: 'pending';
  result?: undefined;
  error?: undefined;
}

interface ResolvedDeasyncState<ResultType> {
  status: 'resolved';
  result: ResultType;
  error?: undefined;
}

interface RejectedDeasyncState<ErrorType> {
  status: 'rejected';
  result?: undefined;
  error: ErrorType;
}
```
:::

The hook uses `deasync()` and Reago's internal `Promise` tracking system on the atom value to unpack it.
`Promise`-like objects are turned into simple objects that can be queried synchronously.

The hook lets you handle both synchronous and asynchronous atoms without using React Suspense.


## Reference

### `useReadDeasyncAtom(atom, ...familyArgs)`

Call `useReadDeasyncAtom` at the top level of your component to subscribe to the unpacked value of a possibly
asynchronous atom.


```tsx
import {useReadDeasyncAtom} from 'reago-react';

function $atom() {
  // ...
}

function* $atomFamily(someArgument: string) {
  // ...
}

function MyComponent() {
  const unpackedValue1 = useReadAsyncAtom($atom);
  const unpackedValue2 = useReadAsyncAtom($atomFamily, 'someValue');
  // ...
}
```

#### Parameters

* `atom`: A reference to an atom you want to subscribe to.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Returns

`useReadDeasyncAtom` returns an object representing the unpacked value of an atom.

```tsx
interface DeasyncState<ResultType, ErrorType> {
  status: 'pending' | 'resolved' | 'rejected';
  result?: ResultType;
  error?: ErrorType;
}
```

If an atom returns a value that is not a `Promise`-like object, the `status` will be always immediately
set to `resolved` and the value will be stored as a `result` as is.

Otherwise, the hook uses `deasync()` and Reago's internal `Promise` tracking system to describe the current
state of the `Promise`. Naturally, the hook will re-render when the `Promise` is settled.

Internally, it uses a combination of `deasync()`, `store.read()` and `store.watch()` calls to keep the
returned value up to date. This means the given atom is mounted for the lifespan of the calling component,
and unmounted if it is no longer referenced elsewhere.

The hook uses the active Reago store provided by the closest `StoreProvider` in the component tree above, or the
built-in default store if no custom store is set.

The returned object is stable and immutable. A new object will be created if and only if it changes.


## Examples

### Subscribing to any atom

Call `useReadDeasyncAtom` to subscribe to the unpacked value of any atom. The atom can be functional,
generative, synchronous, asynchronous - it does not matter.

```tsx
import {atomMountEffect, atomReducer} from 'reago';
import {useReadDeasyncAtom} from 'reago-react';

export default function App() {
  const {result} = useReadDeasyncAtom($secondsMounted);
  return <div>
    Atom was mounted for {result ?? 'an unknown number of'} seconds so far.
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

### Handling asynchronous atoms

`useReadDeasyncAtom` is designed to work with atoms that might be asynchronous. Always implement proper
handling of the `pending` and `rejected` states.

```tsx
import {useReadDeasyncAtom} from 'reago-react';

export default function App() {
  const userBirthday = useReadDeasyncAtom($userBirthday);

  if userBirthday.status == 'pending' {
    return <div>Loading data...</div>;
  } else if userBirthday.status == 'resolved' {
    return <div>User was born on {userBirthday.result}</div>;
  } else {
    return <div>Failed to load user birthday</div>;
  }
}

function* $userBirthday {
  yield new Promise(resolve => setTimeout(resolve, 1000));
  return 'Mar 8, 1993';
}
```
