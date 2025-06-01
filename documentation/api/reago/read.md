# read

`read` reads a value from the active store, which is determined by the current execution context.


::: code-group
```ts [Syntax]
const value = read($atom, ...familyArgs)
```

```ts [Types]
function read<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomResultOf<T>
```
:::


## Reference

### `read(atom, ...familyArgs)`

Call `read` anywhere in your code. The method is context-aware and its behavior varies.

#### Normal usage

```ts
import {read} from 'reago';

function $atom() {
  // ...
}

const value = read($atom);
```

A `read` call outside of a computation context defaults to reading from the built-in default store. It is a
shorthand for `getDefaultStore().read()`.

#### Usage within an atom

```ts
import {read} from 'reago';

function $atom() {
  return 42;
}

function $doubledAtom() {
  return read($atom) * 2;
}
```

A `read` call within an atom reads the value from the store the atom computation is running in. It also
updates the dependency graph and is the core of Reago's reactivity.

#### Usage within a hook callback

```ts
import {atomMountEffect, read} from 'reago';

function $atom() {
  return 42;
}

function $atomWithCallbacks() {
  atomMountEffect(() => {
    const value = read($atom);
  });
}
```

A `read` within a hook callback in an atom is also context-aware, and similarly, reads from the store
the atom computation was running in. These reads do not affect the dependency graph, as the callbacks are not
reactive.

#### Parameters

* `atom`: A reference to an atom you want to read.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Returns

`read` returns the value of the given atom within the active store, determined by the execution context.

The method will automatically compute the atom and its dependencies if they are not computed already.

The computed value is returned as is, which specifically means:
* If a functional atom returns a `Promise`-like value, the `Promise` is returned as is.
* If the atom is a generative atom, the returned value is always a `Promise`.

The returned value is stable and preserved between reads. The reference will change if and only if the
value changes, based on an `Object.is()` comparison.

#### Side effects
* `read` called within an atom updates the dependency graph.
* `read` called within an atom will mount the target atom, if the source atom is mounted too.

#### Caveats
* Reago can track execution context across synchronous calls and generative atoms only. If you define an
  asynchronous callback within an atom or a hook callback and try calling `read` inside, we will not be able to
  determine the active store.


## Examples

### Reading from the default store

Call `read` anywhere outside of the computation context to read from the default store.


```ts
import {read} from 'reago';

function $primitiveAtom() {
  return 42;
}

console.log(`Value is ${read($primitiveAtom)}`);
```

### Reading a generative atom from the default store

Pass a generative atom to the `read` method to obtain the `Promise`.

```ts
import {read} from 'reago';

function* $generativeAtom {
  yield new Promise(resolve => setTimeout(resolve, 1000));
  return 42;
}

read($generativeAtom).then(value => {
  console.log(`The answer to universe is ${value}`);
});
```

### Context-aware read from the active store

Call `read` within an atom to automatically read from the currently active store.

```ts
import {atomAction, atomState, createStore, read} from 'reago';

const store1 = createStore();
const store2 = createStore();

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

function $doubledAtom() {
  return read($atom1) * 2;
}

// update the first store
store1.dispatch($atom)(21);
assert(store1.read($doubledAtom) == 42)

// reading from the second store will read $atom from the same store
assert(store2.read($doubledAtom) == 0)
```
