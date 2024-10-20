// =============================================================================
// Public dispatch() API tests
// =============================================================================

import {
  atomAction, atomComputationEffect, atomMountEffect, atomRef, atomState, createStore,
  dispatch, getDefaultStore, read
} from 'reago';
import {expect, test} from 'vitest';
import {IllegalOperationAtomError} from '~/error';


test('dispatch() is by default a proxy to the default store', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  expect(defaultStore.read($atom)).toBe(0)
  expect(customStore.read($atom)).toBe(0);

  dispatch($atom)(13);
  expect(defaultStore.read($atom)).toBe(13)
  expect(customStore.read($atom)).toBe(0);

  customStore.dispatch($atom)(8);
  expect(defaultStore.read($atom)).toBe(13)
  expect(customStore.read($atom)).toBe(8);
});

test('dispatch() inside a computation is forbidden and will throw', () => {
  function $atom() {
    dispatch($atom)(123);
  }

  expect(() => read($atom)).toThrowError(IllegalOperationAtomError);
});

test('dispatch() inside atomAction is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  function $atom1() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function $atom2() {
    atomAction((value: number) => {
      dispatch($atom1)(value);
    }, []);
  }

  expect(defaultStore.read($atom1)).toBe(0)
  expect(customStore.read($atom1)).toBe(0);

  defaultStore.dispatch($atom2)(13);
  expect(defaultStore.read($atom1)).toBe(13)
  expect(customStore.read($atom1)).toBe(0);

  customStore.dispatch($atom2)(8);
  expect(defaultStore.read($atom1)).toBe(13)
  expect(customStore.read($atom1)).toBe(8);
});

test('dispatch() inside atomComputationEffect is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  const results: number[] = [];
  function $atom1() {
    const mul = ++counter === 1 ? 1 : -1;
    atomAction((value: number) => {
      results.push(mul * value);
    }, [mul]);
  }

  function $atom2() {
    const ref = atomRef(false);

    if (ref.current) {
      atomComputationEffect(() => {});
    } else {
      ref.current = true;
      atomComputationEffect(() => {
        dispatch($atom1)(10);
        return () => {
          dispatch($atom1)(20);
        };
      });
    }
  }

  defaultStore.read($atom1); // positive values
  customStore.read($atom1); // negative values

  defaultStore.read($atom2);
  expect(results).toEqual([10]);

  customStore.read($atom2);
  expect(results).toEqual([10, -10]);

  customStore.invalidate($atom2);
  customStore.read($atom2);
  expect(results).toEqual([10, -10, -20]);

  defaultStore.invalidate($atom2);
  defaultStore.read($atom2);
  expect(results).toEqual([10, -10, -20, 20]);
});

test('dispatch() inside atomMountEffect is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  const results: number[] = [];
  function $atom1() {
    const mul = ++counter === 1 ? 1 : -1;
    atomAction((value: number) => {
      results.push(mul * value);
    }, [mul]);
  }

  function $atom2() {
    atomMountEffect(() => {
      dispatch($atom1)(10);
      return () => {
        dispatch($atom1)(20);
      };
    }, []);
  }

  defaultStore.read($atom1); // positive values
  customStore.read($atom1); // negative values

  const watcher2 = customStore.watch($atom2, () => {});
  expect(results).toEqual([-10]);

  const watcher1 = defaultStore.watch($atom2, () => {});
  expect(results).toEqual([-10, 10]);

  watcher2.clear();
  expect(results).toEqual([-10, 10, -20]);

  watcher1.clear();
  expect(results).toEqual([-10, 10, -20, 20]);
});

test('dispatch() inside a listener is a proxy to the store that created the watcher', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  const results: number[] = [];
  function $atom1() {
    const num = ++counter;
    atomAction((mul: number) => {
      results.push(num * mul);
    }, [num]);
    return num;
  }

  defaultStore.read($atom1); // 1, later 3
  customStore.read($atom1); // 2, later 4

  using watcher1 = defaultStore.watch($atom1, () => {
    dispatch($atom1)(1);
  });

  using watcher2 = customStore.watch($atom1, () => {
    dispatch($atom1)(-1);
  });

  defaultStore.invalidate($atom1);
  expect(results).toEqual([3]);

  customStore.invalidate($atom1);
  expect(results).toEqual([3, -4]);
});
