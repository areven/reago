# reago

## 1.1.4

### Patch Changes

- 8aeb9be: Generated npm provenance statements for the package

## 1.1.3

### Patch Changes

- 4590936: Implemented minor stylistic changes

## 1.1.2

### Patch Changes

- 5c39720: Switched to arrow functions for Store context binding

  This approach allows TypeScript to recognize the `this` context is irrelevant and methods
  can be safely destructured.

## 1.1.1

### Patch Changes

- d95f394: Updated the user guide link on npm pages

## 1.1.0

### Minor Changes

- 101a469: Stabilized the `deasync($atom)` helper to persist the derived atom across calls

  This makes it safe to use `deasync($atom)` inline, directly where it is needed, without manually persisting
  the returned reference. Other `deasync()` call signatures are unaffected.

## 1.0.3

### Patch Changes

- f2b3721: Updated the readme badges on npm pages

## 1.0.2

### Patch Changes

- 4bcce0d: Fixed the MIT license links on npm pages

## 1.0.1

### Patch Changes

- f43609b: Fixed the Reago logo on npm pages

## 1.0.0

### Major Changes

- 687b868: Reago is now stable

  After multiple iterations, internal improvements, and type safety enhancements, Reago has reached its
  first stable release. The core API is now considered production-ready. Future updates will follow semantic
  versioning strictly, with a strong focus on API stability.

## 0.3.0

### Minor Changes

- 93a14a5: Updated the Store class to bind its methods to the store context

  This change makes it safe to use destructuring for extracting individual methods from a store instance
  without losing the store context.

## 0.2.2

### Patch Changes

- 1152e34: Transferred the package ownership to the `areven` organization

## 0.2.1

### Patch Changes

- e5cc2f1: Updated typescript signatures of union types to better support destructuring

## 0.2.0

### Minor Changes

- b0df7cc: Updated the `Atom<...>` type signature to explicitly require `Promise<...>` for generative atoms

  This change simplifies result type inferring and makes typing more explicit and predictable.

## 0.1.4

### Patch Changes

- 77c711e: Added `main` and `types` fields to package.json

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

- dbc1462: Reago - a state management library, named after the Esperanto word for 'reaction'.

  Why Esperanto? Because it's the language of connection, designed to bring together people
  from different backgrounds. And just like that, Reago is here to connect your app's states
  with clarity and ease.

  Special thanks to:

  - Mateusz Nowak for coming up with the perfect name for this library.
  - Richard Tong for kindly transferring the ownership of his old "reago" package.

  Let's see where this journey takes us!
