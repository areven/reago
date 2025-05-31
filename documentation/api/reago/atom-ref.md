# atomRef

`atomRef` is a hook that lets you reference a value that should not trigger a recomputation
when it changes.

```ts
const ref = atomRef(initialValue)
```


## Reference

### `atomRef(initialValue)`

Call `atomRef` at the top level of your atom to declare a reference.

```ts
import {atomRef} from 'reago';

function $atom() {
  const canvas = atomRef(null);
}
```

#### Parameters

* `initialValue`: The value you want the ref object's `current` property to be initially. It can be a value
  of any type. This argument is ignored after the initial render.

#### Returns

`atomRef` returns an object with a single property.
* `current`: Initially, it is set to the `initialValue` you have passed. Later, you can change it to
  something else via a simple assignment.

The returned object is stable, meaning `atomRef` will return the same object between computations.

#### Caveats

* `atomRef` is a hook, so you can only call it at the top level of your atom. You cannot call it inside loops
  or conditions.
* Contrary to `atomState`, you can mutate the `ref.current` property.
* When you change the `ref.current` property, Reago will not recompute the atom.


## Examples

### Counting computations

Declare a reference at the top-level of your atom to count how many times an atom is computed.

```ts
function $atom() {
  const counterRef = useRef(0);
  counterRef.current++;
  console.log(`$atom computed ${counterRef.current} time(s) so far`);
  return 42;
}
```
