# createStore

`createStore` lets you create a custom store.

::: code-group
```ts [Syntax]
const store = createStore()
```

```ts [Types]
function createStore(): Store
```
:::


## Reference

### `createStore()`

Call `createStore` anywhere in your code to create a new store.

```ts
import {createStore, type Store} from 'reago';

const store: Store = createStore();
```

#### Returns

`createStore` returns a newly created Reago store.

The atoms you define are just functions. When they are computed, their values are stored in a store.
Stores are independent of each other and each might have a different state. A single atom might have
different values in different stores.

Reago provides a built-in store that is used by all methods by default, but if you require multiple
separate states, manually creating custom stores is the way to go.


## Examples

### Reading from multiple stores

Call `createStore()` multiple times and then use `.read()` to read from them directly.

```ts
import {createStore} from 'reago';

const store1 = createStore();
const store2 = createStore();

let nextValue = 1;
function $increasingAtom() {
  return nextValue++;
}

const value1 = store1.read($increasingAtom); // returns 1
const value2 = store2.read($increasingAtom); // returns 2
const value3 = store1.read($increasingAtom); // returns 1
```
