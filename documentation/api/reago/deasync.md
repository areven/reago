# deasync

`deasync` is an utility function that lets you access asynchronous results synchronously.

```ts
const {status, result, error} = deasync(variable | promise);
const $derivedAtom = deasync(atom);
```


## Reference

### `deasync(input)`

Call `deasync` anywhere in your code to turn an asynchronous input into a synchronous equivalent.

#### Regular variables

```ts
import {deasync} from 'reago';

deasync(true); // returns {status: 'resolved', result: true}
deasync(42); // returns {status: 'resolved', result: 42}
deasync({x: 1}); // returns {status: 'resolved', x: 1}
```

Regular variables are already synchronous and are immediately converted into a `resolved` `DeasyncState`.

#### `Promise-like` objects

```ts
import {deasync} from 'reago';

const queryPromise = fetch(...);
// ...
const {status, result, error} = deasync(queryPromise);
```

A `deasync` call on a `Promise` registers it in Reago's tracking system if it is not known already,
and returns the last known state.

#### Atoms

```ts
import {deasync, read} from 'reago';

function $atom() {
  return Promise.resolve(42);
}

const $derivedAtom = deasync($atom);
const {status, result, error} = read($derivedAtom);
```

A `deasync` call on an atom creates a new derived atom that returns the original return value, piped through
`deasync`. The derived atom stays in sync with the original atom, tracking `Promise` states.

#### Parameters

* `input`: A possibly asynchronous variable you want to track and _unpack_.

#### Motivation

The standard `Promise` API lacks an essential feature - it is not possible to synchronously check whether
a `Promise` settled and get the outcome. If you hold a reference to a `Promise`, even if you know it already
resolved, you still have to call `.then()` and asynchronously wait for the callback to fire.

It is highly inefficient.

If an asynchronous atom recomputes because its dependencies changed, but the asynchronous part is unaffected,
what would be the point of kicking off a new asynchronous computation and triggering loading states in the UI,
if the result is already there?

#### Behavior

Reago has an internal `Promise` tracking system which keeps tabs on any `Promise`-like objects it encounters.
Promises returned from atoms, promises awaited in generative atoms, promises returned from generative
atoms themselves - we observe them all, so that if they ever come up again (e.g. during an atom recomputation),
we can synchronously compute the new atom value and avoid unnecessary re-renders.

The system is non-invasive. It uses a combination of weak maps and weak refs to hold our metadata externally.
Usage of weak references ensures the promises can be garbage collected when you no longer use them.

`deasync` is the public API that lets you query Reago's tracking system. It is especially useful when
implementing framework bindings. If you are familiar with the `useReadAsyncAtom` React hook, it internally
uses `deasync` to avoid triggering Suspense for promises that are already settled.

If you call `deasync` with a `Promise` Reago have not seen before, it will start tracking it. However,
due to the `Promise` API limitations, it will first return the `pending` status, even if it already settled.

#### Returns

* For non-atoms, `deasync` returns an object representing the unpacked input.
  ```tsx
  interface DeasyncState<ResultType, ErrorType> {
    status: 'pending' | 'resolved' | 'rejected';
    result?: ResultType;
    error?: ErrorType;
  }
  ```

* For atoms, `deasync` returns a new derived atom that tracks the original atom and pipes its value
  through `deasync`.

#### Caveats
* If a `Promise` is already settled, but Reago have not encountered it before, `deasync` will initially
  return a `pending` status.


## Examples

### Reading a settled generative atom synchronously

A generative atom always returns a `Promise`, but what if Reago was able to compute its value synchronously?
A `read()` call will still give you a `Promise`, but its outcome was already stored in the internal tracking
system. You can get it out using `deasync`.

```ts
import {deasync, read} from 'reago';

function* $asyncAtom() {
  return 42;
}

const promise = read($asyncAtom);
const unpackedPromise = deasync(promise);
assert(unpackedPromise.status === 'resolved');
assert(unpackedPromise.result === 42);
```

The same logic applies to atoms derived via `deasync`.

```ts
import {deasync, read} from 'reago';

function* $asyncAtom() {
  return 42;
}

const $deasyncAtom = deasync($asyncAtom);

const unpackedPromise = read($deasyncAtom);
assert(unpackedPromise.status === 'resolved');
assert(unpackedPromise.result === 42);
```
