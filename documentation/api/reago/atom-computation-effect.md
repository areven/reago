# atomComputationEffect

`atomComputationEffect` is a hook that lets you implement side effects when an atom is computed.

::: code-group
```ts [Syntax]
atomComputationEffect(setup, dependencies?)
```

```ts [Types]
function atomComputationEffect(
  setup: AtomComputationEffect,
  dependencies?: unknown[]
): void

type AtomComputationEffect = () => (void | AtomComputationEffectCleanup)

type AtomComputationEffectCleanup = () => void
```
:::


## Reference

### `atomComputationEffect(setup, dependencies?)`

Call `atomComputationEffect` at the top level of your atom to declare a computation effect.

```ts
import {atomComputationEffect} from 'reago';

function $atom() {
  atomComputationEffect(() => {
    // runs on every computation
    return () => {
      // cleanup runs right before the next computation effect runs
    };
  });

  atomComputationEffect(() => {
    // runs only for the first computation
  }, []);

  atomComputationEffect(() => {
    // runs for the first computation, and then when dependencies change
  }, [...]);
}
```

#### Parameters

* `setup`: The function with your computation effect logic. It should take no arguments. Your `setup` function
  may optionally return a _cleanup_ function that takes no arguments and has no return value.
* `dependencies`: The list of all reactive values referenced inside of the `setup` code.
  The list of dependencies must have a constant number of items and be written inline like `[dep1, dep2, dep3]`.
  Reago will compare each dependency with its previous value using the `Object.is` comparison.

#### Behavior

Reago computes an atom if it has not been computed yet, or was invalidated. An atom is invalidated
when its state or values of atoms it depends on change. To put it simply - if there is a possibility that
the value of an atom changed, Reago will recompute it.

`atomComputationEffect` is a hook that lets you declare side effects that will run for atom computations.
It is not the same as putting your logic inside an atom:
* Computation effects run after computation finishes.
* Computation effects can provide a cleanup function that will run if the current computation effect
  is about to be replaced with a new computation effect (usually because of a change in `dependencies`).

There are three types of computation effects you can declare.
* If you do not provide `dependencies` at all, the effect will run for each computation. Reago will first
  run the _cleanup_ function from the previous computation, and then the `setup` from the new computation.
* If you provide an empty `dependencies` array, Reago will run `setup` only for the first computation. The
  _cleanup_ function will run only if the store or the atom itself is _destroyed_.
* If you provide a list of `dependencies`, Reago will run the `setup` function for the first computation,
  and then on subsequent computations, it will run the old _cleanup_ and the new `setup` only if `dependencies`
  changed.

#### Caveats
* `atomComputationEffect` is a hook, so you can only call it at the top level of your atom. You cannot call it
  inside loops or conditions.
* Computation effects run _after_ the atom computation finishes.
* Computation effects run before mount effects.


## Examples

### Getting the current unix time

Create an atom that returns the current unix time. Use a computation effect to invalidate
the result after a second.

```ts
import {atomComputationEffect, atomStore} from 'reago';

function $unixTime() {
  const {invalidate} = atomStore();

  atomComputationEffect(() => {
    const timeout = setTimeout(() => {
      invalidate($currentUnixTime);
    }, 1000);
    return () => clearTimeout(timeout);
  });

  return Math.floor(Date.now() / 1000);
}
```

### Tracking the window width

Create an atom that returns the `window.innerWidth`. Use a computation effect to invalidate the
result when browser fires the `resize` event.

```ts
import {atomComputationEffect, atomStore} from 'reago';

function $windowWidth() {
  const {invalidate} = atomStore();

  atomComputationEffect(() => {
    const handler = () => invalidate($windowWidth);
    window.addEventListener('resize', handler, {once: true});
    return () => window.removeEventListener('resize', handler);
  });

  return window.innerWidth;
}
```
