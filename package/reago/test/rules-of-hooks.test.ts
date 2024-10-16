// =============================================================================
// Rules of hooks
// =============================================================================

import {atomAction, atomRef, atomState, createStore, dispatch, invalidate, read} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError, HookCountMismatchAtomError, HookMismatchAtomError} from '~/error';


test('state of a hook is preserved between computations', async () => {
  function $atom1() {
    const ref = atomRef(null);
    return ref;
  }

  function* $atom2() {
    const ref = atomRef(null);
    return ref;
  }

  function* $atom3() {
    yield Promise.resolve('wait');
    const ref = atomRef(null);
    return ref;
  }

  const ref1 = read($atom1);
  invalidate($atom1);
  expect(read($atom1)).toBe(ref1);

  const ref2 = await read($atom2);
  invalidate($atom2);
  expect(await read($atom2)).toBe(ref2);

  const ref3 = await read($atom3);
  invalidate($atom3);
  expect(await read($atom3)).toBe(ref3);
});

test('state of a hook is tied to a store', async () => {
  function $atom1() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function* $atom2() {
    yield Promise.resolve('wait');
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  const store1 = createStore();
  const store2 = createStore();
  const store3 = createStore();

  expect(store1.read($atom1)).toBe(0);
  expect(store2.read($atom1)).toBe(0);
  expect(store3.read($atom1)).toBe(0);
  expect(await store1.read($atom2)).toBe(0);
  expect(await store2.read($atom2)).toBe(0);
  expect(await store3.read($atom2)).toBe(0);

  store1.dispatch($atom1)(8);
  store1.dispatch($atom2)(8);
  expect(store1.read($atom1)).toBe(8);
  expect(store2.read($atom1)).toBe(0);
  expect(store3.read($atom1)).toBe(0);
  expect(await store1.read($atom2)).toBe(8);
  expect(await store2.read($atom2)).toBe(0);
  expect(await store3.read($atom2)).toBe(0);

  store3.dispatch($atom1)(14);
  store3.dispatch($atom2)(14);
  expect(store1.read($atom1)).toBe(8);
  expect(store2.read($atom1)).toBe(0);
  expect(store3.read($atom1)).toBe(14);
  expect(await store1.read($atom2)).toBe(8);
  expect(await store2.read($atom2)).toBe(0);
  expect(await store3.read($atom2)).toBe(14);
});

test('state of a hook is tied to an atom instance', async () => {
  const $atom1 = function (id: number): number {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return id + value;
  }

  expect(read($atom1, 1)).toBe(1);
  expect(read($atom1, 2)).toBe(2);
  expect(read($atom1, 3)).toBe(3);

  dispatch($atom1, 1)(8);
  expect(read($atom1, 1)).toBe(9);
  expect(read($atom1, 2)).toBe(2);
  expect(read($atom1, 3)).toBe(3);

  dispatch($atom1, 3)(14);
  expect(read($atom1, 1)).toBe(9);
  expect(read($atom1, 2)).toBe(2);
  expect(read($atom1, 3)).toBe(17);

  const $atom2 = function* (id: number): Generator<number> {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return id + value;
  }

  expect(await read($atom2, 1)).toBe(1);
  expect(await read($atom2, 2)).toBe(2);
  expect(await read($atom2, 3)).toBe(3);

  dispatch($atom2, 1)(8);
  expect(await read($atom2, 1)).toBe(9);
  expect(await read($atom2, 2)).toBe(2);
  expect(await read($atom2, 3)).toBe(3);

  dispatch($atom2, 3)(14);
  expect(await read($atom2, 1)).toBe(9);
  expect(await read($atom2, 2)).toBe(2);
  expect(await read($atom2, 3)).toBe(17);
});

test('hooks must be always called in the same order', async () => {
  let counter1 = 0, counter2 = 0;

  function $atom1() {
    if (++counter1 === 1) {
      const [value, setValue] = atomState(0);
      const ref = atomRef(null);
    } else {
      const ref = atomRef(null);
      const [value, setValue] = atomState(0);
    }
  }

  function* $atom2() {
    yield Promise.resolve();
    if (++counter2 === 1) {
      const [value, setValue] = atomState(0);
      const ref = atomRef(null);
    } else {
      const ref = atomRef(null);
      const [value, setValue] = atomState(0);
    }
  }

  await read($atom2);
  invalidate($atom2);
  await expect(read($atom2)).rejects.toThrowError(HookMismatchAtomError);
});

test('hooks cannot be added in subsequent computations', async () => {
  function $atom1() {
    const [value1, setValue1] = atomState(0);
    atomAction(setValue1, []);

    if (value1 === 8) {
      const [value2, setValue2] = atomState(0);
    }
  }

  function* $atom2() {
    yield Promise.resolve();
    const [value1, setValue1] = atomState(0);
    yield Promise.resolve();
    atomAction(setValue1, []);

    if (value1 === 8) {
      const [value2, setValue2] = atomState(0);
    }
  }

  read($atom1);
  dispatch($atom1)(8);
  expect(() => read($atom1)).toThrowError(HookCountMismatchAtomError);

  await read($atom2);
  dispatch($atom2)(8);
  await expect(read($atom2)).rejects.toThrowError(HookCountMismatchAtomError);
});

test('hooks cannot be removed in subsequent computations', async () => {
  function $atom1() {
    const [value1, setValue1] = atomState(0);
    atomAction(setValue1, []);

    if (value1 === 0) {
      const [value2, setValue2] = atomState(0);
    }
  }

  function* $atom2() {
    yield Promise.resolve(123);
    const [value1, setValue1] = atomState(0);
    yield Promise.resolve();
    yield Promise.resolve();
    atomAction(setValue1, []);

    if (value1 === 0) {
      const [value2, setValue2] = atomState(0);
    }
  }

  read($atom1);
  dispatch($atom1)(8);
  expect(() => read($atom1)).toThrowError(HookCountMismatchAtomError);

  await read($atom2);
  dispatch($atom2)(8);
  await expect(read($atom2)).rejects.toThrowError(HookCountMismatchAtomError);
});

test('hooks cannot be called outside of a computation', () => {
  expect(() => atomRef(null)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => atomState([])).toThrowError(ComputationContextRequiredAtomError);
});
