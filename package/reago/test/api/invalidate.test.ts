// =============================================================================
// Public invalidate() API tests
// =============================================================================

import {atomAction, createStore, getDefaultStore, invalidate, read} from 'reago';
import {expect, test} from 'vitest';
import {IllegalOperationAtomError} from '~/error';


test('invalidate() is by default a proxy to the default store', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom() {
    return ++counter;
  }

  expect(defaultStore.read($atom)).toBe(1);
  expect(customStore.read($atom)).toBe(2);

  invalidate($atom);
  expect(defaultStore.read($atom)).toBe(3);
  expect(customStore.read($atom)).toBe(2);

  customStore.invalidate($atom);
  expect(defaultStore.read($atom)).toBe(3);
  expect(customStore.read($atom)).toBe(4);
});

test('invalidate() inside a computation is forbidden and will throw', () => {
  function $atom() {
    invalidate($atom);
  }

  expect(() => read($atom)).toThrowError(IllegalOperationAtomError);
});

test('invalidate() inside atomAction is a proxy to the store the effect is running in', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter = 0;
  function $atom1() {
    return ++counter;
  }

  function $atom2() {
    atomAction((value: number) => {
      invalidate($atom1);
    }, []);
  }

  expect(defaultStore.read($atom1)).toBe(1);
  expect(customStore.read($atom1)).toBe(2);

  defaultStore.dispatch($atom2)();
  expect(defaultStore.read($atom1)).toBe(3);
  expect(customStore.read($atom1)).toBe(2);

  customStore.dispatch($atom2)();
  expect(defaultStore.read($atom1)).toBe(3);
  expect(customStore.read($atom1)).toBe(4);
});

test('invalidate() inside a listener is a proxy to the store that created the watcher', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  let counter1 = 0;
  function $atom1() {
    return ++counter1;
  }

  let counter2 = 0;
  function $atom2() {
    return ++counter2;
  }

  using watcher1 = defaultStore.watch($atom2, () => {
    invalidate($atom1);
  });

  using watcher2 = customStore.watch($atom2, () => {
    invalidate($atom1);
  });

  expect(defaultStore.read($atom1)).toBe(1);
  expect(customStore.read($atom1)).toBe(2);

  defaultStore.invalidate($atom2);
  expect(defaultStore.read($atom1)).toBe(3);
  expect(customStore.read($atom1)).toBe(2);

  customStore.invalidate($atom2);
  expect(defaultStore.read($atom1)).toBe(3);
  expect(customStore.read($atom1)).toBe(4);
});
