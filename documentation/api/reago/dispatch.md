# dispatch

`dispatch` lets you trigger actions defined in an atom in the active store, which is determined by the current
execution context.

```ts
dispatch($atom, ...familyArgs)(...actionArgs)
```


## Reference

### `dispatch(atom, ...familyArgs)(...actionArgs)`

Call `dispatch` anywhere in your code to run `atomAction` actions defined in the given atom.
The method is context-aware and its behavior varies.

Refer to the `atomAction` documentation for a more extensive explanation how actions work and what are
their limitations.

#### Normal usage

```ts
import {dispatch} from 'reago';

function $atom() {
  // ...
}

dispatch($atom)('action-arg');
```

A `dispatch` call outside of a computation context uses the built-in default store. It is a
shorthand for `getDefaultStore().dispatch()`.

#### Usage within an atom

Using `dispatch` within an atom is forbidden. Use atom effect hooks to trigger side effects.

#### Usage within a hook callback

```ts
import {atomMountEffect, dispatch} from 'reago';

function $atom() {
  // ...
}

function $atomWithCallbacks() {
  atomMountEffect(() => {
    dispatch($atom)();
  });
}
```

A `dispatch` within a hook callback in an atom is also context-aware, and similarly, uses the store
the atom computation was running in.

#### Parameters

* `atom`: A reference to an atom you want to run actions in.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.
* `...actionArgs`: Arguments passed to the defined `atomAction` handlers.

#### Behavior

`dispatch` triggers registered `atomAction` handlers within an atom, for the given store.

If the atom has not been computed yet or is outdated, Reago will first run a computation to sync the list
of defined actions and then run them afterwards. The actions will run in the order of appearance.

Reago does not run actions defined in other atoms the given atom depends on.

#### Returns

Note that the `dispatch` call returns a function - a dispatcher - that you need to call with action arguments.
It is designed this way because the number of both `familyArgs` and `actionArgs` is flexible.

Each `dispatch` call creates a new dispatcher function. They are however safe to store and reuse, although
it is not really recommended as it hurts readability.

The dispatcher itself has no return value.

#### Caveats
* Reago can track execution context across synchronous calls and generative atoms only. If you define an
  asynchronous callback within a hook callback and try calling `dispatch` inside, we will not be able to
  determine the active store.


## Examples

### Updating an atom in the default store

Use the `atomState` hook to hold a value, register an action that updates it and use `dispatch()` anywhere
outside of the computation context to run it.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

// reading the atom for the first time
assert(read($atom) === 0);

// using dispatch to update the inner value
dispatch($atom)(42);

// reading the atom again returns the new value
assert(read($atom) === 42);
```

:::info
For more examples and an extensive documentation of atom actions, please refer to the `atomAction` API reference.
:::
