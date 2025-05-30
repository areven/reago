---
titleTemplate: :title | Reago for React
---

# useAtom

`useAtom` is a React hook that is a shorthand for `useReadAtom` and `useDispatchAtom`.

```tsx
const [value, dispatch] = useAtom($atom, ...familyArgs)
```


## Reference

### `useAtom(atom, ...familyArgs)`

Call `useAtom` at the top level of your component to retrieve both the value and the dispatch method
of the given atom.


```tsx
import {useAtom} from 'reago-react';

function $atom() {
  // ...
}

function $atomFamily(someArgument: string) {
  // ...
}

function MyComponent() {
  const [value1, dispatch1] = useAtom($atom);
  const [value2, dispatch2] = useAtom($atomFamily, 'someValue');
  // ...
}
```

#### Parameters

* `atom`: A reference to an atom you want to subscribe to.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Behavior

The `useAtom` hook is a convenience shorthand for:

```tsx
[
  useReadAtom(atom, ...args),
  useDispatchAtom(atom, ...args)
]
```

Refer to the individual documentation of each hook for more details.

#### Caveats

* This hook will trigger a re-render every time the value changes. Use `useDispatchAtom` directly if you do
  not need the value.
* The returned array is not stable, only its contents are. The array reference might change with each
  invocation of the hook. We highly recommend destructuring like in the example above to avoid unnecessary
  re-renders.
