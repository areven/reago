# atomState

`atomState` is a hook that lets you add a state variable to your atom.

::: code-group
```ts [Syntax]
const [state, setState] = atomState(initialState)
```

```ts [Types]
function atomState<Value>(
  initialState: Value | (() => Value)
): AtomState<Value>

type AtomState<Value> =
  [Value, AtomStateSetter<Value>];

type AtomStateSetter<Value> =
  (nextState: AtomStateSetterNextState<Value>) => void;

type AtomStateSetterNextState<Value> =
  Value | ((prevState: Value) => Value);
```
:::


## Reference

### `atomState(initialState)`

Call `atomState` at the top level of your atom to declare a state variable.

```ts
import {atomState} from 'reago';

function $atom() {
  const [age, setAge] = atomState(29);
  const [name, setName] = atomState('Anya');
  const [todos, setTodos] = atomState(() => createTodos());
}
```

The convention is to name state variables like `[something, setSomething]` using array destructuring.

#### Parameters

* `initialState`: The value you want the state to be initially. It can be a value of any type, but there is
  a special behavior for functions. This argument is ignored after the initial computation.

  If you pass a function as `initialState`, it will be treated as an initializer function. It should be pure,
  should take no arguments, and should return a value of any type. It will only run once, during the initial
  computation.

#### Returns

`atomState` returns an array with exactly two values.
1. The current state. During the first computation, it will match the `initialState` you have passed.
2. The `set` function that lets you update the state to a different value and trigger a recomputation.

The returned array is immutable and is preserved between computations, as long as the state variable
stays the same.

The `set` function is stable and can be safely omitted from effect dependencies.

#### Caveats

* `atomState` is a hook, so you can only call it at the top level of your atom. You cannot call it inside loops
  or conditions.

### `set` functions, `like setSomething(nextState)`

The `set` function returned by `atomState` lets you update the state to a different value and trigger a
lazy recomputation. You can pass the next state directly, or a function that calculates it from the previous state.

```ts
const [dish, setDish] = atomState('Pancake');
const [guests, setGuests] = atomState(2);

function updateState() {
  setDish('Caviar');
  setGuests(count => count + 1);
}
```

#### Parameters

* `nextState`: The value that you want the state to be. It can be a value of any type, but there is a special
   behavior for functions.

  If you pass a function as `nextState`, it will be treated as an updater function. It must be pure, should take
  the current state as its only argument, and should return the next state.

#### Returns

`set` functions do not have a return value.

#### Caveats

* The `set` functions do not trigger recomputations immediately. Instead, the atom is invalidated and will
  be lazily recomputed on next read.
* The `set` functions only update the variable for the next computation. If you read the destructured state
  variable right after calling the `set` function, you will still see the old value.
* If the new value you provide is identical to the current state, as determined by an `Object.is` comparison,
  Reago will ignore it and avoid unnecessary recomputations. This is an optimization.
* If you are using an updater function, never try to modify the old value received through the args.
* The `set` function is stable, so you will often see it omitted from effect dependencies. The function is
  guaranteed to stay the same across computations.


## Examples

### Adding state to an atom

Call `atomState` at the top-level of your atom to declare a state variable. Use actions or effects to mutate it.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $selectedDish() {
  const [dish, setDish] = atomState('pancake');
  atomAction(dish, []); // `setDish` is stable and does not have to be listed as a dependency
  return dish;
}

assert(read($selectedDish) === 'pancake');
dispatch($selectedDish)('caviar');
assert(read($selectedDish) === 'caviar');
```

### Updating state based on the previous state

Call `atomState` at the top-level of your atom to declare a state variable. Use actions or effects to mutate it,
but instead of passing a new value, pass a function that will mutate the old state.

```ts
import {atomComputationEffect, atomState} from 'reago';

function $increasingCounter() {
  const [value, setValue] = atomState(0);

  atomComputationEffect(() => {
    const interval = setInterval(() => {
      setValue(x => x + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return value;
}
```

Remember to never mutate the old value in the `set` function updater.

```ts
// do not do this, ever
setObject(oldObject => {
  oldObject.prop = 'new value';
  return oldObject;
});

// create a new object instead
setObject(oldObject => ({
  ...oldObject,
  prop: 'new value'
}));
```
