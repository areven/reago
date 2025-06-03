# Glossary

This glossary is intended to provide some guidance about the meanings of technical terms that are in
common usage when talking about Reago. It is intended to be _descriptive_ of how terms are commonly used,
not a _prescriptive_ specification of how they must be used. Some terms may have slightly different meanings
or nuances depending on the surrounding context.

[[toc]]


## Atoms

#### Atom

An atom represents a single piece of reactive state. It is a unit of state that can be created, read, and
updated independently.

In Reago, an atom is just a function. By convention, atom function names are prefixed with a dollar sign,
but it is not a strict requirement. There is no setup or registration required: if it is a function and used
within the system, it is an atom.

This design keeps atoms lightweight, declarative, and easy to compose, with reactivity determined purely by the
data flow inside these functions.

```ts
import {read} from 'reago';

function $firstAtom() {
  return 42;
}

function $secondAtom() {
  return read($firstAtom) * 2;
}
```

#### Functional atom

A functional atom is an atom that is not a generator.

```ts
function $functionalAtom() {
  // ...
}
```

#### Generative atom

A generative atom is an atom that is a generator.

```ts
function* $generativeAtom() {
  const response = yield fetch(...);
  const data = yield response.json();
  return data.name;
}
```

Generative atoms are used for asynchronous computations. When reading a generative atom, its
return value is always a `Promise`.

#### Atom family

Atom family is a mechanism for creating multiple independent instances of the same atom. It is simply
an atom function that accepts one or more arguments, allowing each call with different arguments to represent
a separate reactive state.

```ts
function* $userName(userId) {
  const response = yield fetch('/api/user/' + userId);
  const data = yield response.json();
  return data.name;
}
```

It can be a functional atom or a generative atom. Reago identifies each instance by serializing
the provided arguments. For this reason, the argument types are restricted to the following primitives.

```ts
type AtomFamilyArg = string | number | boolean | null | undefined;
```

#### Synchronous atom

A synchronous atom is a functional atom that does not return a `Promise`.

```ts
function $synchronousAtom() {
  return 42;
}
```

#### Asynchronous atom

An asynchronous atom is a functional atom that returns a `Promise` or a generative atom.

```ts
function $asynchronousFunctionalAtom() {
  return Promise.resolve(42);
}

function* $asynchronousGenerativeAtom() {
  return 42;
}
```

#### Mounted atom

A mounted atom is an atom that is currently subscribed to via `watch`, either explicitly or transitively.

Reago mounts an atom when its value is observed, indicating that it must be kept _fresh_ at all times.
An atom is unmounted when its subscribers count goes back to zero.


## Stores

#### Store

Since atoms are just functions, they cannot hold state on their own. Reago computes atoms and stores their
values, states and dependencies in a _store_.

Stores are independent of each other. An atom might exist in multiple stores and have a different state in each.

#### Default store

Reago provides a built-in default store that is used for all operations if you do not provide a custom store.
It is simply called the _default store_.

#### Active store

An active store is the store a computation is running in. If you read an atom from a certain store, it
becomes the active store for all logic inside that atom.


## Computations

#### Computation

Computation is the process of computing an atom's value. It involves running the atom function, the atom
functions of any dependencies, and updating the dependency graph.

#### Execution context

This is not a Reago term. Execution context in JavaScript is the environment in which code is evaluated and
executed. It includes the variables, functions, and the scope chain available at that moment during execution.

When function A calls function B, a new execution context for B is created and placed on top of the call stack.
Since A's context is still on the stack below, B runs "within" the overall context started by A. In other words,
A is the caller and is higher in the call stack, making B's execution context dependent on that call.

#### Computation context

In Reago, a computation context is similar to an execution context in JavaScript but specific to atom evaluation.
When an atom is computed, all the calls made inside that atom, including deeper nested calls and any other atoms
read during the process, run within the same single computation context.

This setup allows Reago to accurately track dependencies because every atom accessed during that computation is
linked to the same active computation context, and effectively share the same active store.

## Miscellaneous

#### Hook

Hooks are special functions prefixed with `atom` that can only be called at the top level inside atom logic.
They allow you to declare state variables, run side effects, memoize values, and manage other reactive
behaviors within the atom's computation. Hooks rely on a consistent call order to maintain stable internal state
during reactive updates. This makes it possible to build complex, efficient reactive logic while keeping atom
code clean and declarative.

#### Dependency graph

The dependency graph tracks how atoms depend on each other. When an atom reads another during its computation,
a directed edge is created from the reading atom to the one it reads. This forms a graph of dependencies that
Reago uses to determine update paths. Only atoms that are mounted - meaning they are actively
subscribed to - are guaranteed to compute immediately. Others can be lazily evaluated on demand. The graph
ensures updates propagate efficiently through only the relevant parts of the system.
