# Invalidating atoms manually

Atoms are invalidated by Reago when it suspects their value might have changed. Maybe an internal `atomState`
has a new value, maybe a reducer was called, or maybe a dependency changed. An invalidated atom will
be recomputed the next time it is _read_, or immediately - if it is mounted.

You can invalidate atoms manually too. It is extremely useful for things like refreshing `fetch()` results
or storing values that change over time.


## Using `invalidate`

To invalidate an atom, simply call `invalidate`.

```ts
import {invalidate, read} from 'reago';

function $selectedRandomNumber() {
  return Math.random();
}

read($selectedRandomNumber);       // returns some number
read($selectedRandomNumber);       // returns the same number
invalidate($selectedRandomNumber); // invalidates the atom [!code highlight]
read($selectedRandomNumber);       // returns a different number
```

Invalidating an atom causes it to recompute, but it does not affect the state of hooks inside it.

```ts
import {atomAction, atomState, dispatch, invalidate, read} from 'reago';

function $persistedValue() {
  const [value, setValue] = atomState(0); // <- unaffected! [!code highlight]
  atomAction(setValue, []);
  return value;
}

dispatch($persistedValue)(42); // set value to 42
read($persistedValue);         // returns 42
invalidate($persistedValue);   // invalidates the atom
read($persistedValue);         // returns 42 - it is still there
```

In the example above, Reago recomputed `$persistedValue` but also noticed the atom value did not change.
Other atoms that read `$persistedValue` would be unaffected.

Invalidation is not recursive - it invalidates only the given atom, not the other atoms it depends on.
However, if recomputing the given atom would yield a new value, the change will obviously propagate through
the graph.


## Short introduction to stores

We mentioned briefly that atom values, state of their hooks, dependencies and similar are stored in a _store_.

Reago provides a default store that we have been using implicitly. Functions such as `read`, `watch`, `dispatch`
and `invalidate` detect the execution context and _proxy_ the call to the active store.

You might be using multiple stores in a single app, which we will cover later in the _Advanced features_ section.

For now, we only need to know that due to JS limitations execution context cannot be tracked across asynchronous
calls. If you were to call `invalidate` inside a `setTimeout` callback, it would not know which store to use.

For such use cases, you need to carry over the store context manually.


## Tracking the unix time

Here is a fun exercise that will make use of what we have learned so far. Let us try to create a `$unixTime`
atom that returns the number of seconds elapsed since Jan 1, 1970.

The vanilla JS approach would be to use `setInterval` and update the UI every second. Can we do something
similar in Reago?

```ts
import {atomComputationEffect, atomState} from 'reago';

function $unixTime() {
  const [time, setTime] = atomState(Math.floor(Date.now() / 1000));

  atomComputationEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
```

It will work - but it is going to be incredibly inefficient.

We are going to update the atom value every second, regardless of whether it is actually used or not. The
computation effect will set up an interval on first access, and cancel it only when the atom is destroyed -
so practically never. We need a different approach.

The React way would be to create a `useEffect` that sets up the interval when the component is mounted, and
removes it when it is unmounted. We have mount side effects in Reago, so maybe that will work?

```ts
import {atomMountEffect, atomState} from 'reago';

function $unixTime() {
  const [time, setTime] = atomState(Math.floor(Date.now() / 1000));

  atomMountEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
```

If you use this atom exclusively with `watch`, it will work too. The problems start if you try to do
one-off reads while `$unixTime` is not mounted. There will be no interval running and you will get a
_stale_ value that is possibly way in the past.

::: warning A word of warning
It is a common pitfall to try using Reago mount effects the same way React mount effects work. Most of
the time, it will not work correctly for one time reads.

We said it before and we will say it again - in practice, you will be using mount effects very rarely.
:::

To implement `$unixTime` correctly, we have to change the way we think. Instead of thinking of it as
a value that updates every second, let us assume it is a value that is valid only for a second, and
has to be updated afterwards.

This way of thinking brings us to a simple solution - we can create an atom that returns the current unix
time, and register a computation effect that will invalidate the atom a second later.

```ts
import {atomComputationEffect, atomStore} from 'reago';

function $unixTime() {
  const {invalidate} = atomStore();

  atomComputationEffect(() => {
    const timeout = setTimeout(() => {
      invalidate($unixTime);
    }, 1000);
    return () => clearTimeout(timeout);
  });

  return Math.floor(Date.now() / 1000);
}
```

Notice how we manually retrieve the `invalidate` method for the active store. That is because the execution
context does not carry over to the asynchronous `setTimeout` callback.

This pattern is very common in Reago and can be successfully used for many things.

Here is another example, where a `$windowWidth` atom tracks the current window width.

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
