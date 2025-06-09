# Using the AbortSignal

Reago might cancel a computation while it is in progress.

If your atom is asynchronous, takes a while to resolve and your user clicks around rapidly,
changes of state might cause the atom to _invalidate_ before the long-running operation finishes.


## A simple example

If your atom fetches data from the internet based on user input, it is possible a new request will
start before the previous one finishes.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $searchQuery() {
  const [query, setQuery] = atomState('');
  atomAction(setQuery, []);
  return query;
}

function* $searchResults() {
  const query = read($searchQuery);
  const response = yield fetch(`/api/search/${searchQuery}`);
  return yield response.json();
}

// user search for 'reago'
dispatch($searchQuery)('reago');

// a split-second later the user searches for 'docs'
dispatch($searchQuery)('docs');
```

The `$searchResults` atom creates a new `fetch()` request every time the `$searchQuery` changes.

If the user changes the search query rapidly, multiple network requests will be triggered, whereas
we only need the last one.

While Reago internally cancels the old computations and discards their results, it is unable
to terminate asynchronous operations on its own.

It does however offer a mechanism to let you know a computation was aborted.


## What is an `AbortSignal`?

`AbortSignal` is a **built-in** JavaScript interface that allows you to communicate with an asynchronous
operation (such as a `fetch` request) and abort it if required. It is part of the standard `AbortController`
API, which enables fine-grained control over tasks such as network requests or timers.

Reago uses this well-defined JavaScript API and creates an `AbortController` for each computation. You can
obtain the related `AbortSignal` and use it to abort long-running tasks.


## Using the `atomAbortSignal()` hook

You can obtain the `AbortSignal` for the current computation by calling the `atomAbortSignal()` hook.

Many of the JavaScript APIs can accept the `AbortSignal` directly, and one of them is `fetch`.

Here is how you can cancel a `fetch()` request when it is no longer needed.

```ts
import {atomAbortSignal, atomAction, atomState, dispatch, read} from 'reago';

function $searchQuery() {
  const [query, setQuery] = atomState('');
  atomAction(setQuery, []);
  return query;
}

function* $searchResults() {
  const query = read($searchQuery);
  const signal = atomAbortSignal(); // [!code highlight]
  const response = yield fetch(`/api/search/${searchQuery}`, {signal}); // [!code highlight]
  return yield response.json();
}
```


## Common `AbortSignal` usage patterns

You can manually poll the signal to check whether it is aborted.

```ts
const signal = atomAbortSignal();
if (signal.aborted) {
  // ...
}
```

You can also make it throw if it is aborted, which sometimes can make things more concise.

```ts
const signal = atomAbortSignal();
signal.throwIfAborted();
```

Alternatively, you can attach an event listener to it, but it is least useful within atoms.

```ts
const signal = atomAbortSignal();
signal.addEventListener('abort', () => {
  // ...
});
```


## Further reading

If you are using asynchronous operations heavily, we highly recommend familiarizing yourself
with the following articles:

* [MDM Web Docs on `AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
* [Reago API reference for `atomAbortSignal`](/api/reago/atom-abort-signal)
