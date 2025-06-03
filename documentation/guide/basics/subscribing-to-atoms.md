# Subscribing to an atom

So far, we have used `read` to access atom values on demand.

To build a truly reactive app - where your UI automatically reflects global state changes - you
will need a way to stay in sync.

That is where `watch` comes in. It lets you subscribe to an atom and run a callback whenever the value
of the atom changes.

::: info Before we proceed...
In practice, you will rarely use `watch` directly. Most apps rely on framework-specific bindings like
`useAtom` in React.

Still, it is useful to understand how atom subscriptions work under the hood, especially when debugging,
writing side effects or building your own abstractions.
:::


## Using `watch`

The `watch` function takes two arguments: the atom you want to observe, and a callback.
The callback will run every time the atom's value changes.

```ts
import {atomAction, atomReducer, dispatch, read, watch} from 'reago'

function $counter() {
  const [value, increase] = atomReducer(x => x + 1, 0);
  atomAction(increase, []);
  return value;
}

const watcher = watch($counter, () => { // [!code highlight]
  console.log(`Counter changed to ${read($counter)}`); // [!code highlight]
}); // [!code highlight]

dispatch($counter)(8); // prints Counter changed to 8
dispatch($counter)(42); // prints Counter changed to 42
```

The `watch` call returns a watcher object representing the created observer. Make sure to
call its `.clear()` method when you are done observing the atom to avoid memory leaks.

```ts
watcher.clear();
```


## Initial call behavior

By default, the callback is only triggered when the atom's value changes.
If you want to run logic immediately with the current value, you can do a `read` upfront.

```ts
onCounterChange(); // [!code highlight]
const watcher = watch($counter, onCounterChange);
```


## Watches are reactive

If your atom depends on other atoms, the watcher will respond to any change in the dependency graph.

For example:

```ts
import {atomAction, atomState, dispatch, read, watch} from 'reago';

function $number() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

function $doubledNumber() {
  return read($number) * 2;
}

const watcher = watch($doubledNumber, () => {
  console.log(`Doubled number changed to ${read($doubledNumber)}`);
});

dispatch($number)(21); // prints 42
```

Whenever `$number` changes, `$doubledNumber` is recomputed, and your callback will fire.


## Mounted atoms

When you call `watch`, the atom becomes mounted - meaning it is actively kept up to date.

All atoms track their dependencies, mounted or not.
But mounted atoms differ in one key way: they recompute immediately when any of their dependencies change,
instead of waiting for the next `read`.

In other words, a mounted atom is live. It reacts to changes as they happen, keeping its value up to date so
that subscribers like `watch` or UI bindings get notified right away.

You can think of mounting an atom like mounting a UI component in the DOM. It goes from being just a declaration
to being live.

Mounting is recursive: if a mounted atom depends on other atoms, those atoms will also be mounted.

Once there are no subscribers left - no explicit watchers and no mounted dependents - the atom is unmounted
and goes back to recomputing lazily on demand.

In the next article, we are going to learn about side effects, including running effects when an atom is
mounted or unmounted.

