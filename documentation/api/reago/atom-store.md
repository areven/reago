# atomStore

`atomStore` is a hook that lets you access the currently active Reago store.

```ts
const store = atomStore()
```


## Reference

### `atomStore()`

Call `atomStore` at the top level of your atom to access the active Reago store.

```ts
import {atomStore} from 'reago';

function $atom() {
  const activeStore = atomStore();
  // ...
}
```

#### Returns

`atomStore` returns the currently active Reago store within an atom.

The active store is determined by the computation context. It is the store you are reading from.

The returned store reference is stable and can be safely omitted from effect dependencies. It is exactly
the same as the value returned from `getDefaultStore` or one of your `createStore` calls.

#### Caveats

* `atomStore` is a hook, so you can only call it at the top level of your atom. You cannot call it inside loops
  or conditions.


## Examples

### Self-invalidating atom

An atom can invalidate itself by obtaining the active store reference and using its `.invalidate()` method.

```ts
import {atomComputationEffect, atomStore} from 'reago';

function $unixTime() {
  const store = atomStore();
  atomComputationEffect(() => {
    const timeout = setTimeout(() => {
      store.invalidate($currentUnixTime);
    }, 1000);
    return () => clearTimeout(timeout);
  });
  return Math.floor(Date.now() / 1000);
}
```

This approach presents an interesting pattern - it is an atom that computes the result, in this case the current
unix time, and makes the result valid only for a second. A read that occurs in less than a second will get
the already computed value, but if it occurs later, the atom will recompute. It works efficiently with `watch()`
too.
