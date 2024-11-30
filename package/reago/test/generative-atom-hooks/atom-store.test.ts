// =============================================================================
// atomStore generative atom tests
// =============================================================================

import {atomStore, createStore, getDefaultStore, read, type Atom, type Store} from 'reago';
import {expect, test} from 'vitest';


test('atomStore returns the default store correctly', async () => {
  const defaultStore = getDefaultStore();
  let computeCount = 0;

  const $atom: Atom<Promise<Store>> = function* () {
    ++computeCount;
    const store1 = atomStore();
    yield Promise.resolve(null);
    const store2 = atomStore();
    if (store1 !== store2) throw new Error('fail');
    return store1;
  }

  await expect(read($atom)).resolves.toBe(defaultStore);
  await expect(defaultStore.read($atom)).resolves.toBe(defaultStore);
  expect(computeCount).toBe(1);
});

test('atomStore returns a custom store correctly', async () => {
  const store1 = createStore();
  const store2 = createStore();
  const store3 = createStore();

  const $atom: Atom<Promise<Store>> = function* () {
    yield Promise.resolve(123);
    return atomStore();
  }

  await expect(store1.read($atom)).resolves.toBe(store1);
  await expect(store2.read($atom)).resolves.toBe(store2);
  await expect(store3.read($atom)).resolves.toBe(store3);
});
