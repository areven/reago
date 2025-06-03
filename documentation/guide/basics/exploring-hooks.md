# Exploring other hooks

We learned about `atomState` and `atomAction` so far. Let us explore a few other basic hooks
that are in frequent use.


## References with `atomRef`

When we declared a state variable with `atomState`, we made it reactive. The calls we made to the
_set_ functions invalidated the atoms, forcing them to recompute.

But what if we need to hold state that does not affect the atom value? Using `atomState` would be
highly inefficient - recomputing the atom is not necessary.

For such use cases, we can use `atomRef`. It declares a _reference_ which can hold a value that will
not trigger a recomputation when the value changes.

```ts
import {atomAction, atomRef, atomState, read, dispatch} from 'reago';

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);

  const computationCounter = atomRef(0); // [!code highlight]
  computationCounter.current++; // [!code highlight]
  console.log(`$atom computed ${computationCounter.current} time(s)`); // [!code highlight]

  return value;
}

read($atom);          // prints $atom computed 1 time(s)
read($atom);          // prints nothing
dispatch($atom)(42);  // sets `value` to 42
read($atom);          // prints $atom computed 2 time(s)
dispatch($atom)(42);  // ignored - `value` did not change
read($atom);          // prints nothing
```

The idea is very simple. We declared a reference named `computationCounter` and gave it the initial
value of `0`. We got back an object with a single property named `current` - which holds the current value.

The object reference stays the same across computations. We can put any type of data into `current`, it will
persist across computations, but will not trigger a recomputation on change.

## Memoization with `atomMemo`

Another common use case is memoization of expensive computations.

Imagine we have an atom with an unordered list of blog posts. We want to create another atom that sorts
them by date and filters by given search criteria at the same time. We can avoid sorting the list every time
the search criteria change by memoizing the ordered list.

```ts
import {atomMemo, read} from 'reago';

function $searchResults() {
  const unorderedPosts = read($posts);
  const searchQuery = read($searchQuery);

  const orderedPosts = atomMemo( // [!code highlight]
    () => [...unorderedPosts].sort((a, b) => b.timestamp - a.timestamp), // [!code highlight]
    [unorderedPosts] // [!code highlight]
  ); // [!code highlight]

  return orderedPosts.filter(
    post => post.text.includes(searchQuery)
  );
}
```

We declared a _memoized variable_ named `orderedPosts`. Reago will run the given function during the first
computation and cache the result. On subsequent computations, it will re-run the function only if the dependencies
provided in the second argument change.

## Stable references with `atomMemo`

Reago relies on `Object.is()` to check for value changes. For example:

* If an atom is recomputed, Reago will call `Object.is()` to compare the old value with the new one.
  If they are equal, there is no need to propagate this change through the graph.
* If you call a _set_ function of a state variable declared with `atomState`, Reago will call `Object.is()`
  to compare the current value with the given new value. If they are identical, the update will be silently
  ignored.

What if effectively means is that __Reago does not perform a deep comparison of values__.

If your atom returns an object or an array and it is recreated on every computation, the reference
is not stable. Even if the returned values _look_ identical, they are not - and they will propagate
through the dependency graph, affecting your app's performance.

Did you spot the issue in the memoization example earlier?

```ts{6}
const orderedPosts = atomMemo(
  () => [...unorderedPosts].sort((a, b) => b.timestamp - a.timestamp),
  [unorderedPosts]
);

return orderedPosts.filter(o => o.text.includes(searchQuery)); // [!code focus]
```

`Array.filter()` creates a new array on every computation. The atom will recompute when the search query
changes but the list of matched blog posts might stay the same. We can avoid returning different-but-identical
arrays by using `atomMemo` again.

```ts
import {atomMemo, read} from 'reago';

function $searchResults() {
  const unorderedPosts = read($posts);
  const searchQuery = read($searchQuery);

  const orderedPosts = atomMemo(
    () => [...unorderedPosts].sort((a, b) => b.timestamp - a.timestamp),
    [unorderedPosts]
  );

  const matchedPosts = orderedPosts.filter(
    post => post.text.includes(searchQuery)
  );

  return atomMemo( // [!code highlight]
    () => matchedPosts, // [!code highlight]
    [...matchedPosts] // [!code highlight]
  ); // [!code highlight]
}
```

Keep in mind, this is a performance optimization. We could remove memoization from `$searchResults` entirely
and it would still work correctly. The key is finding the right balance between code readability and effective
caching.


## Reducers with `atomReducer`

Sometimes you want to manage more complex state updates. For example, when updates depend on the previous value,
or when a single operation can produce different effects depending on its type. For such cases, Reago offers the
`atomReducer` hook.

It follows a familiar pattern: you define a reducer function and an initial value. The reducer receives the current
state and your argument, and returns the new state.

```ts
import {atomReducer} from 'reago';

function $counter() {
  const [count, dispatch] = atomReducer(
    (state, operation) => {
      if (operation === 'increment') return state + 1;
      if (operation === 'decrement') return state - 1;
      return state;
    },
    0
  );

  return count;
}
```

You can expose the dispatch function using `atomAction`, just like with `atomState`:

```ts
import {atomAction, atomReducer} from 'reago';

function $counter() {
  const [count, dispatch] = atomReducer(...);
  atomAction(dispatch, []); // [!code highlight]
  return count;
}
```

This pattern helps you centralize your update logic, avoid accidental stale closures, and structure your
state transitions more predictably.

`atomReducer` is particularly useful when:
* You have multiple operation types and want to consolidate state logic.
* You need to compute the next state based on the current one.
* You prefer to avoid writing multiple inline `setX()` calls in various actions.

As with all hooks in Reago, remember that `atomReducer` must be called unconditionally, in the top level of
your atom function.


## Wait, there's more!

Reago comes with additional hooks beyond the ones covered here. Some help with side effects, some with context
management, and others are just useful building blocks for more advanced patterns.

All hooks are fully documented in the [API reference](/api/) - with clear descriptions and practical, standalone
examples. The reference also covers the hooks you have seen in this article in greater depth.

You do not need to memorize them now. Just know they are there when you need them.
