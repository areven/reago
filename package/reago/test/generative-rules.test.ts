// =============================================================================
// Generative atom rules tests
// =============================================================================

import {invalidate, read} from 'reago';
import {expect, test} from 'vitest';
import {GeneratorPromiseExpectedAtomError} from '~/error';


test('generative atom requires yielded values to be promises', async () => {
  function* $atom1() {
    yield 123;
  }

  function* $atom2() {
    yield $atom1;
  }

  function* $atom3() {
    yield null;
  }

  function* $atom4() {
    yield undefined;
  }

  function* $atom5() {
    yield Promise.resolve(123); // make computation async
    yield {};
  }

  await expect(read($atom1)).rejects.toThrowError(GeneratorPromiseExpectedAtomError);
  await expect(read($atom2)).rejects.toThrowError(GeneratorPromiseExpectedAtomError);
  await expect(read($atom3)).rejects.toThrowError(GeneratorPromiseExpectedAtomError);
  await expect(read($atom4)).rejects.toThrowError(GeneratorPromiseExpectedAtomError);
  await expect(read($atom5)).rejects.toThrowError(GeneratorPromiseExpectedAtomError);
});

test('generative atom will receive results from yielded promises', async () => {
  function* $atom() {
    let val: number;
    try {
      val = yield Promise.resolve(123);
    } catch (err) {
      val = 0;
    }
    return val;
  }

  await expect(read($atom)).resolves.toBe(123);
});

test('generative atom will cache results from yielded promises', async () => {
  const resolved = Promise.resolve(123);
  let counter = 0;

  function* $atom() {
    const value: number = yield resolved;
    ++counter;
    return value;
  }

  // first run will have to wait for `resolved` to return
  const promise = read($atom);
  expect(counter).toBe(0);
  await expect(promise).resolves.toBe(123);

  // second run will compute synchronously
  invalidate($atom);
  read($atom); // no await here!
  expect(counter).toBe(2);
});

test('generative atom will receive exceptions thrown by yielded promises', async () => {
  function* $atom() {
    try {
      yield Promise.reject();
    } catch (err) {
      return true;
    }
    return false;
  }

  await expect(read($atom)).resolves.toBeTruthy();
});

test('generative atom will cache exceptions thrown by yielded promises', async () => {
  const rejected = Promise.reject();
  let counter = 0;

  function* $atom() {
    try {
      yield rejected;
    } catch (err) {
      ++counter;
      return true;
    }
    return false;
  }

  // first run will have to wait for `rejected` to throw
  const promise = read($atom);
  expect(counter).toBe(0);
  await promise;

  // second run will compute synchronously
  invalidate($atom);
  read($atom); // no await here!
  expect(counter).toBe(2);
});

test('generative atom will run the `try .. finally` block for interrupted computations', async () => {
  let beforeYield = false, afterYield = false, cleanup = false, killed = false;;

  function* $atom() {
    if (killed) {
      return 123;
    }

    try {
      beforeYield = true;
      yield Promise.resolve();
      afterYield = true;
    } finally {
      cleanup = true;
      throw new Error('this error will be swallowed as it is not relevant');
    }
  }

  // run everything up to the first yield
  const promise = read($atom);
  expect(beforeYield).toBeTruthy();
  expect(afterYield).toBeFalsy();
  expect(cleanup).toBeFalsy();

  // we kill the computation and start a new one
  killed = true;
  invalidate($atom);
  await promise;
  expect(beforeYield).toBeTruthy();
  expect(afterYield).toBeFalsy();
  expect(cleanup).toBeTruthy();
});

test('generative atom will ignore errors thrown from interrupted computations', async () => {
  let killed = false;

  function* $atom() {
    yield Promise.resolve();
    if (!killed) {
      throw new Error('will be ignored')
    } else {
      return 123;
    }
  }

  // run everything up to the first yield
  const promise = read($atom);

  // kill the computation and start a new one
  killed = true;
  invalidate($atom);
  await expect(promise).resolves.toBe(123);
});
