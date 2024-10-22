---
"reago": patch
---

Added a new deasync() util for consuming asynchronous atoms and promises synchronously

Reago tracks state of promises returned from generative atoms and promises yielded from
generators. Thanks to that, it's capable of running seemingly asynchronous generative atom
computations synchronously, if all referenced async values are already known.

A generative atom always returns a promise, but we might already know its outcome before it
has a chance to notify the registered listeners. The new deasync() utility plugs into the
internal promise state tracking system and might allow you to read the result synchronously even
before the returned promise settles.
