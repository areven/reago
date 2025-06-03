# Creating an atom

An _atom_ is an independent piece of state. It could be a user name, a selected theme, a list of loaded
posts or even some asynchronously fetched data.

An atom can read from other atoms, effectively building a directed dependency graph behind the scenes.
You could create an atom that reads the list of loaded posts, and returns only those related to a certain
topic. You could store the selected topic in yet another atom, making it reactive too. And they will all
stay in sync, efficiently propagating any value changes through the graph.

In Reago, an atom is simply a function.

```ts
function $userName() {
  return 'snowak';
}

function $selectedTheme() {
  return 'light';
}

function $posts() {
  return [
    {title: 'What is Reago?', text: '...'},
    {title: 'Motivation', text: '...'},
    {title: 'Getting started', text: '...'}
  ];
}
```

::: info
By convention, all atom names are prefixed with a dollar sign (`$`). It makes it easier to distinguish
them from regular functions and React functional components. This is not a strict requirement though -
you are free to adopt any other pattern, but we highly recommend staying consistent.
:::


## Reading an atom

You can use the `read` function to read the value of an atom.

```ts
import {read} from 'reago';

function $selectedCountry() {
  return 'Japan';
}

console.log(`You selected ${read($selectedCountry)} 😍`); // [!code highlight]

```

There is a lot going on behind the scenes.

Reago will determine it sees this atom for the first time. It will _compute_ its value and put it
in the internal store. It knows the atom has no dependencies, so its value is fixed and there is no
need to recompute it ever again - unless it is manually requested.

Reading this atom again will read directly from the internal store, skipping the atom function entirely.

```ts
import {read} from 'reago';

function $atom() {
  console.log('I am being computed!');
  return 'some value';
}

// the following will print 'I am being computed!' only *once*
read($atom);
read($atom);
read($atom);
```

You are not supposed to call atom functions manually, ever. They are always to be run through Reago.


## Creating dependencies

An atom can read from other atoms and use them to derive complex states.

```ts
import {read} from 'reago';

function $number() {
  return 42;
}

function $doubledNumber() {
  return read($number) * 2; // [!code highlight]
}

console.log(`Derived value is ${read($doubledNumber)}`);
```

Reago tracks `read` calls that occur within an atom and automatically builds the dependency graph.

In the example above, it will recognize that `$number` is a dependency of `$doubledNumber` and later use it
to determine which parts of the graph must be recomputed when some value change.


## Rules of atoms

Atoms are __declarative__. An atom function _declares_ how its value is computed. If you are familiar
with React functional components, this is exactly the same concept.

<div class="tip custom-block" style="padding-top: 8px">

An atom does not calculate the value - it describes how the value should be calculated.

</div>

When you define an atom, you are not executing logic immediately. Instead, you describe a recipe for computing
a value. Reago takes that description and evaluates it only when needed, keeping track of dependencies automatically.

For example:

```ts
import {read} from 'reago';

const $count = () => 21;
const $double = () => read($count) * 2;
```

The `$double` atom declares that its value is 'whatever the current value of `$count` is, times 2'.
It does not actively listen or recompute on its own - Reago handles that behind the scenes. When `$count` changes,
`$double` updates reactively and efficiently.

This approach has a few key benefits:
* Predictable: Your atoms do not hold hidden state - all logic is scoped and explicit.
* Composable: Atoms can depend on other atoms in a readable, well-defined way.
* Lazy: Atoms are only evaluated when used, and only re-evaluated when their value might have changed.

This is what we mean by declarative: instead of describing how to do something step-by-step, you describe what
you want, and Reago figures out when and how to execute it.
