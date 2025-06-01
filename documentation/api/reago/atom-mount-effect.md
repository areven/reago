# atomMountEffect

`atomMountEffect` is a hook that lets you implement side effects when an atom is mounted and unmounted.

::: code-group
```ts [Syntax]
atomMountEffect(setup, dependencies)
```

```ts [Types]
function atomMountEffect(
  setup: AtomMountEffect,
  dependencies: unknown[]
): void

type AtomMountEffect = () => (void | AtomMountEffectCleanup)

type AtomMountEffectCleanup = () => void
```
:::

An atom is mounted when someone subscribes to it via `watch()` and unmounted when there are no subscribers
left. A one-off `read()` does not mount an atom.


## Reference

### `atomMountEffect(setup, dependencies)`

Call `atomMountEffect` at the top level of your atom to declare a mount effect.

```ts
import {atomMountEffect} from 'reago';

function $atom() {
  atomMountEffect(() => {
    // when atom is mounted
    return () => {
      // when atom is unmounted
    };
  }, []);
}
```

#### Parameters

* `setup`: The function with your mount effect logic. It should take no arguments. Your `setup` function may
  optionally return a _cleanup_ function that takes no arguments and has no return value.
* `dependencies`: The list of all reactive values referenced inside of the `setup` code.
  The list of dependencies must have a constant number of items and be written inline like `[dep1, dep2, dep3]`.
  Reago will compare each dependency with its previous value using the `Object.is` comparison.

#### Behavior

Reago mounts an atom when it is subscribed to via `watch`. A mounted atom is an atom whose value is actively
used. If a mounted atom depends on another atom (via `read`), the dependency is mounted too. An atom is unmounted
when it is no longer subscribed to.

* A mounted atom will recompute immediately if it was invalidated. Reago has to compute it again to check if its
  value changed, and notify the subscribers immediately.
* An unmounted atom has no-one actively observing its value, so it will not recompute immediately if invalidated.
  Instead, it will be recomputed lazily on next read.

A one-off `read` of an atom does not mount it, because the value is retrieved only once and there is no-one
listening for updates.

When an atom is mounted, Reago will run all declared mount effects in the order they appear.

When an atom is unmounted, Reago will run all (optional) _cleanup_ functions of declared mount effects in the
_reverse_ order of appearance.

When the dependencies of a mount effect change and the atom is mounted, Reago will first run the old
_cleanup_ function, followed by the new _setup_ logic.

#### Caveats

* `atomMountEffect` is a hook, so you can only call it at the top level of your atom. You cannot call it
  inside loops or conditions.
* `atomMountEffect` does not run for one-off `read` calls. When declaring mount effects, ensure your atom
  works correctly for one-off reads too. A common pitfall is to put timer-based logic inside a mount effect
  without considering what will happen if an atom will not be mounted at all. You might need a computation
  effect instead.
* Mount effects run _after_ computation effects.


## Examples

### Timer-based mount effects might be a bad idea

We mentioned in the caveats that setting up timer-based logic in mount effects might not work as you expect.
Here is a good exercise - let us implement an atom that keeps track of the current unix time, a.k.a. the number of
seconds that have elapsed since January 1, 1970.

The intuitive approach is to create an atom that holds a state variable and declare a mount effect that updates it
every second.

```ts
import {atomMountEffect, atomState} from 'reago';

function $unixTime() {
  const [time, setTime] = atomState(Math.floor(Date.now() / 1000));
  atomMountEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => interval;
  }, []);
  return time;
}
```

Looks reasonable at a first glance. If you only access it via `watch`-based APIs, like React's `useReadAtom`,
it will work. The atom will recompute only when it is displayed in the UI and will not update otherwise.

Things start to go wrong if at some point you decide to call `read($unixTime)`. If the atom is not currently mounted,
and was accessed before, it already holds a stale state that will not be updated.

To fix this, we need to look at the problem differently. The implementation above thinks of unix time as a state
that updates every second. Instead, let us assume it is a computed value, that is valid only for a second and
expires afterwards.

Timer-based expiration can be easily implemented using computation effects.

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
