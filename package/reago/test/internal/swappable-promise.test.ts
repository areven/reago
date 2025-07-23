// =============================================================================
// Swappable promise tests
// =============================================================================

import {expect, test} from 'vitest';
import {createSwappablePromise, swapOrRecreatePromise} from '~/util/swappable-promise';


test('swappable promise can be created with a resolved promise', async () => {
  const resolved = Promise.resolve(123);
  const swappable = createSwappablePromise(resolved);
  await expect(swappable).resolves.toBe(123);
});

test('swappable promise can be created with a rejected promise', async () => {
  const rejected = Promise.reject(new Error('test'));
  const swappable = createSwappablePromise(rejected);
  await expect(swappable).rejects.toThrowError('test');
});

test('swappable promise can be created with a not yet resolved promise', async () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });

  const swappable = createSwappablePromise(promise);
  resolve!(123);
  await expect(swappable).resolves.toBe(123);
});

test('swappable promise can be created with a not yet rejected promise', async () => {
  let reject;
  const promise = new Promise((res, rej) => {
    reject = rej;
  });

  const swappable = createSwappablePromise(promise);
  reject!(new Error('test'));
  await expect(swappable).rejects.toThrowError('test');
});

test('swappable promise can be created with no promise and linked later', async () => {
  const swappable = createSwappablePromise(null);
  const promise = Promise.resolve(Symbol.dispose);
  void swapOrRecreatePromise(swappable, promise);
  await expect(swappable).resolves.toBe(Symbol.dispose);
});

test('swappable promise can be swapped as long as the promise is still pending', async () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });

  const swappable = createSwappablePromise(null);
  expect(swapOrRecreatePromise(swappable, promise)).toBe(swappable);
  expect(swapOrRecreatePromise(swappable, promise)).toBe(swappable); // no effect
  expect(swapOrRecreatePromise(swappable, Promise.resolve(123))).toBe(swappable);
  resolve!(456);
  await expect(swappable).resolves.toBe(123);
  expect(swapOrRecreatePromise(swappable, Promise.resolve(888))).not.toBe(swappable);
});
