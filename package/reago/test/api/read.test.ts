// =============================================================================
// Public read() API tests
// =============================================================================

import {
  atomAction, atomComputationEffect, atomMountEffect, atomRef, createStore, getDefaultStore, read
} from 'reago';
import {expect, test} from 'vitest';


test('read() is by default a proxy to the default store', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom() {
    return ++counter;
  }

  const val1 = defaultStore.read($atom);
  const val2 = customStore.read($atom);
  expect(val1).toBe(1);
  expect(val2).toBe(2);

  expect(read($atom)).toBe(1);
});

test('read() inside a computation is a proxy to the store the computation is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom1() {
    return ++counter;
  }

  function $atom2() {
    return read($atom1);
  }

  const val1 = defaultStore.read($atom1);
  const val2 = customStore.read($atom1);
  expect(val1).toBe(1);
  expect(val2).toBe(2);

  expect(defaultStore.read($atom2)).toBe(1);
  expect(customStore.read($atom2)).toBe(2);
});

test('read() inside atomAction is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom1() {
    return ++counter;
  }

  const results: number[] = [];
  function $atom2() {
    atomAction(() => {
      results.push(read($atom1));
    }, []);
  }

  const val1 = defaultStore.read($atom1);
  const val2 = customStore.read($atom1);
  expect(val1).toBe(1);
  expect(val2).toBe(2);

  customStore.dispatch($atom2)();
  expect(results).toEqual([2]);

  defaultStore.dispatch($atom2)();
  expect(results).toEqual([2, 1]);

  defaultStore.dispatch($atom2)();
  expect(results).toEqual([2, 1, 1]);

  customStore.dispatch($atom2)();
  expect(results).toEqual([2, 1, 1, 2]);
});

test('read() inside atomComputationEffect is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom1() {
    return ++counter;
  }

  const results: number[] = [];
  function $atom2() {
    const ref = atomRef(false);

    if (ref.current) {
      atomComputationEffect(() => {});
    } else {
      ref.current = true;
      atomComputationEffect(() => {
        results.push(read($atom1));
        return () => {
          results.push(-1 * read($atom1));
        };
      });
    }
  }

  const val1 = defaultStore.read($atom1);
  const val2 = customStore.read($atom1);
  expect(val1).toBe(1);
  expect(val2).toBe(2);

  customStore.read($atom2);
  expect(results).toEqual([2]);

  defaultStore.read($atom2);
  expect(results).toEqual([2, 1]);

  defaultStore.invalidate($atom2);
  defaultStore.read($atom2);
  expect(results).toEqual([2, 1, -1]);

  customStore.invalidate($atom2);
  customStore.read($atom2);
  expect(results).toEqual([2, 1, -1, -2]);
});

test('read() inside atomMountEffect is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom1() {
    return ++counter;
  }

  const results: number[] = [];
  function $atom2() {
    atomMountEffect(() => {
      results.push(read($atom1));
      return () => {
        results.push(-1 * read($atom1));
      };
    }, []);
  }

  const val1 = defaultStore.read($atom1);
  const val2 = customStore.read($atom1);
  expect(val1).toBe(1);
  expect(val2).toBe(2);

  const watcher1 = customStore.watch($atom2, () => {});
  expect(results).toEqual([2]);

  const watcher2 = defaultStore.watch($atom2, () => {});
  expect(results).toEqual([2, 1]);

  watcher2.clear();
  expect(results).toEqual([2, 1, -1]);

  watcher1.clear();
  expect(results).toEqual([2, 1, -1, -2]);
});

test('read() inside a listener is a proxy to the store that created the watcher', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom() {
    return ++counter;
  }

  expect(defaultStore.read($atom)).toBe(1);
  expect(customStore.read($atom)).toBe(2);

  let val1 = 0;
  using watcher1 = defaultStore.watch($atom, () => {
    val1 = read($atom);
  });

  let val2 = 0;
  using watcher2 = customStore.watch($atom, () => {
    val2 = read($atom);
  });

  defaultStore.invalidate($atom);
  expect(val1).toBe(3);
  expect(val2).toBe(0);

  customStore.invalidate($atom);
  expect(val1).toBe(3);
  expect(val2).toBe(4);
});
