# Dealing with Promises

Reago has first-class support for asynchronous operations. It uses a novel approach based on
generative atoms, that makes handling asynchronous state extremely easy.

Before diving in, we are going to start with the basics and build from there. This article
shows the verbose and rather inefficient way of handling `Promise`-like objects using hooks. While
very low level, it does a good job of explaining how Reago works under the hood.


## Returning a Promise from an atom

An atom can return arbitrary data type, with no limitations. Reago never alters the returned value - and
it applies to `Promise`-like objects too. If your atom returns a `Promise`, it is returned as is.

```ts
import {atomAction, atomState, dispatch, read} from 'reago';

function $repositoryName() {
  const [name, setName] = atomState('');
  atomAction(newName => setName(`areven/${newName}`), []);
  return name;
}

function $repositoryData() {
  const name = read($repositoryName);
  return fetch(`https://api.github.com/repos/${name}`);
}

dispatch($repositoryName)('reago');
```

We declared the `$repositoryData` atom, which calls `fetch()` and returns the query `Promise`. The atom
is reactive - changing the repository name will rerun the query. Subscribers of the `$repositoryData`
atom will be notified that the value changed - and by value we mean the `Promise` reference itself, not the
value it resolves to.

::: info How Reago handles returned Promises?
Reago uses `Object.is()` to determine whether the value of an atom changed. If your atom returns a `Promise`,
it will compare one `Promise` object reference with another `Promise` object reference. It does not wait
for them to settle to compare the values they resolve to.

The atom we declared above returns the `Promise` synchronously and is effectively treated synchronously as well.

Subscribers will be immediately notified the `Promise` reference changed - not after it settles.
:::


## Reading an asynchronous atom

We can read the `$repositoryData` atom like any other atom using `read`. Reago will return the query `Promise`
as is without any extra processing.

```ts
import {read} from 'reago';

const response = await read($repositoryData);
```

It works perfectly fine with framework integrations too. For instance, you could use the `useAsyncAtom`
React hook, to _read_ the value using React Suspense.

So far so good.


## Composing asynchronous atoms

The public GitHub API we are using above returns a JSON structure with a lot of repository details.
Let us try to build a derived `$repositoryStarsCount` atom that takes `$repositoryData` and extracts
the `.stargazers_count` property.

```ts
import {read} from 'reago';

function $repositoryStarsCount() {
  return read($repositoryData)
    .then(response => response.json())
    .then(json => json.stargazers_count);
}
```

This is starting to look messy and a bit... _dated_.

Here is the problem - JavaScript does not offer a way to track the execution context across
asynchronous computations. Reago can only detect the store context and correctly track hooks
if the atom function is synchronous.

Imagine if you could write the above using the modern `async` / `await` syntax:

```ts
// this code is invalid!
import {read} from 'reago';

async function $repositoryStarsCount() {
  const query = await read($repositoryData);
  const json = await query.json();
  return json.stargazers_count;
}
```

But you cannot.

The `.then()` chain we implemented above is quite manageable, but what if you would be
composing multiple asynchronous sources, and even worse - using some of them conditionally?


## Turning an asynchronous atom synchronous

Let us lean into the ugliness and dig deeper. What if the UI component where `$repositoryStarsCount` is
used cannot handle a `Promise`?

We can create an atom that reads `$repositoryData`, but instead of creating a derived `Promise`, it should
return either `null` or the resolved value.

```ts
import {atomComputationEffect, atomState, read} from 'reago';

function $repositoryStarsCountSync() {
  const query = read($repositoryData);
  const [count, setCount] = atomState(null);

  atomComputationEffect(() => {
    let relevant = true;

    setCount(null);
    query.then(response => response.json()).then(json => {
      if (relevant) {
        setCount(json.stargazers_count);
      }
    });

    return () => {
      relevant = false;
    }
  }, [query]);

  return count;
}
```

It works, but we can do so much better than this.

The answer is - _generative atoms_.
