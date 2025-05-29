# watch

`watch` subscribes to value changes of an atom in the active store, which is determined by the current
execution context.

```ts
const watcher = watch($atom, ...familyArgs, listener)
```


## Reference

### `watch(atom, ...familyArgs, listener)`

Call `watch` anywhere in your code. The method is context-aware and its behavior varies.

#### Normal usage

```ts
import {watch} from 'reago';

function $atom() {
  // ...
}

const watcher = watch($atom, () => {
  // $atom value changed in the built-in default store
});

// when not needed anymore
watcher.clear();
```

A `watch` call outside of a computation context defaults to reading from the built-in default store. It is a
shorthand for `getDefaultStore().watch()`.

#### Usage within an atom

Using `watch` within an atom is forbidden. Use `read` to subscribe to another atom.

#### Usage within a hook callback

```ts
import {atomMountEffect, watch} from 'reago';

function $atom() {
  return 42;
}

function $atomWithCallbacks() {
  atomMountEffect(() => {
    const watcher = watch($atom, () => {
      // $atom value changed in the active store
    });
    return () => watcher.clear();
  });
}
```

A `watch` within a hook callback in an atom is also context-aware, and similarly, uses the store
the atom computation was running in.

#### Parameters

* `atom`: A reference to an atom you want to watch.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.
* `listener`: A callback invoked every time the value of the atom changes.

#### Behavior

`watch` creates a watcher that will notify you of changes to the value of the given atom.

Creating a watcher mounts the atom if it is not already mounted. It also triggers any pending computations
of the atom, if it is not computed or outdated.

You will not be notified for the value the atom had at the moment `watch` was called. The provided
listener will fire only for subsequent changes.

#### Returns

`watch` returns a watcher object representing the created observer.

The returned object has only one method:
* `.clear()`: Discards the watcher and stops observing the given atom. The atom might be unmounted
  if it is no longer subscribed to by anyone.

::: warning
It is highly important to discard watchers that are no longer needed, otherwise you risk leaking
atoms that will be never unmounted and will be unnecessarily recomputed. If you're using framework-specific
bindings, such as React's `useRead*Atom`, they manage the lifecycle of watchers on their own.
:::

#### Caveats
* Reago can track execution context across synchronous calls and generative atoms only. If you define an
  asynchronous callback within a hook callback and try calling `watch` inside, we will not be able to
  determine the active store.


## Examples

### Watching the default store

Call `watch` anywhere outside of the computation context to watch the default store.

```ts
import {atomMountEffect, atomReducer, read, watch} from 'reago';

function $increasingAtom() {
  const [counter, tick] = atomReducer(x => x + 1, 0);
  atomMountEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  return counter;
}

console.log(`Counter starts at ${read($increasingAtom)}`);

const watcher = watch($increasingAtom, () => {
  console.log(`Counter is now at ${read($increasingAtom)}`);
});

// when not needed anymore
watcher.clear();
```
