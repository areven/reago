# store.invalidate

`store.invalidate` lets you force an atom to lazily recompute in the given store.

```ts
store.invalidate($atom, ...familyArgs)
```


## Reference

### `store.invalidate(atom, ...familyArgs)`

Call `store.invalidate` anywhere in your code to discard the stored atom value
in the given store. The atom will have to be recomputed.

```ts
import {getDefaultStore} from 'reago';

function $atom() {
  // ...
}

function $atomFamily(someArgument: string) {
  // ...
}

const someStore = getDefaultStore();
someStore.invalidate($atom);
someStore.invalidate($atomFamily, 'someValue');
```

#### Parameters

* `atom`: A reference to an atom you want to invalidate.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Behavior

`store.invalidate` invalidates the computed value of the atom that we already have saved in the store.
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


## Examples

### Understanding lazy recomputation

Follow the example below to understand how lazy recomputation works when an atom is not mounted.

```ts
import {getDefaultStore} from 'reago';

const store = getDefaultStore();
let nextValue = 1;

function $increasingAtom() {
  return nextValue++;
}

// reading the atom for the first time
assert(store.read($increasingAtom) === 1);

// reading the atom for the second time, the value is already computed
assert(store.read($increasingAtom) === 1);

// now we invalidate the computed value
store.invalidate($increasingAtom);
assert(nextValue === 1); // it's still 1! it didn't recompute yet

// reading the atom triggers computation
assert(store.read($increasingAtom) === 2);
```

### Understanding hooks state preservation

`store.invalidate()` does not affect the state of hooks inside an atom. See the following example.

```ts
import {atomAction, atomState, getDefaultStore} from 'reago';

const store = getDefaultStore();

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

// reading the atom for the first time
assert(store.read($Atom) === 0);

// we change the value to 42
store.dispatch($atom)(42);

// reading the atom for the second time, we see the new value
assert(store.read($atom) === 42);

// now we invalidate the computed value
store.invalidate($atom);

// when we compute the atom again, the value is still 42
assert(store.read($atom) === 42);
```
