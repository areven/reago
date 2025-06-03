# Adding state to an atom

The atoms we created so far are quite boring. Time to make them interactive.

Remember how we said atoms are declarative? They also support hooks, and you most likely
already know how to use them. Let us start by creating an atom that can hold state.

```ts
import {atomState} from 'reago';

function $selectedTheme() {
  const [theme, setTheme] = atomState('light'); // [!code highlight]
  return theme;
}
```

You are probably thinking _it looks familiar_ - and you are right.

In the example above, we use the `atomState` _hook_ to declare a new _state variable_.

We called it `theme`, gave it the initial value of `light`, and also got a _set_ function named `setTheme`
that we can later use to modify its value.


## What is a hook?

A _hook_ is a special kind of function used inside declarative code to access dynamic or contextual behavior -
such as reading state, triggering side effects, or subscribing to changes. Hooks are declarative, meaning they
describe what should happen, not when or how it happens.

Just like in React, hooks in declarative functions follow strict rules:
* Always call hooks at the top level - never inside loops, conditions, or nested functions.
* Call hooks in the same order on every run - this allows the system to track what each hook refers to.
* Do not call hooks outside of a declarative context - they only work when the system is actively tracking.

Why such rules? Because declarative functions are not executed imperatively. They are interpreted by the system,
which uses the sequence of hook calls to build a dependency graph or attach lifecycle logic.

If you violate the rules, the execution becomes ambiguous - the system cannot reliably determine what you are
trying to express.

In short: _a hook is a declarative statement - not a conditional instruction._

It tells the system, 'Here is what this function depends on', or 'Here is what should run after this', but leaves
the execution control to the runtime.

::: info How to recognize a hook?
Hooks in Reago follow a strict naming convention. Each hook uses the `atom` prefix, with the rest of the name
written in PascalCase. You already saw `atomState`. Later in this guide, you are going to learn about
`atomAction`, `atomReducer`, `atomMemo` and many others.
:::


## Creating an action

Intuitively, the `setTheme` function can be used to update our state variable.

We obviously cannot call it directly in the atom function, as it is declarative and is meant to
compute the final atom value, not manipulate it. We also do not know how to declare side effects yet.
Our goal for now, is to expose it to the outside world and let others change it.

Reago offers a mechanism called _actions_, which is a way to declare actions that the outside world
can run on the atom. And as you might have guessed - we are going to use another hook for that.

```ts
import {atomAction, atomState} from 'reago';

function $selectedTheme() {
  const [theme, setTheme] = atomState('light');

  atomAction((newValue) => { // [!code highlight]
    setTheme(newValue); // [!code highlight]
  }, []); // [!code highlight]

  return theme;
}
```

We declared an action that accepts one argument, and passes it down to `setTheme` when invoked.

::: info
It is possible to declare multiple `atomAction` actions inside an atom, however all of them must
accept the same set of arguments. It is mostly useful for plugging-in reusable snippets, like logging.
Usually such function would work with a variable number of action arguments.
:::

The second argument of `atomAction` - the _dependency array_ - tells the system when to reinitialize the
action logic. If the action captures values from the outer scope, and those values may change across computations,
you must list them here to ensure the action stays up to date.

In this example, `setTheme` is not included in the array because it is stable: it does not change
between computations, and will always behave the same. But if your action depends on a value that might
change over time - like a local variable or a derived value - you must include it.


## Triggering an action

We are almost there. We have an atom that holds state and exposes an action for mutating it. The
last missing piece of the puzzle is - how do we trigger it?

Reago offers a `dispatch` method that takes an atom, a set of values, and runs the actions inside.

```ts
import {atomAction, atomState, dispatch} from 'reago';

function $selectedTheme() {
  const [theme, setTheme] = atomState('light');
  atomAction(setTheme, []); // notice how we simplified it
  return theme;
}

// update the atom
dispatch($selectedTheme)('dark'); // [!code highlight]
```

::: info Pay attention to the nested function invocation
Note that the `dispatch` call returns a function - a _dispatcher_ - that you need to call with action arguments.
There is a good reason for this syntax, but we are going to cover it later in the _Advanced features_ section.
:::


## Putting it all together

We learned how to create atoms, how to make them depend on each other, how to hold state and how to update it.

We can now see how reactivity works in a real-life example.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $selectedTheme() {
  const [theme, setTheme] = atomState('light');
  atomAction(setTheme, []);
  return theme;
}

function $logoUrl() {
  const theme = read($selectedTheme);
  return theme == 'light' ?
    '/asset/logo-light.svg' :
    '/asset/logo-dark.svg';
}

console.log(read($logoUrl)); // prints /asset/logo-light.svg
dispatch($selectedTheme)('dark');
console.log(read($logoUrl)); // prints /asset/logo-dark.svg
```
