// =============================================================================
// atomRef functional atom tests
// =============================================================================

import {atomAction, atomRef, dispatch, invalidate, read} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError} from '~/error';


test('atomRef stores the initial value on first computation', () => {
  let value = 123;

  function $atom() {
    const ref = atomRef(value++);
    return ref.current;
  }

  expect(read($atom)).toBe(123);
  expect(read($atom)).toBe(123);
  invalidate($atom);
  expect(read($atom)).toBe(123);
});

test('atomRef always returns the same AtomRef object', () => {
  function $atom() {
    const ref = atomRef<number | null>(123);
    return ref;
  }

  const ref = read($atom);
  expect(read($atom)).toBe(ref);
  invalidate($atom);
  expect(read($atom)).toBe(ref);
  ref.current = null;
  invalidate($atom);
  expect(read($atom)).toBe(ref);
});

test('atomRef supports storing primitive types', () => {
  const $number = () => atomRef(123).current;
  const $string = () => atomRef('value').current;
  const $true = () => atomRef(true).current;
  const $false = () => atomRef(false).current;
  const $undefined = () => atomRef(undefined).current;
  const $null = () => atomRef(null).current;
  const $symbolIterator = () => atomRef(Symbol.iterator).current;

  expect(read($number)).toBe(123);
  expect(read($string)).toBe('value');
  expect(read($true)).toBe(true);
  expect(read($false)).toBe(false);
  expect(read($undefined as any)).toBe(undefined);
  expect(read($null)).toBe(null);
  expect(read($symbolIterator)).toBe(Symbol.iterator);
});

test('atomRef supports storing objects', () => {
  const object = {key: 'value'};
  const $object = () => atomRef(object).current;
  expect(read($object)).toBe(object);
});

test('atomRef supports storing arrays', () => {
  const array = [1, 2, 3];
  const $array = () => atomRef(array).current;
  expect(read($array)).toBe(array);
});

test('atomRef supports storing functions', () => {
  const fn = () => 123;
  const $fn = () => atomRef(fn).current;
  expect(read($fn)).toBe(fn);
});

test('atomRef supports storing promises', () => {
  const promise = Promise.resolve(123);
  const $fn = () => atomRef(promise).current;
  expect(read($fn)).toBe(promise);
});

test('atomRef can be used multiple times within an atom', () => {
  function $atom() {
    const ref1 = atomRef(123);
    const ref2 = atomRef(456);
    return ref1.current + ref2.current;
  }

  expect(read($atom)).toBe(123 + 456);
});

test('atomRef does not trigger recomputation if its value changes', () => {
  let computeCount = 0;

  function $atom() {
    ++computeCount;
    const ref = atomRef(123);

    atomAction(() => {
      ref.current = 456;
    }, []);

    return ref.current;
  }

  expect(read($atom)).toBe(123);
  expect(computeCount).toBe(1);

  dispatch($atom)();
  expect(read($atom)).toBe(123);
  expect(computeCount).toBe(1);

  invalidate($atom);
  expect(read($atom)).toBe(456);
  expect(computeCount).toBe(2);
});

test('atomRef cannot be called outside of a computation', () => {
  expect(() => atomRef(123)).toThrowError(ComputationContextRequiredAtomError);
});
