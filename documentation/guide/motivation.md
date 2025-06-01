# Motivation

You might be thinking - ugh, _another_ state management library?

[![XKCD #927: Standards](./xkcd_927.png){width=500px}](https://xkcd.com/927/)

Fair. So, here is the story. This is not a justification - just an honest explanation of the thought
process that led us at [Areven](https://areven.com) to build _yet another solution_.


## A brief history of state management in JavaScript

### The early days – Local state everywhere

Before frameworks, state was mostly kept in DOM elements, global variables, or jQuery-based spaghetti.
There was no structure - just imperative code that manipulated UI directly. As apps grew, this approach did
not scale.

Then came frameworks like AngularJS and Backbone, which introduced structured ways to model state - but each
came with its own concepts and tooling.

### 2013 - React's built in state

React introduced _component-level state_ using `this.setState()` and later with `useState()`. It was scoped, simple,
and declarative. For many use cases, it was enough.

But as apps grew and components needed to share state, _prop drilling_ became a problem. Lifting state up helped,
but introduced complexity and coupling.

### 2015 - Redux

Enter Redux - a global, immutable, predictable state container. It introduced a unidirectional data flow, actions,
reducers, and a centralized store. It gained massive popularity thanks to its strict architecture and debugging
capabilities.

Redux was great for large apps, but required _a lot_ of boilerplate. For small-to-medium apps, it was
a massive overkill.

I do not know about you, but I felt like the corporate world, with its never-ending paper trail, finally invented
a way to torment the little guys too.

### 2018 - React Context

React introduced _Context API_ as a way to avoid prop drilling. It worked well for things like themes or user
settings, but was not optimized for frequent updates. Overusing it for dynamic state led to unnecessary re-renders.

The _Context API_ made me not hate state management anymore, but one thing was certain - it was still not _it_.

### 2020 - Recoil

Recoil was Facebook's experimental attempt to solve React's state sharing and derived state problems, using a
graph-based approach. It introduced atoms and selectors, focusing on fine-grained reactivity and better render
performance.

It was a big shift - and it piqued my interest.

The atomic approach to state was the new cool kid in town. It shifted the way we were thinking about state
management and addressed many of the shortcomings of the previous solutions. However, while I felt the general
idea was a move in the right direction, the API seemed bloated and overly complicated.

### 2020 - Jotai

Jotai (meaning 'atom' in Japanese) introduced a simpler mental model than Recoil. No selectors, no reducers -
just atoms that can depend on other atoms. It is minimalist, type-safe, and works well with Suspense and Concurrent
Mode. A popular choice to this day.

For a while, it felt great and served me well in pure React projects. But as things grew more complex, implementing
certain patterns became an intense mental workout. Jotai started getting in the way instead of helping.

I still believe it is a solid choice for many projects. But if:

* your codebase mixes React code with non-React code,
* or your state heavily relies on side effects,
* or a large part of your state depends on async data,

it may become a struggle.


## Then 2024 - ...Reago?

All this time I was wondering - why did Jotai sometimes feel wrong and how could it have been done differently?
Simplifying the Recoil's mental model seemed like the right path, but maybe there was a different way?

The struggle intensified when I started actively working on a project in React Native. It was a wild one.
Half of it was the React UI, the other half was a 3D engine. And they both shared the same state.

The little shortcomings of Jotai, like its second-class citizen support for non-React environments and its
convoluted approach to side effects, started piling up. I was banging my head against the wall more often
than I would like to admit. I once got stuck for a week - and that was the breaking point.

One day, while writing _yet another_ React component, it clicked. What if I applied the same principles I used
in UI composition... to state? Few hours later, I sketched out an experimental API and started trying it out on
real-life problems I encountered at that time.

It worked surprisingly well... up to a point.

Handling async queries was still annoyingly verbose. You probably know the React pattern:

```ts
function UserProfile({userId}) {
  const [[hasData, hasError, result], setState] = useState([false, false, null]);
  const queryPromise = useMemo(
    () => fetchUser(userId),
    [userId]
  );

  useEffect(() => {
    setState({false, false, null});
    queryPromise.then(
      (result) => {
        setState([true, false, result]);
      },
      (err) => {
        setState([false, true, err]);
      }
    );
  }, [queryPromise]);

  if (hasData) {
    // ...
  } else if (hasError) {
    // ...
  } else {
    // ...
  }
}
```

Pure madness. The manual handling of Promises, verbose handling of the `loading | success | error`
states... yuck. The early sketch of Reago looked the same.

React addressed it by introducing Suspense, but that was not an option for Reago. I needed something
different, and shelved the idea for weeks.

That is, until I accidentally stumbled across a random comment on Reddit claiming JavaScript generators
are essentially a superset of `async` / `await`.

_Crap. Right._ \
This is what I needed.

Suddenly I realized, I can in fact put `await` into atoms and track the execution context
for hooks and dependencies at the same time. The `async` / `await` logic can be reimplemented in generators,
with full tracking logic attached, simply by replacing `await` with `yield`.

A quick proof of concept to verify it does actually work, and generative atoms came to life.


## The aftermath

Reago was implemented at the end of 2024. We used it internally at [Areven](https://areven.com) - with
great success I might say - for over half a year. It solved the issues we had and allowed us to iterate
noticeably faster.

Is it the end-game state management library? Of course not. There is no such thing. But for us,
it was a step forward - and it certainly changed the game.

Half a year later, in the spirit of open source, we decided to give back to the community.

Who knows - maybe it will be a step forward for you too?
