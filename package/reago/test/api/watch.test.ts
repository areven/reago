// =============================================================================
// Public watch() API tests
// =============================================================================

import {atomAction, createStore, getDefaultStore, read, watch, type AtomWatcher} from 'reago';
import {expect, test} from 'vitest';
import {IllegalOperationAtomError} from '~/error';


test('watch() is by default a proxy to the default store', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom() {
    return ++counter;
  }

  let listener1 = 0;
  using watcher1 = watch($atom, () => {
    ++listener1;
  });

  let listener2 = 0;
  using watcher2 = customStore.watch($atom, () => {
    ++listener2;
  });

  defaultStore.invalidate($atom);
  expect(listener1).toBe(1);
  expect(listener2).toBe(0);

  defaultStore.invalidate($atom);
  expect(listener1).toBe(2);
  expect(listener2).toBe(0);

  customStore.invalidate($atom);
  expect(listener1).toBe(2);
  expect(listener2).toBe(1);
});

test('watch() inside a computation is forbidden and will throw', () => {
  function $atom() {
    using watcher = watch($atom, () => {});
  }

  expect(() => read($atom)).toThrowError(IllegalOperationAtomError);
});

test('watch() inside atomAction is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();
  const watchers: AtomWatcher[] = [];

  let counter1 = 0;
  function $atom1() {
    return ++counter1;
  }

  let counter2 = 0;
  function $atom2() {
    atomAction(() => {
      watchers.push(watch($atom1, () => {
        ++counter2;
      }));
    }, []);
  }

  defaultStore.read($atom1);
  customStore.read($atom1);

  customStore.dispatch($atom2)(); // sets up the watcher in custom store
  expect(counter2).toBe(0);

  defaultStore.invalidate($atom1);
  expect(counter2).toBe(0);

  customStore.invalidate($atom1);
  expect(counter2).toBe(1);

  watchers.forEach(w => w.clear());
});

test('watch() inside a listener is a proxy to the store that created the watcher', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();
  const watchers: AtomWatcher[] = [];
  const results: string[] = [];

  let counter1 = 0;
  function $atom1() {
    return ++counter1;
  }

  let counter2 = 0;
  function $atom2() {
    return ++counter2;
  }

  defaultStore.read($atom1);
  customStore.read($atom1);

  using watcher1 = defaultStore.watch($atom2, () => {
    watchers.push(watch($atom1, () => {
      results.push('watcher1');
    }));
  });

  using watcher2 = customStore.watch($atom2, () => {
    watchers.push(watch($atom1, () => {
      results.push('watcher2');
    }));
  });

  defaultStore.invalidate($atom2);
  expect(results).toEqual([]);
  customStore.invalidate($atom1);
  expect(results).toEqual([]);
  defaultStore.invalidate($atom1);
  expect(results).toEqual(['watcher1']);
  customStore.invalidate($atom2);
  expect(results).toEqual(['watcher1']);
  customStore.invalidate($atom1);
  expect(results).toEqual(['watcher1', 'watcher2']);

  watchers.forEach(w => w.clear());
});
