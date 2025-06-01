# atomReducer

`atomReducer` is a hook that lets you add a reducer to your atom.

::: code-group
```ts [Syntax]
const [state, dispatch] = atomReducer(reducer, initialArg, init?)
```

```ts [Types]
function atomReducer<Value, ActionArgs extends any[] = any[]>(
  reducer: AtomReducerReducer<Value, ActionArgs>,
  initialArg: Value,
  init?: (initialArg: Value) => Value
): AtomReducer<Value, ActionArgs>

type AtomReducer<Value, ActionArgs extends any[] = any[]> =
  [Value, AtomReducerDispatcher<ActionArgs>];

type AtomReducerReducer<Value, ActionArgs extends any[]> =
  (prevState: Value, ...args: ActionArgs) => Value

type AtomReducerDispatcher<ActionArgs extends any[]> =
  (...args: ActionArgs) => void
```
:::


## Reference

### `atomReducer(reducer, initialArg, init?)`

Call `atomReducer` at the top level of your atom to declare a state variable with a reducer.

```ts
import {atomReducer} from 'reago';

function $atom() {
  const [counter, tick] = atomReducer(x => x + 1, 0);
}
```

#### Parameters

* `reducer`: The reducer function that specifies how the state gets updated. It must be pure, should
  take the state and any number of extra arguments, and should return the next state. State and action
  can be of any types.
* `initialArg`: The value from which the initial state is calculated. It can be a value of any type.
  How the initial state is calculated from it depends on the next init argument.
* `init` (optional): The initializer function that should return the initial state. If it is not specified,
  the initial state is set to `initialArg`. Otherwise, the initial state is set to the result of calling
  `init(initialArg)`.

#### Returns

`atomReducer` returns an array with exactly two values.
1. The current state. During the first computation, it is set to `init(initialArg)` or `initialArg` (if
   there is no `init`).
2. The `dispatch` function that lets you update the state to a different value and trigger a recomputation.

The returned array is immutable and is preserved between computations, as long as the state variable
stays the same.

The `dispatch` function is stable and can be safely omitted from effect dependencies.

#### Caveats

* `atomReducer` is a hook, so you can only call it at the top level of your atom. You cannot call it inside loops
  or conditions.

### `dispatch` functions

The `dispatch` function returned by `atomReducer` lets you update the state to a different value and trigger a
recomputation. It takes the exact same number of _extra_ arguments as the `reducer` function you provided.

```ts
const [value, addProductOf] = atomReducer(
  (prevValue, firstExtraArg, secondExtraArg) => prevValue + firstExtraArg * secondExtraArg,
  0
);

addProductOf(1, 3); // value is now 3
addProductOf(2, 4); // value is now 3 + 2 * 4 = 11
```

#### Parameters

* `...extraArgs`: The optional arguments you defined in the provided `reducer` function. They can be of any type.

#### Returns

`dispatch` functions do not have a return value.

#### Caveats

* The `dispatch` functions do not trigger recomputations immediately. Instead, the atom is invalidated and
  will be lazily recomputed on next read.
* The `dispatch` functions only update the variable for the next computation. If you read the destructured
  state variable right after calling the `dispatch` function, you will still see the old value.
* If the new state you is identical to the previous state, as determined by an `Object.is` comparison,
  Reago will ignore it and avoid unnecessary recomputations. This is an optimization.
* The `dispatch` function is stable, so you will often see it omitted from effect dependencies. The function
  is guaranteed to stay the same across computations.


## Examples

### Counting how many times an atom was updated

Call `atomReducer` at the top-level of your atom to declare a state variable with a reducer that increases its
value with each dispatch. Run the dispatch function on each action.

```ts
import {atomAction, atomReducer, atomState} from 'reago';

function $valueWithUpdateCounter() {
  const [value, setValue] = atomState(0);
  const [updateCounter, increaseUpdateCounter] = atomReducer(x => x + 1, 0);

  atomAction((newValue) => {
    setValue(newValue);
    increaseUpdateCounter();
  }, []);

  return value;
}
```

### Using a custom `init` function

Pass a custom `init` function to the `atomReducer` to do extra processing on the `initialArg`.

```ts
import {atomReducer} from 'reago';

const doubleIt = x => x * 2;

function $atom() {
  const [value, dispatch] = atomReducer(x => x + 1, 21, doubleIt);
  // value starts at 42
}
```
