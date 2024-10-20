// =============================================================================
// Public store API tests
// =============================================================================

import {createStore, getDefaultStore} from 'reago';
import {expect, test} from 'vitest';


test('getDefaultStore() always returns the same store', () => {
  const store1 = getDefaultStore();
  const store2 = getDefaultStore();
  const store3 = getDefaultStore();

  expect(store1).toBe(store2);
  expect(store1).toBe(store3);
  expect(store2).toBe(store3);
});

test('createStore() always returns a different store', () => {
  const store1 = createStore();
  const store2 = createStore();
  const store3 = createStore();

  expect(store1).not.toBe(store2);
  expect(store1).not.toBe(store3);
  expect(store2).not.toBe(store3);
});

test('createStore() does not return the default store', () => {
  const defaultStore = getDefaultStore();
  const customStore = createStore();

  expect(defaultStore).not.toBe(customStore);
});
