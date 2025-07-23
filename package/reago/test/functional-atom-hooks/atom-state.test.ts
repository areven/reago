// =============================================================================
// atomState functional atom tests
// =============================================================================

import {
  atomAction, atomMemo, atomRef, atomState, dispatch, invalidate, read
} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError} from '~/error';
import type {AtomState} from 'reago';


test('atomState stores the initial fixed value on first computation', () => {
  let counter = 0;
  function $atom(): number {
    const [obj, setObj] = atomState<{value: number}>({value: ++counter});
    return obj.value;
  }

  expect(read($atom)).toBe(1);
  expect(read($atom)).toBe(1);

  invalidate($atom);
  expect(read($atom)).toBe(1);
});

test('atomState stores the initial lazy value on first computation', () => {
  let counter = 0;
  function $atom(): number {
    const [obj, setObj] = atomState<{value: number}>(() => ({value: ++counter}));
    return obj.value;
  }

  expect(read($atom)).toBe(1);
  expect(read($atom)).toBe(1);

  invalidate($atom);
  expect(read($atom)).toBe(1);
});

test('atomState supports storing primitive types', () => {
  const $number = () => atomState(123)[0];
  const $string = () => atomState('value')[0];
  const $true = () => atomState(true)[0];
  const $false = () => atomState(false)[0];
  const $undefined = () => atomState(undefined)[0];
  const $null = () => atomState(null)[0];
  const $symbolIterator = () => atomState(Symbol.iterator)[0];

  expect(read($number)).toBe(123);
  expect(read($string)).toBe('value');
  expect(read($true)).toBe(true);
  expect(read($false)).toBe(false);
  expect(read($undefined as any)).toBe(undefined);
  expect(read($null)).toBe(null);
  expect(read($symbolIterator)).toBe(Symbol.iterator);
});

test('atomState supports storing objects', () => {
  const object = {key: 'value'};
  const $object = () => atomState(object)[0];
  expect(read($object)).toBe(object);
});

test('atomState supports storing arrays', () => {
  const array = [1, 2, 3];
  const $array = () => atomState(array)[0];
  expect(read($array)).toBe(array);
});

test('atomState supports storing functions through a lazy initializer', () => {
  const fn = () => 123;
  const $fn = () => atomState(() => fn)[0];
  expect(read($fn)).toBe(fn);
});

test('atomState supports storing promises', () => {
  const promise = Promise.resolve(123);
  const $fn = () => atomState(promise)[0];
  expect(read($fn)).toBe(promise);
});

test('atomState can be used multiple times within an atom', () => {
  function $atom(): number {
    const [obj1, setObj1] = atomState(123);
    const [obj2, setObj2] = atomState({value: 456});
    return obj1 + obj2.value;
  }

  expect(read($atom)).toBe(579);
});

test('atomState returns the same AtomState array if value has not changed', () => {
  function $atom() {
    const state: AtomState<number> = atomState(123);
    return state;
  }

  const state = read($atom);
  expect(read($atom)).toBe(state);
  invalidate($atom);
  expect(read($atom)).toBe(state);
});

test('atomState returns a different AtomState array if value has changed', () => {
  function $atom() {
    const state: AtomState<number> = atomState(123);

    atomAction((newValue: number) => {
      state[1](newValue);
    }, [state]);

    return state;
  }

  const state1 = read($atom);
  expect(read($atom)).toBe(state1);
  dispatch($atom)(456);
  const state2 = read($atom);
  expect(state2).not.toBe(state1);
  expect(read($atom)).toBe(state2);
});

test('atomState always returns the same setter method', () => {
  function $atom() {
    const [value, setValue] = atomState(true);

    atomAction((newValue: boolean) => {
      setValue(newValue);
    }, []);

    return setValue;
  }

  const setter = read($atom);
  expect(setter).toBe(read($atom));

  invalidate($atom);
  expect(setter).toBe(read($atom));

  dispatch($atom)(false);
  expect(setter).toBe(read($atom));
});

