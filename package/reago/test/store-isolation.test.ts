// =============================================================================
// Store isolation tests
// =============================================================================

import {atomAction, atomState, createStore, getDefaultStore} from 'reago';
import {expect, test} from 'vitest';


test('store.read() scope is restricted to the store it was called on', () => {
  const store1 = getDefaultStore();
  const store2 = createStore();
  const store3 = createStore();

  let counter = 0;
  function $atom() {
    ++counter;
    return null;
  }

  expect(store1.read($atom)).toBe(null);
  expect(store1.read($atom)).toBe(null);
  expect(counter).toBe(1);

  expect(store2.read($atom)).toBe(null);
  expect(store2.read($atom)).toBe(null);
  expect(counter).toBe(2);

  expect(store3.read($atom)).toBe(null);
  expect(store3.read($atom)).toBe(null);
  expect(counter).toBe(3);
});

test('store.dispatch() scope is restricted to the store it was called on', () => {
  const store1 = getDefaultStore();
  const store2 = createStore();

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  expect(store1.read($atom)).toBe(0);
  expect(store2.read($atom)).toBe(0);

  store1.dispatch($atom)(13);
  expect(store1.read($atom)).toBe(13);
  expect(store2.read($atom)).toBe(0);

  store2.dispatch($atom)(82);
  expect(store1.read($atom)).toBe(13);
  expect(store2.read($atom)).toBe(82);
});

test('store.invalidate() scope is restricted to the store it was called on', () => {
  const store1 = getDefaultStore();
  const store2 = createStore();

  let counter = 0;
  function $atom() {
    ++counter;
    return null;
  }

  expect(store1.read($atom)).toBe(null);
  expect(counter).toBe(1);

  expect(store2.read($atom)).toBe(null);
  expect(counter).toBe(2);

  store1.invalidate($atom);
  expect(store2.read($atom)).toBe(null);
  expect(counter).toBe(2);


  expect(store1.read($atom)).toBe(null);
  expect(counter).toBe(3);
});
