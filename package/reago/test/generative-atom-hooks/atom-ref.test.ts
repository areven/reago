// =============================================================================
// atomRef generative atom tests
// =============================================================================

import {atomAction, atomRef, dispatch, invalidate, read} from 'reago';
import {expect, test} from 'vitest';


test('atomRef stores the initial value on first computation', async () => {
  let value = 123;

  function* $atom() {
    yield Promise.resolve(123);
    const ref = atomRef(value++);
    yield Promise.resolve(456);
    return ref.current;
  }

  await expect(read($atom)).resolves.toBe(123);
  await expect(read($atom)).resolves.toBe(123);
  invalidate($atom);
  await expect(read($atom)).resolves.toBe(123);
});

test('atomRef always returns the same AtomRef object', async () => {
  function* $atom() {
    const ref = atomRef<number | null>(123);
    yield Promise.resolve(null);
    return ref;
  }

  const ref = await read($atom);
  await expect(read($atom)).resolves.toBe(ref);
  invalidate($atom);
  await expect(read($atom)).resolves.toBe(ref);
  ref.current = null;
  invalidate($atom);
  await expect(read($atom)).resolves.toBe(ref);
});

test('atomRef supports storing primitive types', async () => {
  const $number = function* () {
    return atomRef(123).current;
  };

  const $string = function* () {
    return atomRef('value').current;
  };

  const $true = function* () {
    return atomRef(true).current;
  };

  const $false = function* () {
    return atomRef(false).current;
  };

  const $undefined = function* () {
    return atomRef(undefined).current;
  };

  const $null = function* () {
    return atomRef(null).current;
  };

  const $symbolIterator = function* () {
    return atomRef(Symbol.iterator).current;
  };

  await expect(read($number)).resolves.toBe(123);
  await expect(read($string)).resolves.toBe('value');
  await expect(read($true)).resolves.toBe(true);
  await expect(read($false)).resolves.toBe(false);
  await expect(read($undefined)).resolves.toBe(undefined);
  await expect(read($null)).resolves.toBe(null);
  await expect(read($symbolIterator)).resolves.toBe(Symbol.iterator);
});

test('atomRef supports storing objects', async () => {
  const object = {key: 'value'};
  const $object = function* () {
    return atomRef(object).current;
  };
  await expect(read($object)).resolves.toBe(object);
});

test('atomRef supports storing arrays', async () => {
  const array = [1, 2, 3];
  const $array = function* () {
    yield Promise.resolve(undefined);
    return atomRef(array).current;
  };
  await expect(read($array)).resolves.toBe(array);
});

test('atomRef supports storing functions', async () => {
  const fn = () => 123;
  const $fn = function* () {
    return atomRef(fn).current;
  };
  await expect(read($fn)).resolves.toBe(fn);
});

test('atomRef supports storing promises', async () => {
  const promise = Promise.resolve(123);
  let value;
  const $fn = function* () {
    value = atomRef(promise).current;
    return value;
  };
  await expect(read($fn)).resolves.toBe(123);
  expect(value).toBe(promise);
});

test('atomRef can be used multiple times within an atom', async () => {
  let value1 = 123, value2 = 456;

  function* $atom(family: number) {
    const ref1 = atomRef(value1++);
    yield Promise.resolve(8);
    const ref2 = atomRef(value2++);
    return ref1.current + ref2.current;
  }

  await expect(read($atom, 5)).resolves.toBe(123 + 456);
  await expect(read($atom, 5)).resolves.toBe(123 + 456);
  invalidate($atom, 5);
  await expect(read($atom, 5)).resolves.toBe(123 + 456);
});

test('atomRef does not trigger recomputation if its value changes', async () => {
  let computeCount = 0;

  function* $atom() {
    ++computeCount;
    yield Promise.resolve(computeCount);
    const ref = atomRef(123);

    atomAction(() => {
      ref.current = 456;
    }, []);

    return ref.current;
  }

  await expect(read($atom)).resolves.toBe(123);
  expect(computeCount).toBe(1);

  dispatch($atom)();
  await expect(read($atom)).resolves.toBe(123);
  expect(computeCount).toBe(1);

  invalidate($atom);
  await expect(read($atom)).resolves.toBe(456);
  expect(computeCount).toBe(2);
});
