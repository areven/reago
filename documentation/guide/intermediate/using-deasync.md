# Using the deasync() helper

Sometimes it is more convenient to deal with Promises in a synchronous way. Awaiting the result
or using mechanisms like React Suspense is not always an option.

Reago provides a tiny `deasync()` helper that can _unpack_ the `Promise` state into an object.

```ts
interface DeasyncState<ResultType, ErrorType> {
  status: 'pending' | 'resolved' | 'rejected';
  result?: ResultType;
  error?: ErrorType;
}
```

It plugs into Reago's internal `Promise` tracking system, so if a `Promise` is already known and settled,
it can return the outcome instantly.


## Usage with arbitrary Promises

The `deasync()` helper is not limited to Promises originating in Reago. It can be used with any `Promise`-like
object.

The following example is simple and not very interesting, but it will get us started.

```ts
import {deasync} from 'reago';

// create a promise
const promise = Promise.resolve('I am async');

// query its state - reago does not know this
// promise so it will start tracking it
const state1 = deasync(promise);
assert(state1.status === 'pending');

// wait for the promise to settle
await promise;

// query its state again
const state2 = deasync(promise);
assert(state2.status === 'resolved');
assert(state2.result === 'I am async');
```

Reago did not know this `Promise` yet, so it could not return the outcome instantly.


## Usage with generative atoms

Things get more interesting when the value of a `Promise` is known. Let us create a generative
atom first that returns a `Promise` when read, despite computing synchronously.

```ts
function* $asyncAtom() {
  return 'I am async';
}
```

What will happen if we run its value through `deasync()`?

```ts
import {deasync, read} from 'reago';

const promise = read($asyncAtom);
const state = deasync(promise);
assert(state.status === 'resolved');
assert(state.result === 'I am async');
```

Even though we did not use `await` anywhere, we got the result synchronously. That is because Reago
computed the generative atom synchronously, and although it returned a `Promise`, it already knows
what it resolves to.

We can push it much further.

```ts
import {atomAction, atomState, read} from 'reago';

function $repositoryData() {
  return fetch('https://api.github.com/repos/areven/reago')
    .then(response => response.json());
}

function $selectedProp() {
  const [prop, setProp] = atomState('stargazers_count');
  atomAction(setProp, []);
  return prop;
}

function* $selectedPropValue() {
  const data = yield read($repositoryData);
  const propName = read($selectedProp);
  return data[propName];
}
```

We are fetching the `areven/reago` repository details, and we created a generative atom that returns
the selected property.

```ts
// prints... hopefully a lot!
console.log(await read($selectedPropValue));
```

We did an initial read, so `$repositoryData` was computed and it is now a `Promise` that resolves to
the repository details json. The `$selectedPropValue` reads that json asynchronously and returns
the default `$selectedProp` - also via a `Promise`.

Reago knows the `Promise` from `$repositoryData` already, so if we were to query it now, we can get the
json synchronously.

```ts
const promise = read($repositoryData);
const state = deasync(promise);
assert(state.status === 'resolved');
console.log(state.result);
```

Time to ask for a different property in the json.

```ts
dispatch($selectedProp)('html_url');
const promise = read($selectedPropValue);

const state = deasync(promise);
assert(state.status === 'resolved');
assert(state.result === 'https://github.com/areven/reago');
```

Did you notice how we did not use a single `await`?

The change of the selected property triggered a recomputation of `$selectedPropValue`. However, the `Promise`
returned from `$repositoryData` is already known, so its value was returned instantly. Reago computed
the new value of `$selectedPropValue` synchronously and returned a new `Promise` that resolves to
`https://github.com/areven/reago`.

The `deasync()` helper allowed us to get that value out immediately, without using `await` at all.


## Making an async atom synchronous

The `deasync()` helper works with atoms too. If you give it an atom instead of a `Promise`, it will create
a derived atom that tracks the original atom, but unpacks it.

```ts
import {deasync, read} from 'reago';

function* $asyncAtom() {
  yield new Promise(resolve => setTimeout(resolve, 1000));
  return 'Value returned after a second';
}

const $deasyncAtom = deasync($asyncAtom); // [!code highlight]

function $atom() {
  const {status, result, error} = read($deasyncAtom);

  switch (status) {
    case 'pending':
      return 'still loading';
    case 'resolved':
      return `the value is ${result}`;
    default:
      return 'something went wrong';
  }
}
```

We turned an asynchronous computation into a synchronous one, that recomputes when the `Promise` settles.

The `deasync($atom)` helper persists the derived atom instance internally. Reago guarantees that multiple
`deasync` calls on the same atom will always return the same derived atom, so instead of explicitly storing
its reference, we can simplify the example above even further.

```ts
import {deasync, read} from 'reago';

function* $asyncAtom() {
  yield new Promise(resolve => setTimeout(resolve, 1000));
  return 'Value returned after a second';
}

function $atom() {
  const {status, result, error} = read(deasync($atomReturningAPromise)); // [!code highlight]

  switch (status) {
    case 'pending':
      return 'still loading';
    case 'resolved':
      return `the value is ${result}`;
    default:
      return 'something went wrong';
  }
}
```


## Further reading

If you would be in a need of a full breakdown of the `deasync()` helper - including its call signatures,
return types, and usage constraints - please refer to the [API reference](/api/reago/deasync).
