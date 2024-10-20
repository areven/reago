// =============================================================================
// atomReducer functional atom tests
// =============================================================================

import {
  atomAction, atomMemo, atomReducer, atomRef, atomState, dispatch, invalidate, read, type AtomReducer
} from 'reago';
import {expect, expectTypeOf, test} from 'vitest';
import {ComputationContextRequiredAtomError} from '~/error';


test('atomReducer stores the initial value on first computation', () => {
  function $atom(): number {
    const [value, reduce] = atomReducer(x => x + 1, 1);
    return value;
  }

  expect(read($atom)).toBe(1);
  expect(read($atom)).toBe(1);

  invalidate($atom);
  expect(read($atom)).toBe(1);
});

test('atomReducer applies the initializer function if provided', () => {
  function $atom(): number {
    const [value, reduce] = atomReducer(x => x + 1, 5, x => x * 2);
    return value;
  }

  expect(read($atom)).toBe(10);
  expect(read($atom)).toBe(10);

  invalidate($atom);
  expect(read($atom)).toBe(10);
});

test('atomReducer supports storing primitive types', () => {
  const $number = () => atomReducer(x => x, 123)[0];
  const $string = () => atomReducer(x => x, 'value')[0];
  const $true = () => atomReducer(x => x, true)[0];
  const $false = () => atomReducer(x => x, false)[0];
  const $undefined = () => atomReducer(x => x, undefined)[0];
  const $null = () => atomReducer(x => x, null)[0];
  const $symbol = () => atomReducer(x => x, Symbol())[0];

  expect(read($number)).toBe(123);
  expect(read($string)).toBe('value');
  expect(read($true)).toBe(true);
  expect(read($false)).toBe(false);
  expect(read($undefined)).toBe(undefined);
  expect(read($null)).toBe(null);
  expectTypeOf(read($symbol)).toBeSymbol();
});

test('atomReducer supports storing objects', () => {
  const object = {key: 'value'};
  const $object = () => atomReducer(x => x, object)[0];
  expect(read($object)).toBe(object);
});

test('atomReducer supports storing arrays', () => {
  const array = [1, 2, 3];
  const $array = () => atomReducer(x => x, array)[0];
  expect(read($array)).toBe(array);
});

test('atomReducer supports storing functions', () => {
  const fn = () => 123;
  const $fn = () => atomReducer(x => x, fn)[0];
  expect(read($fn)).toBe(fn);
});

test('atomReducer supports storing promises', () => {
  const promise = Promise.resolve(123);
  const $fn = () => atomReducer(x => x, promise)[0];
  expect(read($fn)).toBe(promise);
});

test('atomReducer can be used multiple times within an atom', () => {
  function $atom(): number {
    const [val1, inc1] = atomReducer(x => x + 1, 123);
    const [val2, inc2] = atomReducer(x => ({value: x.value + 1}), {value: 456});
    atomAction(() => {
      inc1();
      inc2();
    }, []);
    return val1 + val2.value;
  };

  expect(read($atom)).toBe(579);
  expect(read($atom)).toBe(579);
  dispatch($atom)();
  expect(read($atom)).toBe(581);
  expect(read($atom)).toBe(581);
});

test('atomReducer returns the same AtomReducer array if value has not changed', () => {
  function $atom() {
    const reducer: AtomReducer<number> = atomReducer(x => x + 1, 123);
    return reducer;
  }

  const reducer = read($atom);
  expect(read($atom)).toBe(reducer);
  invalidate($atom);
  expect(read($atom)).toBe(reducer);
});

test('atomReducer returns a different AtomReducer array if value has changed', () => {
  function $atom() {
    const reducer: AtomReducer<number> = atomReducer(x => x + 1, 8);

    atomAction(() => {
      reducer[1]();
    }, [reducer]);

    return reducer;
  }

  const reducer1 = read($atom);
  expect(read($atom)).toBe(reducer1);
  dispatch($atom)();
  const reducer2 = read($atom);
  expect(reducer2).not.toBe(reducer1);
  expect(read($atom)).toBe(reducer2);
});

test('atomReducer always returns the same reducer method', () => {
  function $atom() {
    const [value, reduce] = atomReducer(x => !x, true);

    atomAction(() => {
      reduce();
    }, []);

    return reduce;
  }

  const reducer = read($atom);
  expect(reducer).toBe(read($atom));

  invalidate($atom);
  expect(reducer).toBe(read($atom));

  dispatch($atom)();
  expect(reducer).toBe(read($atom));
});

