# reago

## 0.1.3

### Patch Changes

- a49309c: Updated the promise tracking system to use the `PromiseLike` type where appropriate

  We were previously using the `Promise` type for both internal and external async computations.
  This change makes it easier to use third-party implementations of promises with `yield` and `deasync`.

## 0.1.2

### Patch Changes

- de93d6d: Added a new deasync() util for consuming asynchronous atoms and promises synchronously

  Reago tracks state of promises returned from generative atoms and promises yielded from
  generators. Thanks to that, it's capable of running seemingly asynchronous generative atom
  computations synchronously, if all referenced async values are already known.

  A generative atom always returns a promise, but we might already know its outcome before it
  has a chance to notify the registered listeners. The new deasync() utility plugs into the
  internal promise state tracking system and might allow you to read the result synchronously even
  before the returned promise settles.

## 0.1.1

### Patch Changes

- 076b195: Removed duplicate changelog.md file from the published package
- 6b8234c: Fixed the `getPromiseState` return type for tracked promises

## 0.1.0

### Minor Changes

- c51ac2a: Updated `Atom<...>` generic to default to `ActionArgs = never` for better type safety

## 0.0.1

### Patch Changes

- dbc1462: Reago — a state management library, named after the Esperanto word for 'reaction'.

  Why Esperanto? Because it's the language of connection, designed to bring together people
  from different backgrounds. And just like that, Reago is here to connect your app’s states
  with clarity and ease.

  Special thanks to:

  - Mateusz Nowak for coming up with the perfect name for this library.
  - Richard Tong for kindly transferring the ownership of his old "reago" package.

  Let's see where this journey takes us!
