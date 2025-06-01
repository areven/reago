# getDefaultStore

`getDefaultStore` lets you retrieve the built-in Reago's default store.

::: code-group
```ts [Syntax]
const store = getDefaultStore()
```

```ts [Types]
function getDefaultStore(): Store
```
:::


## Reference

### `getDefaultStore()`

Call `getDefaultStore` anywhere in your code to retrieve the built-in default store.

```ts
import {getDefaultStore} from 'reago';

const store = getDefaultStore();
```

#### Returns

`getDefaultStore` returns the built-in default store.

The atoms you define are just functions. When they are computed, their values are stored in a store.
Stores are independent of each other and each might have a different state. A single atom might have
different values in different stores.

Reago provides a built-in store that is used by all methods by default, if you do not provide
a custom store manually. We recommend keeping it simple and relying on the default store unless you require
multiple separate states.

The returned value is stable and never changes, it is safe to be stored and reused.


## Examples

### Reading from the default store

Call `getDefaultStore()` and then use `.read()` to read from the default store explicitly.

```ts
import {getDefaultStore, read} from 'reago';

function $meaninglessNumber() {
  return 21;
}

function $theAnswerToLifeTheUniverseTheEverything() {
  return read($meaninglessNumber) * 2;
}

const theAnswer = getDefaultStore()
  .read($theAnswerToLifeTheUniverseTheEverything);
```
