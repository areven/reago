# Declaring side effects

Not all logic fits into pure computation. Sometimes you need to log something, start a timer, subscribe to
an external source, or clean up resources when they are no longer needed.

Reago provides tools for running side effects when atoms mount, unmount, or recompute. In this article, you
will learn how to hook into the atom lifecycle to perform this kind of work safely.


## Computation effects

Computation effects are side effects that run _after_ a computation finishes.

In addition to the side effect itself, they might _optionally_ provide a _cleanup_ function that will
run when the side effect is about to be replaced with another.

```ts
import {atomComputationEffect} from 'reago';

function $atom() {
  atomComputationEffect(() => {
    console.log('I will run after each computation');
    return () => {
      console.log('I will cleanup after this side effect, when a new computation finishes');
    };
  });
}
```

In addition to the effect logic itself, `atomComputationEffect` optionally accepts a second argument: the
list of `dependencies`. You should already be familiar with the concept - we declared them for `atomMemo`.

To reiterate, for `atomComputationEffect` specifically:
* If you do not provide `dependencies` at all, like in the example above, the effect will run for each
  computation. Reago will first run the _cleanup_ function from the previous computation, and then the `setup`
  from the new computation.
* If you provide an empty `dependencies` array, Reago will run `setup` only for the first computation. The
  _cleanup_ function will run only if the store or the atom itself is _destroyed_.
* If you provide a list of `dependencies`, Reago will run the `setup` function for the first computation,
  and then on subsequent computations, it will run the old _cleanup_ and the new `setup` only if `dependencies`
  changed.

Let us dive into a more practical example. Imagine a boolean toggle that will automatically turn itself
off after a few seconds. It is a bit like the "useless box" design that once circulated the internet.

<img src="./useless-box.gif" style="border-radius: 10px;" alt="Useless box"/>

We can build an atom that declares a boolean state variable, and an additional computation effect that
will automatically turn it off via `setTimeout`.

```ts
import {atomState, atomComputationEffect} from 'reago';

function $uselessBox() {
  const [value, setValue] = atomState(false);

  atomComputationEffect(() => {
    if (value) {
      const timeout = setTimeout(() => {
        setValue(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return value;
}
```

Notice how we added `value` to the list of `dependencies` - it will ensure the `setTimeout` is cancelled
if someone turns the switch off manually before the hardcoded delay.


## Mount effects

Mount effects are a different type of side effects that run when an atom is mounted or unmounted.

::: info Do you remember?
An atom is mounted when it is subscribed to, and unmounted when there are no subscribers left.
:::

The syntax is almost identical to computation effects. You provide a _setup_ method, an optional _cleanup_ method,
and a list of _dependencies_, which in this case is mandatory.

```ts
import {atomMountEffect} from 'reago';

function $atom() {
  atomMountEffect(() => {
    console.log('I will run when $atom is mounted');
    return () => {
      console.log('I will run when $atom is unmounted');
    };
  }, []);
}
```

::: tip Tip
In practice, you will be using mount effects very rarely, as your atoms should support one-off
reads too. Most use cases are more suitable for computation effects, or the invalidation pattern,
which you are going to learn about in the next article.
:::


## Hierarchy of side effects

Our examples were based on simple atoms, but real-life apps are much more complex than that. Multiple effects,
multiple types of effects, complex dependency graphs - what happens then?

* **Computation effects before mount effects**

  If an atom defines both types of side effects, computation effects run before mount effects.

* **Effects are set-up in the order of appearance**

  If an atom defines multiple side effects of the same type, they will run in the order they appear in your code.

* **Effects are cleaned up in reverse order**

  If an atom defines multiple side effects of the same type, and they provide _cleanup_ functions, the _cleanup_
  functions will run in the reverse order atoms were set up. In other words: last to run, first to clean-up.

* **Effects are set-up from the bottom**

  If `$atom1` reads `$atom2`, effects of `$atom2` will take precedence over effects of `$atom1`.

  However, the cleanup will happen in reverse. First `$atom1` and then `$atom2`.


## Further reading

We get it - effects might be confusing at first. If you want to dive deeper or just double-check the specifics,
take a look at the full API documentation for each effect type. It includes usage patterns, argument signatures,
and additional examples.

* [atomComputationEffect API reference](/api/reago/atom-computation-effect)
* [atomMountEffect API reference](/api/reago/atom-mount-effect)