test('atomReducer dispatcher optionally accepts extra arguments', () => {
  function $atom() {
    const [value, mutate] = atomReducer<number, [string, number]>((prev: number, action: string, diff: number) => {
      if (action === 'inc') {
        return prev + diff;
      } else {
        return prev - diff;
      }
    }, 10);
    atomAction(mutate, []);
    return value;
  }
  expect(read($atom)).toBe(10);
  dispatch($atom)('inc', 1);
  expect(read($atom)).toBe(11);
  dispatch($atom)('inc', 1);
  expect(read($atom)).toBe(12);
  dispatch($atom)('dec', 4);
  expect(read($atom)).toBe(8);
});

test('atomReducer triggers a recomputation if value changed', () => {
  let counter = 0;

  function $atom() {
    counter++;
    const [value, mutate] = atomReducer(x => x + 1, 8, x => x);
    atomAction(() => mutate(), []);
    return value;
  }

  read($atom);
  read($atom);
  expect(counter).toBe(1);

  dispatch($atom)();
  read($atom);
  expect(counter).toBe(2);

  dispatch($atom)();
  read($atom);
  read($atom);
  expect(counter).toBe(3);
});

test('atomReducer triggers multiple recomputations for multiple subsequent dispatch calls', () => {
  let counter = 0;

  function $atom() {
    counter++;
    const [value, mutate] = atomReducer(x => x + 1, 0);
    atomAction(() => mutate(), []);
    return value;
  }

  // runs first computation because we need the actions stack
  dispatch($atom)(1);

  // previous action changed the state, so this dispatch will trigger another
  // computation to resync the actions stack
  dispatch($atom)(2);

  // these will trigger computations too, despite the fact we're not reading the
  // atom value explicitly
  dispatch($atom)(3);
  dispatch($atom)(4);
  dispatch($atom)(5);
  expect(counter).toBe(5);
});

test('atomReducer triggers a recomputation if value changed, even if it is deep equal', () => {
  let counter = 0;

  function $atom() {
    counter++;
    const [value, mutate] = atomReducer(obj => ({...obj}), {x: 1});
    atomAction(() => mutate(), []);
    return value;
  }

  read($atom);
  expect(counter).toBe(1);

  read($atom);
  expect(counter).toBe(1);

  dispatch($atom)();
  read($atom);
  expect(counter).toBe(2);
});

test('atomReducer skips recomputation if new value is the same as previous one', () => {
  let counter = 0;

  function $atom() {
    ++counter;
    const [value, reduce] = atomReducer(x => x, 123);
    atomAction(() => reduce(), []);
    return value;
  }

  expect(read($atom)).toBe(123);
  expect(counter).toBe(1);

  dispatch($atom)();
  expect(read($atom)).toBe(123);
  expect(counter).toBe(1);
});

test('atomReducer batches multiple subsequent reduce calls', () => {
  let counter = 0;

  function $atom() {
    counter++;

    const [value1, inc1] = atomReducer(x => x + 1, 1);
    const [value2, inc2] = atomReducer(obj => ({x: obj.x + 1}), {x: 2});

    atomAction(() => {
      inc1();
      inc1();
      inc2();
    }, []);

    atomAction(() => {
      inc2();
    }, []);

    return Math.random();
  }

  read($atom);
  read($atom);
  expect(counter).toBe(1);

  dispatch($atom)();
  expect(counter).toBe(1);

  read($atom);
  read($atom);
  expect(counter).toBe(2);
});

test('atomReducer rethrows errors thrown by initializer', () => {
  function $atom() {
    atomReducer(x => x, 1, (x) => {
      throw new Error('error');
    });
  }

  expect(() => read($atom)).toThrowError('error');
});

test('atomReducer cannot be called outside of a computation', () => {
  expect(() => atomReducer(x => x - 1, 123)).toThrowError(ComputationContextRequiredAtomError);
});

test('atomReducer does not allow running hooks inside its initializer', () => {
  function $atom1() {
    atomReducer(x => x + 1, 1, (x) => {
      atomState({});
      return x;
    });
  }

  function $atom2() {
    atomReducer(x => x + 1, 1, (x) => {
      atomMemo(() => 123, []);
      return x;
    });
  }

  function $atom3() {
    atomReducer(x => x + 1, 1, (x) => {
      atomRef(123);
      return x;
    });
  }

  function $atom4() {
    atomReducer(x => x + 1, 1, (x) => {
      atomAction(() => {}, []);
      return x;
    });
  }

  expect(() => read($atom1)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom2)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom3)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom4)).toThrowError(ComputationContextRequiredAtomError);
});
