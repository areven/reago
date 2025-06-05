# Creating a generative atom

All the atoms we have seen so far are called _functional atoms_.

```ts
import {atomAction, atomState} from 'reago';

// this is a functional atom
function $theme() {
  const [value, setValue] = atomState('light');
  atomAction(setValue, []);
  return value;
}

// this is also a functional atom
function $packageName() {
  return Promise.resolve('reago');
}
```

In this article, we are going to explore a different type of atoms - called _generative atoms_.


## Getting started

A _generative atom_ is an atom that is a generator. Let us start with a simple example.

```ts
import {read} from 'reago';

function $functionalAtom() {
  return 21;
}

function* $generativeAtom() {
  return read($functionalAtom) * 2;
}

console.log(read($functionalAtom)); // 21
console.log(read($generativeAtom)); // Promise.resolve(42)
```

We can immediately spot two key differences:
* The generative atom is declared using `function*`, as opposed to `function` we have been using for
  functional atoms.
* The generative atom returned a `Promise`, although we did not create it explicitly.

A generative atom is Reago's equivalent of `async function`, but with fully functional context tracking
and various optimizations for any `Promise`-like objects referenced inside.


## Generators? But why?

In [the previous article](./dealing-with-promises) we discussed how one can handle `Promise`-like objects
using hooks and explained why an atom cannot be an `async function`. Let us reiterate.

JavaScript does not offer a way to track the execution context across asynchronous computations. The moment
your atom escapes the synchronous flow, Reago can no longer associate `read()` and `atom*` calls with your
atom, build the dependency graph and manage the state of hooks used inside.

But, actually, there is a way.

What if I told you that generators are essentially a superset of the `async` / `await` syntax you
are familiar with?

An `async function` looks almost like a synchronous function, with two exceptions:
* It offers the `await` escape hatch, which can pause execution and wait for a `Promise` to settle.
* It wraps the returned value in a `Promise`.

If you think about it, a synchronous generator can tick off the same boxes:
* It offers the `yield` escape hatch, which can pause execution, pass back some value to the caller
  and wait for it to optionally resume execution some time later.
* It can return a final value to the caller at the end of its execution.

Do you see where we are going with this?

Reago can run a generator function, fully control its execution, track the synchronous bits of logic
between `yield` calls and fully reimplement the `async` / `await` syntax, with `yield` acting like `await`.

And it does.


## A simple recipe

Creating an atom with asynchronous logic is extremely easy.

Implement it exactly like you would with `async` / `await`, and then:

* Replace `async function` with `function*`.
* Replace `await` with `yield`.

And that is all. Reago will do its magic and it will work exactly as you expect.


## Trying it out

In the previous article we were trying to use the GitHub API to fetch the number of stars of
a repository. Time to do the same, but properly.

Let us start with `async` / `await`.

```ts
// this code will not work
import {atomAction, atomState, dispatch, read} from 'reago';

function $repositoryName() {
  const [name, setName] = atomState('');
  atomAction(newName => setName(`areven/${newName}`), []);
  return name;
}

async function $repositoryData() { // [!code --]
  const name = read($repositoryName);
  const query = await fetch(`https://api.github.com/repos/${name}`); // [!code --]
  return await query.json(); // [!code --]
}

async function $repositoryStarsCount() { // [!code --]
  const data = await read($repositoryData); // [!code --]
  return data.stargazers_count;
}

dispatch($repositoryName)('reago');
console.log(`Nice, ${await read($repositoryStarsCount)} stars!`);
```

Now all we have to do is convert async functions to generative atoms.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $repositoryName() {
  const [name, setName] = atomState('');
  atomAction(newName => setName(`areven/${newName}`), []);
  return name;
}

function* $repositoryData() { // [!code ++]
  const name = read($repositoryName);
  const query = yield fetch(`https://api.github.com/repos/${name}`); // [!code ++]
  return yield query.json(); // [!code ++]
}

function* $repositoryStarsCount() { // [!code ++]
  const data = yield read($repositoryData); // [!code ++]
  return data.stargazers_count;
}

dispatch($repositoryName)('reago');
console.log(`Nice, ${await read($repositoryStarsCount)} stars!`);
```

_Et voilà._


## Using hooks

Hooks in functional atoms come with a few restrictions:
* You can only call them at the top level of your atoms.
* You cannot change their order between computations.
* You cannot call them conditionally or inside loops.

The same restrictions apply to generative atoms, with one extra, possibly surprising caveat:
* It is perfectly fine to keep using hooks after `yield`. It is not an issue that you paused a
  computation to wait for an asynchronous value - Reago can still track them.

This is a perfectly valid code:

```ts
import {atomAction, atomState, read} from 'reago';

function $defaultTheme() {
  // default theme returned asynchronously
  return Promise.resolve('light');
}

function* $selectedTheme() {
  const defaultTheme = yield read($defaultTheme);
  const [theme, setTheme] = atomState(defaultTheme);
  atomAction(setTheme, []);
  return theme;
}

// prints 'light'
console.log(await read($selectedTheme));

// no await needed - action is guaranteed to run before next `read`
dispatch($selectedTheme)('dark');

// prints 'dark'
console.log(await read($selectedTheme));
```


## Handling errors

Promise rejections propagate through atoms just like in an `async function`.

Sometimes you might want to handle them explicitly inside an atom, in which case,
simply wrap a part of your code with `try` ... `catch`.

Here is an updated version of `$repositoryStarsCount` that returns `null` in case of an error.

```ts
import {read} from 'reago';

function* $repositoryStarsCount() {
  try {
    const data = yield read($repositoryData);
    return data.stargazers_count;
  } catch {
    return null;
  }
}
```

Note that `try` ... `finally` is fully supported too.


## Diving deeper

Reago not only implements the `async` / `await` syntax - it makes it more efficient.

When you pass a `Promise` to `yield`, Reago waits for it to settle and passes back the outcome.
But that is not all. Reago automatically tracks all `Promise`-like objects it encounters.

The standard `Promise` API lacks an essential feature - it is not possible to synchronously check whether
a `Promise` settled and get the outcome. If you hold a reference to a `Promise`, even if you know it already
resolved, you still have to call `.then()` and asynchronously wait for the callback to fire.

It is highly inefficient.

Reago uses weak refs to track known results, so if it ever encounters a `Promise` it has seen before,
`yield` will pass back the outcome _synchronously_.

::: tip An asynchronous generative atom might compute synchronously
You read that right - an asynchronous atom might compute synchronously if all the `Promise`-like
objects referenced inside already settled.

Reago can sometimes synchronously determine whether the value of an asynchronous atom changed.
This behavior is fully transparent, but saves you from a lot of unnecessary recomputations
and short-lived loading states in your UI.
:::

You can manually query the Reago's internal `Promise` tracking system too. The public API offers
a tiny `deasync()` utility which does just that - and we are going to learn all about it in the next article.
