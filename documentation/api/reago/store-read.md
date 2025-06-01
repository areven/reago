# store.read

`store.read` lets you read a value from the given store.

::: code-group
```ts [Syntax]
const value = store.read($atom, ...familyArgs)
```

```ts [Types]
function read<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomResultOf<T>
```
:::


## Reference

### `store.read(atom, ...familyArgs)`

Call `store.read` anywhere in your code to read from the given store.

```ts
import {getDefaultStore} from 'reago';

function $atom() {
  // ...
}

function $atomFamily(someArgument: string) {
  // ...
}

const someStore = getDefaultStore();
const value1 = someStore.read($atom);
const value2 = someStore.read($atomFamily, 'someValue');
```

#### Parameters

* `atom`: A reference to an atom you want to read.
* `...familyArgs`: If the atom is a family (meaning it accepts arguments, where each unique combination of
  arguments represents a separate atom with its own state), these are the atom arguments.

#### Returns

`store.read` returns the value of the given atom within the referenced store.

The method will automatically compute the atom and its dependencies if they are not computed already.

However, this is a one-time read. Contrary to `store.watch` and subscription-based framework bindings
like React's `useReadAtom`, calling this method will not mount an atom because it is not subscribing to it.

The computed value is returned as is, which specifically means:
* If a functional atom returns a `Promise`-like value, the `Promise` is returned as is.
* If the atom is a generative atom, the returned value is always a `Promise`.

The returned value is stable and preserved between reads. The reference will change if and only if the
value changes, based on an `Object.is()` comparison.


## Examples

### Reading from a synchronous functional atom

Pass a functional atom to the `store.read` method to read its value.

```ts
import {getDefaultStore} from 'reago';

function $primitiveAtom() {
  return 42;
}

const store = getDefaultStore();
console.log(`Value is ${store.read($primitiveAtom)}`);
```

### Reading from an asynchronous functional atom

Pass an asynchronous functional atom to the `store.read` method to obtain the `Promise`.

```ts
import {getDefaultStore} from 'reago';

function $asyncAtom() {
  return new Promise(resolve => {
    setTimeout(() => resolve(42), 1000);
  });
}

const store = getDefaultStore();
store.read($asyncAtom).then(value => {
  console.log(`Value is ${value}`);
});
```

### Reading from a generative atom

Pass a generative atom to the `store.read` method to obtain the `Promise`.

```ts
import {getDefaultStore} from 'reago';

function* $generativeAtom {
  yield new Promise(resolve => setTimeout(resolve, 1000));
  return 42;
}

const store = getDefaultStore();
store.read($generativeAtom).then(value => {
  console.log(`Value is ${value}`);
});
```
