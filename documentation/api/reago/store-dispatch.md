# store.dispatch

`store.dispatch` lets you trigger actions defined in an atom in the given store.

```ts
store.dispatch($atom, ...familyArgs)(...actionArgs)
```


## Reference

### `store.dispatch(atom, ...familyArgs)(...actionArgs)`

Call `store.dispatch` anywhere in your code to run `atomAction` actions defined in the given atom.

```ts
import {atomAction, getDefaultStore} from 'reago';

function $atom() {
  atomAction((arg1: number, arg2: string) => {
    // ...
  }, []);
}

function $atomFamily(someArgument: string) {
  atomAction(() => {
    // ...
  }, []);
}

const someStore = getDefaultStore();
someStore.dispatch($atom)(42, 'second action arg');
someStore.dispatch($atomFamily, 'someValue')();
```

Refer to the `atomAction` documentation for a more extensive explanation how actions work and what are
their limitations.

#### Parameters

* `atom`: A reference to an atom you want to run actions in.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.
* `...actionArgs`: Arguments passed to the defined `atomAction` handlers.

#### Behavior

`store.dispatch` triggers registered `atomAction` handlers within an atom, for the given store.

If the atom has not been computed yet or is outdated, Reago will first run a computation to sync the list
of defined actions and then run them afterwards. The actions will run in the order of appearance.

Reago does not run actions defined in other atoms the given atom depends on.

#### Returns

Note that the `store.dispatch` call returns a function - a dispatcher - that you need to call with
action arguments. It is designed this way because the number of both `familyArgs` and `actionArgs` is flexible.

Each `store.dispatch` call creates a new dispatcher function. They are however safe to store and reuse, although
it is not really recommended as it hurts readability.

The dispatcher itself has no return value.


## Examples

### Updating the value of an atom

Use the `atomState` hook to hold a value, register an action that updates it and use `store.dispatch()` to run it.

```ts
import {atomAction, atomState, getDefaultStore} from 'reago';

const store = getDefaultStore();

function $atom() {
  const [value, setValue] = atomState(0);
  atomAction(setValue, []);
  return value;
}

// reading the atom for the first time
assert(store.read($atom) === 0);

// using dispatch to update the inner value
store.dispatch($atom)(42);

// reading the atom again returns the new value
assert(store.read($atom) === 42);
```

::: info
For more examples and an extensive documentation of atom actions, please refer to the `atomAction` API reference.
:::
