# invalidate

`invalidate` lets you force an atom to lazily recompute in the active store, which is determined by
the current execution context.

```ts
invalidate($atom, ...familyArgs)
```


## Reference

### `invalidate(atom, ...familyArgs)`

Call `invalidate` anywhere in your code to discard the stored atom value. The atom will have to be recomputed.
The method is context-aware and its behavior varies.

#### Normal usage

```ts
import {invalidate} from 'reago';

function $atom() {
  // ...
}

invalidate($atom);
```

An `invalidate` call outside of a computation context uses the built-in default store. It is a
shorthand for `getDefaultStore().invalidate()`.

#### Usage within an atom

Using `invalidate` within an atom is forbidden. Use atom effect hooks to trigger side effects.

#### Usage within a hook callback

```ts
import {atomMountEffect, invalidate} from 'reago';

function $atom() {
  // ...
}

function $atomWithCallbacks() {
  atomMountEffect(() => {
    invalidate($atom);
  });
}
```

An `invalidate` call within a hook callback in an atom is also context-aware, and similarly, uses the
store the atom computation was running in.

#### Parameters

* `atom`: A reference to an atom you want to invalidate.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Behavior

`invalidate` invalidates the computed value of the atom that we already have saved in the store.
The atom will have to be recomputed _the next time it is read_.

The state of hooks inside the atom is not affected. For example, the value of `atomState` is preserved. Only the
computed value of the atom itself is discarded.

Invalidation __does not trigger recomputation__ on its own. If you invalidate an atom, it will be recomputed
only when it is read again. For example:
* You might manually call `read()` some time later.
* The atom might be mounted (a `watch()` call subscribed to it), in which case it will recompute immediately,
  because it is actively used.
* Another atom that depends on the value of this atom might cause a recomputation.

However, if the atom is not subscribed to, and you do not trigger a read manually, the computation will not run
immediately. It is done lazily, only when the value is actually requested.

#### Caveats
* Reago can track execution context across synchronous calls and generative atoms only. If you define an
  asynchronous callback within a hook callback and try calling `invalidate` inside, we will not be able to
  determine the active store.


## Examples

### Understanding lazy recomputation

Follow the example below to understand how lazy recomputation works when an atom is not mounted.

```ts
import {invalidate, read} from 'reago';

let nextValue = 1;
function $increasingAtom() {
  return nextValue++;
}

// reading the atom for the first time
assert(read($increasingAtom) === 1);

// reading the atom for the second time, the value is already computed
assert(read($increasingAtom) === 1);

// now we invalidate the computed value
invalidate($increasingAtom);
assert(nextValue === 1); // it's still 1! it didn't recompute yet

// reading the atom triggers computation
assert(read($increasingAtom) === 2);
```

### Understanding hooks state preservation

`invalidate` does not affect the state of hooks inside an atom. See the following example.

```ts
import {atomAction, atomState, dispatch, invalidate, read} from 'reago';

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

// reading the atom for the first time
assert(read($Atom) === 0);

// we change the value to 42
dispatch($atom)(42);

// reading the atom for the second time, we see the new value
assert(read($atom) === 42);

// now we invalidate the computed value
invalidate($atom);

// when we compute the atom again, the value is still 42
assert(read($atom) === 42);
```
