# atomAction

`atomAction` is a hook that lets you define actions within an atom that can be triggered externally.

::: code-group
```ts [Syntax]
atomState(handler, dependencies)
```

```ts [Types]
function atomAction(
  handler: AtomAction,
  dependencies: unknown[]
): void

type AtomAction = (...args: AtomActionArg[]) => void
```
:::


## Reference

### `atomAction(handler, dependencies)`

Call `atomAction` at the top level of your atom to declare an action.

```ts
import {atomAction} from 'reago';

function $atom() {
  atomAction(() => {
    // ...
  }, []);
}
```

You can define multiple actions within an atom, but each action must accept the same set of arguments.

#### Parameters

* `handler`: The function to run when `dispatch()` is called on an atom. It might accept any number of
  arguments of any type, which you can later provide via `dispatch`. It should have no return value. Reago
  will memoize this function during the initial computation, and update it only when `dependencies` change.
* `dependencies`: The list of all reactive values referenced inside of the `handler` code.
  The list of dependencies must have a constant number of items and be written inline like `[dep1, dep2, dep3]`.
  Reago will compare each dependency with its previous value using the `Object.is` comparison.

#### Caveats

* `atomAction` is a hook, so you can only call it at the top level of your atom. You cannot call it inside loops
  or conditions.
* Actions run outside of computations - they run when they are triggered via `dispatch`. Hooks inside
  actions are not supported.
* Actions understand the execution context. Calls like `read` or `watch` inside an action code will use
  the same store the action was defined in.
* Multiple actions within an atom are allowed, but each action must accept the same set of arguments.
* Multiple actions in an atom run in the order they were defined.


## Examples

### Adding state to an atom

Call `atomState` at the top-level of your atom to declare a state variable. Use actions to mutate it.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $selectedDish() {
  const [dish, setDish] = atomState('pancake');
  atomAction(dish, []);
  return dish;
}

assert(read($selectedDish) === 'pancake');
dispatch($selectedDish)('caviar');
assert(read($selectedDish) === 'caviar');
```

### Defining multiple actions within an atom

Call `atomAction` multiple times. Ensure each action handler accepts the same set of arguments.

```ts
import {atomAction, atomState, dispatch} from 'reago';

function $valueWithLogging() {
  const [value, setValue] = atomState(42);

  atomAction((newValue) => {
    console.log(`Changing value to ${newValue}`);
  }, []);

  atomAction(setValue, []);

  return value;
}

dispatch($valueWithLogging)(13);
```
