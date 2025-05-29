---
titleTemplate: :title | Reago for React
---

# useDispatchAtom

`useDispatchAtom` is a React hook that lets you access an atom's dispatch method for the currently
active Reago store.

```tsx
const dispatch = useDispatchAtom($atom, ...familyArgs)
```


## Reference

### `useDispatchAtom(atom, ...familyArgs)`

Call `useDispatchAtom` at the top level of your component to retrieve the dispatch method of the given
atom.


```tsx
import {useDispatchAtom} from 'reago-react';

function $atom() {
  // ...
}

function $atomFamily(someArgument: string) {
  // ...
}

function MyComponent() {
  const dispatchAtom = useDispatchAtom($atom);
  const dispatchAtomFamily = useDispatchAtom($atomFamily, 'someValue');
  // ...
}
```

#### Parameters

* `atom`: A reference to an atom you want to get the dispatch method for.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.


#### Returns

`useDispatchAtom` returns the dispatch method for the given atom.

The hook uses the active Reago store provided by the closest `StoreProvider` in the component tree above, or the
built-in default store if no custom store is set.

The dispatch method is the same as the method returned by a `store.dispatch(atom, ...args)` call.

The returned dispatch method is stable, meaning it is memoized and will not change unless the active store,
the atom reference or the family args change. It prevents unnecessary re-renders.


## Examples

### Updating an atom

Call `useDispatchAtom` to obtain a dispatch method and then use it to update an atom.

```tsx
import {atomAction, atomState} from 'reago';
import {useDispatchAtom} from 'reago-react';

export default function App() {
  const updateAtom = useDispatchAtom($atom);
  return (
    <button onClick={() => updateAtom(42)}>
      Set $atom to 42
    </button>
  );
}

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}
```

### Updating an atom family

Call `useDispatchAtom` multiple times to obtain dispatch methods for each atom of an atom family.

```tsx
import {atomAction, atomState} from 'reago';
import {useDispatchAtom} from 'reago-react';

export default function App() {
  const updateAtom1 = useDispatchAtom($atom, 1);
  const updateAtom2 = useDispatchAtom($atom, 2);
  return <>
    <button onClick={() => updateAtom1(42)}>
      Set $atom(1) to 42
    </button>

      <button onClick={() => updateAtom2(24)}>
      Set $atom(2) to 24
    </button>
  </>;
}

function $atomFamily(id: number) {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}
```

### Using a custom store

Use a `StoreProvider` to set which store `useAtomDispatch` will refer to.

```tsx
import {atomAction, atomState, createStore} from 'reago';
import {StoreProvider, useDispatchAtom} from 'reago-react';

const store1 = createStore();
const store2 = createStore();

export default function App() {
  return <>
    <StoreProvider store={store1}>
      <ComponentThatWritesToCustomStore
        label='Set $atom to 42 in store1'
        value={42}
      />
    </StoreProvider>
    <StoreProvider store={store2}>
      <ComponentThatWritesToCustomStore
        label='Set $atom to 24 in store2'
        value={24}
      />
    </StoreProvider>
  </>;
}

function ComponentThatWritesToCustomStore({label, value}) {
  const updateAtom = useDispatchAtom($atom);
  return (
    <button onClick={() => updateAtom(value)}>
      {label}
    </button>
  );
}

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}
```
