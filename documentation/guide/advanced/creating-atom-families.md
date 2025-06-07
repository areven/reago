# Creating an atom family

Every atom we have created so far accepted no arguments. But what if we added some?

The active session data, the selected theme, the user settings - they all fit well into atoms.
But how could we model a blog with multiple posts?

Ideally we would have a `$post` atom that could be instantiated multiple times, for each blog post
we need to access. Something like `$post(postId)`.


## Introducing atom families

An atom family is a function that accepts at least one argument.

Each unique set of arguments represents an individual atom.

Reago identifies each atom instance by serializing the provided arguments. For this reason, the argument
types are restricted to the following primitives.

```ts
type AtomFamilyArg = string | number | boolean | null | undefined;
```

In the following code:

```ts
function $post(postId: number) {
  return fetch(`/api/blog-post/${postId}`);
}
```

The `$post` function is an _atom family_, while `$post(4)`, `$post(32)` and `$post(123)` are examples
of individual atoms.

Atoms in an atom family are completely independent of each other. They do not share state, actions nor
dependencies.


## Reading from an atom in a family

The `read` function you are already familiar with optionally accepts extra arguments, representing an
atom in the atom family.

Here is an example how you could read `$post(42)`.

```ts
import {read} from 'reago';

function $post(postId) {
  return fetch(`/api/blog-post/${postId}`);
}

const postPromise = read($post, 42); // [!code highlight]
```


## Writing to an atom in a family

Similarly, the `dispatch` function takes variable number of extra arguments too.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $atomFamily(atomId, initialValue) {
  const [value, setValue] = atomState(initialValue);
  atomAction(setValue, []);
  return value;
}

dispatch($atomFamily, 'first-id', 0)(111); // [!code highlight]
dispatch($atomFamily, 'second-id', 0)(222); // [!code highlight]

assert(read($atomFamily, 'first-id', 0) === 111);
assert(read($atomFamily, 'second-id', 0) === 222);
assert(read($atomFamily, 'third-id', 333) === 333);
```

::: tip Solving the old mystery
You were probably wondering why `dispatch(...)(...)` requires two function calls.

It is because the number of family arguments and the number of action arguments are both variable - they
had to be separated.
:::


## Watching an atom in a family

It should be no surprise that `watch` accepts extra arguments too.

```ts
import {watch} from 'reago';

function $atom(familyArg) {
  // ...
}

watch($atom, 'family-arg', () => { // [!code highlight]
  // ... // [!code highlight]
}); // [!code highlight]
```


## Invalidating an atom in a family

To invalidate a single atom in a family, call `invalidate` with the extra family arguments.

```ts
import {invalidate} from 'reago';

function $post(postId) {
  // ...
}

invalidate($post, 42); // [!code highlight]
```


## Usage with frameworks

All of our official integrations support atom families too. Simply pass the family arguments
as extra arguments after the atom reference itself.

For details, please refer to the [API reference](/api/) of the package you are using.