test('atomState setter updates the stored value', () => {
  function $atom() {
    const [value, setValue] = atomState<null | number>(null);
    atomAction(setValue, []);
    return value;
  }
  expect(read($atom)).toBe(null);
  dispatch($atom)(69);
  expect(read($atom)).toBe(69);
});

test('atomState setter can compute new value from the previous one if provided a function', () => {
  function $atom() {
    const [value, setValue] = atomState<number>(1);
    atomAction(() => {
      setValue(x => x + 1);
    }, []);
    return value;
  }
  expect(read($atom)).toBe(1);
  dispatch($atom)(1);
  expect(read($atom)).toBe(2);
  dispatch($atom)(1);
  expect(read($atom)).toBe(3);
  expect(read($atom)).toBe(3);
});

test('atomState triggers a recomputation if value changed', () => {
  let counter = 0;

  function $atom() {
    counter++;
    const [value, setValue] = atomState(8);
    atomAction(setValue, []);
    return value;
  }

  read($atom);
  read($atom);
  expect(counter).toBe(1);

  dispatch($atom)(13);
  read($atom);
  expect(counter).toBe(2);

  dispatch($atom)(18);
  read($atom);
  read($atom);
  expect(counter).toBe(3);
});

test('atomState triggers multiple recomputations for multiple subsequent dispatch calls', () => {
  let counter = 0;

  function $atom() {
    counter++;
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
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

test('atomState triggers a recomputation if value changed, even if it is deep equal', () => {
  let counter = 0;

  function $atom() {
    counter++;
    const [value, setValue] = atomState({x: 1});
    atomAction(setValue, []);
    return value;
  }

  read($atom);
  expect(counter).toBe(1);

  read($atom);
  expect(counter).toBe(1);

  dispatch($atom)({x: 1});
  read($atom);
  expect(counter).toBe(2);
});

test('atomState does not trigger a recomputation if setter receives the same value as the current one', () => {
  let counter = 0;

  function $atom() {
    counter++;
    const [value, setValue] = atomState(13);

    atomAction(() => {
      setValue(8);
    }, []);

    return value;
  }

  expect(read($atom)).toBe(13);
  expect(counter).toBe(1);

  dispatch($atom)();
  expect(read($atom)).toBe(8);
  expect(counter).toBe(2);

  dispatch($atom)();
  expect(read($atom)).toBe(8);
  expect(counter).toBe(2);

  dispatch($atom)();
  expect(read($atom)).toBe(8);
  expect(read($atom)).toBe(8);
  expect(counter).toBe(2);
});

test('atomState batches state updates from multiple setters', () => {
  let counter = 0;

  function $atom() {
    counter++;

    const [value1, setValue1] = atomState(true);
    const [value2, setValue2] = atomState({x: 2});
    const [value3, setValue3] = atomState('potato');

    atomAction(() => {
      setValue1(false);
      setValue2({x: 3});
    }, []);

    atomAction(() => {
      setValue3('tomato');
      setValue3('');
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

test('atomState rethrows errors thrown by initializer', () => {
  function $atom() {
    atomState(() => {
      throw new Error('error');
    });
  }

  expect(() => read($atom)).toThrowError('error');
});

test('atomState cannot be called outside of a computation', () => {
  expect(() => atomState(123)).toThrowError(ComputationContextRequiredAtomError);
});

test('atomState does not allow running hooks inside its initializer', () => {
  function $atom1() {
    atomState(() => {
      atomState({});
    });
  }

  function $atom2() {
    atomState(() => {
      atomMemo(() => 123, []);
    });
  }

  function $atom3() {
    atomState(() => {
      atomRef(123);
    });
  }

  function $atom4() {
    atomState(() => {
      atomAction(() => {}, []);
    });
  }

  expect(() => read($atom1)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom2)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom3)).toThrowError(ComputationContextRequiredAtomError);
  expect(() => read($atom4)).toThrowError(ComputationContextRequiredAtomError);
});
