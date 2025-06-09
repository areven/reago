# Using with frameworks

We have focused heavily on how to declare atoms, how to make them efficient, and how they work under the hood.

The core APIs we have covered so far are sufficient for building any kind of third-party integration.

We aim to provide official integrations for the most popular libraries and frameworks in the JS ecosystem.
We expect the list to grow over time. We currently officially support:

* [React](#react) 17+ via `reago-react`

This article covers the basics of each official integration. For a detailed breakdown, please refer to the
[API reference](/api/).

::: tip Is your tool of choice not in the list?
Building your own custom integration is _trivial_.

Please refer to the source code of existing integrations for guidance. They are all very tiny.

Alternatively, you can give us a nudge via [GitHub Discussions](https://github.com/areven/reago/discussions).
:::


## React via `reago-react` {#react}

We officially support React 17+, including React Suspense and the React 19 `use` hook.

```sh
npm install reago-react
```

The package provides a set of React hooks for reading and modifying atoms.

### Reading the raw value of an atom

To read the raw value of an atom - exactly what you get via `read` - use the `useAtom` hook.

```tsx
import {useAtom} from 'reago-react';

function ReactComponent() {
  const [value, dispatch] = useAtom($atom);
}
```

### Reading the resolved value of an atom

To read the _resolved_ value of an atom, use the `useAsyncAtom` hook. If the atom returns a `Promise` and
it has not settled yet, Reago will use React Suspense to wait for the value.

```tsx
import {useAsyncAtom} from 'reago-react';

function ReactComponent() {
  const [value, dispatch] = useAsyncAtom($atom);
}
```

### Reading the `deasync()` value of an atom

To read the _unpacked_ value of an atom, use the `useDeasyncAtom` hook. The hook will run `deasync()`
to unpack the value returned from the atom - and rerender when the `Promise` state changes.

```tsx
import {useDeasyncAtom} from 'reago-react';

function ReactComponent() {
  const [state, dispatch] = useDeasyncAtom($atom);
}
```

### Running atom actions

All of the hooks mentioned earlier provide the `dispatch` function you can use. If you are not
interested in the atom's value, you can obtain just the `dispatch` function using the `useDispatchAtom` hook.

```tsx
import {atomAction} from 'reago';
import {useDispatchAtom} from 'reago-react';

function ReactComponent() {
  const dispatch = useDispatchAtom($atom);
  return <button onClick={() => dispatch('Hi!')}>
    Click me
  </button>;
}

function $atom() {
  atomAction((arg) => {
    console.log(arg);
  }, []);
}
```

### Other methods

The `reago-react` package provides a few other hooks to help your code be even more efficient. It also
provides utils for working with multiple stores simultaneously. Please refer to the [API reference](/api/)
for a complete list.
