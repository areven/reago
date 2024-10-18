// =============================================================================
// atomStore functional atom tests
// =============================================================================

import {atomStore, createStore, getDefaultStore, read, Store} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError} from '~/error';


test('atomStore returns the default store correctly', () => {
  const defaultStore = getDefaultStore();
  let computeCount = 0;

  function $atom(): Store {
    ++computeCount;
    return atomStore();
  }

  expect(read($atom)).toBe(defaultStore);
  expect(defaultStore.read($atom)).toBe(defaultStore);
  expect(computeCount).toBe(1);
});

test('atomStore returns a custom store correctly', () => {
  const store1 = createStore();
  const store2 = createStore();
  const store3 = createStore();

  function $atom(): Store {
    return atomStore();
  }

  expect(store1.read($atom)).toBe(store1);
  expect(store2.read($atom)).toBe(store2);
  expect(store3.read($atom)).toBe(store3);
});

test('atomStore cannot be called outside of a computation', () => {
  expect(() => atomStore()).toThrowError(ComputationContextRequiredAtomError);
});
