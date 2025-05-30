# atomAbortSignal

`atomAbortSignal` is a hook that lets you get the `AbortSignal` for the active computation.

```ts
const abortSignal = atomAbortSignal()
```

:::info
`AbortSignal` is a built-in JavaScript interface that allows you to communicate with an asynchronous
operation (such as a fetch request) and abort it if required. It's part of the standard `AbortController` API,
which enables fine-grained control over tasks such as network requests or timers.
:::


## Reference

### `atomAbortSignal()`

Call `atomAbortSignal` at the top level of your atom to get the `AbortSignal` for the active computation.

```ts
import {atomAbortSignal} from 'reago';

function $atom() {
  const abortSignal = atomAbortSignal();
}
```

#### Motivation

Asynchronous atoms might take a long time to compute, especially when using the network.
If an atom is invalidated during a computation (e.g. because its dependencies changed), the active
computation is cancelled and a new one is started - with updated values.

The `AbortSignal` notifies you that the active computation was cancelled, allowing you to skip running
expensive tasks.

#### Returns

`atomAbortSignal` returns the `AbortSignal` assigned for the active computation.

The returned signal is unique for the active computation of the atom. Atoms your atom depend on
will have their own unique signal.

Calling `atomAbortSignal` multiple times within an atom will return the same signal.

#### Caveats

* `atomAbortSignal` is a hook, so you can only call it at the top level of your atom. You cannot call it inside loops
  or conditions.


## Examples

### Using `fetch()` with `AbortSignal`

Read-only network requests should be cancelled when a computation is aborted. Call `atomAbortSignal` to obtain
the signal for the active computation, and pass it to `fetch()`.

```ts
import {atomAbortSignal, read} from 'reago';

function* $userData() {
  const userId = read($activeUserId);
  const signal = atomAbortSignal();

  try {
    const data = yield fetch(`/api/user-data/${userId}`, {signal});
    return data.json();
  } catch (err) {
    return null;
  }
}
```

### Manually checking if a computation is aborted

The `AbortSignal` built-in JavaScript interface provides a synchronous `.aborted` flag that you can query
during computations.

```ts
function* $longComputation() {
  const signal = atomAbortSignal();
  yield doSomethingExpensive();
  if (signal.aborted) throw null;
  yield doAnotherExpensiveTask();
  // ...
}
```
