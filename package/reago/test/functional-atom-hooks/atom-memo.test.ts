// =============================================================================
// atomMemo functional atom tests
// =============================================================================

import {atomAction, atomMemo, atomRef, invalidate, read} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError} from '~/error';


test('atomMemo returns the value returned by initializer', () => {
  function $atom() {
    return atomMemo<number>(() => 123, []);
  }

  expect(read($atom)).toBe(123);
});

test('atomMemo supports returning primitive types', () => {
  const $number = () => atomMemo(() => 123, []);
  const $string = () => atomMemo(() => 'value', []);
  const $true = () => atomMemo(() => true, []);
  const $false = () => atomMemo(() => false, []);
  const $undefined = () => atomMemo(() => undefined, []);
  const $null = () => atomMemo(() => null, []);
  const $symbolIterator = () => atomMemo(() => Symbol.iterator, []);

  expect(read($number)).toBe(123);
  expect(read($string)).toBe('value');
  expect(read($true)).toBe(true);
  expect(read($false)).toBe(false);
  expect(read($undefined)).toBe(undefined);
  expect(read($null)).toBe(null);
  expect(read($symbolIterator)).toBe(Symbol.iterator);
});

test('atomMemo supports returning objects', () => {
  const object = {key: 'value'};
  const $object = () => atomMemo(() => object, []);
  expect(read($object)).toBe(object);
});

test('atomMemo supports returning arrays', () => {
  const array = [1, 2, 3];
  const $array = () => atomMemo(() => array, []);
  expect(read($array)).toBe(array);
});

test('atomMemo supports returning functions', () => {
  const fn = () => 123;
  const $fn = () => atomMemo(() => fn, []);
  expect(read($fn)).toBe(fn);
});

test('atomMemo supports returning promises directly', () => {
  const promise = Promise.resolve(123);
  const $fn = () => atomMemo(() => promise, []);
  expect(read($fn)).toBe(promise);
});

test('atomMemo does not recompute memoized value if dependencies are unchanged', () => {
  let computeCounter = 0, memoCounter = 0;

  function $atom() {
    ++computeCounter;
    return atomMemo(() => {
      memoCounter++;
      return 'value';
    }, []);
  }

  expect(read($atom)).toBe('value');
  expect(read($atom)).toBe('value');
  expect(computeCounter).toBe(1);
  expect(memoCounter).toBe(1);

  invalidate($atom);
  expect(read($atom)).toBe('value');
  expect(read($atom)).toBe('value');
  expect(computeCounter).toBe(2);
  expect(memoCounter).toBe(1);

  invalidate($atom);
  expect(read($atom)).toBe('value');
  expect(computeCounter).toBe(3);
  expect(memoCounter).toBe(1);
});

test('atomMemo recomputes memoized value if dependencies have changed', () => {
  let counter = 0;
  let deps = [123, 'value', null];

  function $atom() {
    return atomMemo(() => {
      counter++;
      return true;
    }, [...deps]);
  }

  read($atom);
  read($atom);
  expect(counter).toBe(1);

  invalidate($atom);
  read($atom);
  read($atom);
  expect(counter).toBe(1);

  deps[0] = 456;
  read($atom);
  read($atom);
  expect(counter).toBe(1);

  invalidate($atom);
  read($atom);
  read($atom);
  expect(counter).toBe(2);
});

test('atomMemo does a shallow comparison of dependencies', () => {
  let counter1 = 0, counter2 = 0;

  function $atom1() {
    return atomMemo(() => {
      return ++counter1;
    }, [{key: 'value'}]);
  }

  function $atom2() {
    return atomMemo(() => {
      return ++counter2;
    }, [[1]]);
  }

  expect(read($atom1)).toBe(1);
  expect(read($atom1)).toBe(1);
  expect(read($atom2)).toBe(1);
  expect(read($atom2)).toBe(1);

  invalidate($atom1);
  invalidate($atom2);

  expect(read($atom1)).toBe(2);
  expect(read($atom1)).toBe(2);
  expect(read($atom2)).toBe(2);
  expect(read($atom2)).toBe(2);
});

test('atomMemo does not make a copy of the dependency array to use for comparison', () => {
  let counter = 0;
  let deps = [123];

  function $atom() {
    return atomMemo(() => {
      return ++counter;
    }, deps);
  }

  expect(read($atom)).toBe(1);
  expect(read($atom)).toBe(1);

  deps[0] = 456; // we're modifying the deps associated with computed value
  invalidate($atom);
  expect(read($atom)).toBe(1); // no update is triggered since it's the same deps array
});

test('atomMemo rethrows errors thrown by initializer', () => {
  function $atom() {
    return atomMemo(() => {
      throw new Error('error');
    }, []);
  }

  expect(() => read($atom)).toThrowError('error');
});

test('atomMemo memoizes errors thrown by initializer', () => {
  let throwError = true;
  let deps = [true];

  function $atom() {
    return atomMemo(() => {
      if (throwError) {
        throw new Error('error');
      } else {
        return 123;
      }
    }, [...deps]);
  }

  expect(() => read($atom)).toThrowError('error');
  expect(() => read($atom)).toThrowError('error');

  throwError = false;
  invalidate($atom);
  expect(() => read($atom)).toThrowError('error');

  deps[0] = false;
  invalidate($atom);
  expect(read($atom)).toBe(123);
});

test('atomMemo cannot be called outside of a computation', () => {
  expect(() => atomMemo(() => 123, [])).toThrowError(ComputationContextRequiredAtomError);
});

test('atomMemo does not allow running hooks inside its initializer', () => {
  function $atom1() {
    atomMemo(() => {
      atomMemo(() => 123, []);
    }, []);
  }

  function $atom2() {
    atomMemo(() => {
      atomRef(123);
    }, []);
  }

  function $atom3() {
    atomMemo(() => {
      atomAction(() => {}, []);
    }, []);
  }

  expect(() => read($atom1)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom2)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom3)).toThrowError(ComputationContextRequiredAtomError);
});
