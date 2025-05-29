# store.watch

`store.watch` lets you subscribe to value changes of an atom in the given store.

```ts
const watcher = store.watch($atom, ...familyArgs, listener)
```


## Reference

### `store.watch(atom, ...familyArgs, listener)`

Call `store.watch` anywhere in your code to subscribe to value changes of the given atom. Call `.clear()`
on the object returned from the `.watch()` call to unsubscribe.

```ts
import {getDefaultStore} from 'reago';

function $atom() {
  // ...
}

function $atomFamily(someArgument: string) {
  // ...
}

const someStore = getDefaultStore();
const watcher1 = someStore.watch($atom, () => {
  // $atom value changed
});
const watcher2 = someStore.watch($atomFamily, 'someValue', () => {
  // $atomFamily('someValue') changed
})

// when not needed anymore
watcher1.clear();
watcher2.clear();
```

#### Parameters

* `atom`: A reference to an atom you want to watch.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.
* `listener`: A callback invoked every time the value of the atom changes.

#### Behavior

`store.watch` creates a watcher that will notify you of changes to the value of the given atom.

Creating a watcher mounts the atom if it is not already mounted. It also triggers any pending computations
of the atom, if it is not computed or outdated.

You will not be notified for the value the atom had at the moment `store.watch` was called. The provided
listener will fire only for subsequent changes.

#### Returns

`store.watch` returns a watcher object representing the created observer.

The returned object has only one method:
* `.clear()`: Discards the watcher and stops observing the given atom. The atom might be unmounted
  if it is no longer subscribed to by anyone.

::: warning
It is highly important to discard watchers that are no longer needed, otherwise you risk leaking
atoms that will be never unmounted and will be unnecessarily recomputed. If you're using framework-specific
bindings, such as React's `useRead*Atom`, they manage the lifecycle of watchers on their own.
:::


## Examples

### Watching a custom store

Call `store.watch` to watch for value changes of the given atom.

```ts
import {atomMountEffect, atomReducer, createStore, watch} from 'reago';

function $increasingAtom() {
  const [counter, tick] = atomReducer(x => x + 1, 0);
  atomMountEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  return counter;
}

const store = createStore();
console.log(`Counter starts at ${store.read($increasingAtom)}`);

const watcher = store.watch($increasingAtom, () => {
  console.log(`Counter is now at ${store.read($increasingAtom)}`);
});

// when not needed anymore
watcher.clear();
```
