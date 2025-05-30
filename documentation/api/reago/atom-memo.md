# atomMemo

`atomMemo` is a hook that lets you cache the result of a calculation between computations.

```ts
const cachedValue = atomMemo(calculateValue, dependencies)
```


## Reference

### `atomMemo(calculateValue, dependencies)`

Use `atomMemo` at the top level of your atom to cache a calculation between computations.

```ts
import {atomMemo} from 'reago';

function $filteredArray() {
  const array = read($array);
  const filteredArray = useMemo(
    () => array.filter(...),
    [array]
  );
}
```

#### Parameters

* `calculateValue`: The function calculating the value that you want to cache. It should be pure,
  should take no arguments, and should return a value of any type. Reago will call this function
  during the initial computation, and when `dependencies` change.
* `dependencies`: The list of all reactive values referenced inside of the `calculateValue` code.
  The list of dependencies must have a constant number of items and be written inline like `[dep1, dep2, dep3]`.
  Reago will compare each dependency with its previous value using the `Object.is` comparison.

#### Returns

On the initial render, `atomMemo` returns the result of calling `calculateValue` with no arguments.

During next renders, it will either return an already stored value from the last render (if the dependencies
haven't changed), or call `calculateValue` again, and return the result that `calculateValue` has returned.

#### Caveats

* `atomMemo` is a hook, so you can only call it at the top level of your atom. You cannot call it inside loops
  or conditions.


## Examples

### Skipping expensive calculations

If your atom computes something that takes a long time, you can use `atomMemo` to cache the result of such
calculation.

```ts
import {atomMemo, read} from 'reago';

function $userNames() {
  return atomMemo(
    ['Sebastian Nowak', 'John Smith', ...],
    []
  );
}

function $activeFilter() {
  return 'smith'
}

function $filteredUserNames() {
  const names = read($userNames);
  const filter = read($activeFilter);
  const filteredNames = atomMemo(() => {
    return names.filter(s => s.toLowerCase().contains(filter));
  }, [names, filter]);
  return filteredNames;
}
