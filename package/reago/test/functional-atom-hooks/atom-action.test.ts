// =============================================================================
// atomAction functional atom tests
// =============================================================================

import {atomAction, atomMemo, atomRef, atomState, dispatch, invalidate, read} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError} from '~/error';


test('atomAction handler runs when dispatch() is invoked', () => {
  let value = 0;

  function $atom() {
    atomAction(() => {
      value = 123;
    }, []);
  }

  dispatch($atom)();
  expect(value).toBe(123);
});

test('atomAction handler runs exactly once per dispatch', () => {
  let counter = 0;

  function $atom() {
    atomAction(() => {
      counter++;
    }, []);
  }

  dispatch($atom)();
  dispatch($atom)();
  dispatch($atom)();
  expect(counter).toBe(3);
});

test('atomAction handlers run in the order they were defined', () => {
  let order: number[] = [];

  function $atom() {
    atomAction(() => {
      order.push(1);
    }, []);

    atomAction(() => {
      order.push(2);
    }, []);

    atomAction(() => {
      order.push(3);
    }, []);
  }

  dispatch($atom)();
  expect(order).toEqual([1, 2, 3]);
});

test('atomAction handlers are computed for new atoms', () => {
  let counter = 0;

  function $atom() {
    counter++;
    atomAction(() => {}, []);
  }

  dispatch($atom)();
  expect(counter).toBe(1);
});

test('atomAction handlers are recomputed if atom is invalidated', () => {
  let counter = 0;

  function $atom() {
    counter++;
    atomAction(() => {}, []);
  }

  read($atom);
  invalidate($atom);
  dispatch($atom)();
  expect(counter).toBe(2);
});

test('atomAction reuses the handler from first computation if dependencies were not changed', () => {
  let counter = 0;
  let wrongHandler = false;

  function $atom() {
    counter++;
    atomAction(
      counter === 1 ? () => {} : () => {
        wrongHandler = true;
      },
      [123, true, 'asd']
    );
  }

  read($atom);
  invalidate($atom);
  read($atom);
  dispatch($atom)();
  expect(wrongHandler).toBeFalsy();
});

test('atomAction updates the stored handler if dependencies were changed', () => {
  let results: number[] = [];

  function $atom() {
    const [value, setValue] = atomState(8);

    atomAction(() => {
      results.push(value);
      setValue(x => x + 1);
    }, [value]);
  }

  dispatch($atom)();
  expect(results).toEqual([8]);

  dispatch($atom)();
  expect(results).toEqual([8, 9]);

  dispatch($atom)();
  expect(results).toEqual([8, 9, 10]);
});

test('atomAction does a shallow comparison of dependencies', () => {
  let counter = 0;
  let results: number[] = [];

  function $atom() {
    let currentCounter = ++counter;

    atomAction(
      () => {
        results.push(currentCounter);
      },
      [{key: 123}]
    );

    atomAction(
      () => {
        results.push(currentCounter);
      },
      [[true]]
    );
  }

  read($atom);
  invalidate($atom);
  dispatch($atom)();
  expect(results).toEqual([2, 2]);
});

test('atomAction does not make a copy of the dependency array to use for comparison', () => {
  let counter = 0;
  let deps = [123];
  let wrongHandler = false;

  function $atom() {
    counter++;
    atomAction(
      counter === 1 ? () => {} : () => {
        wrongHandler = true;
      },
      deps
    );
  }

  read($atom);
  dispatch($atom)();
  expect(wrongHandler).toBeFalsy();

  deps[0] = 456; // we're modifying the deps associated with computed value
  invalidate($atom);
  dispatch($atom)();
  expect(wrongHandler).toBeFalsy();
});

test('atomAction discards handlers that appeared in an older computation but are now unreachable', () => {
  let throwError = false;
  let results: number[] = [];

  function $atom() {
    atomAction(() => {
      results.push(1);
    }, []);

    if (throwError) {
      throw new Error('something went wrong');
    }

    atomAction(() => {
      results.push(2);
    }, []);
  }

  // store both handlers in the internal stack
  read($atom);

  // now only the first handler is reachable
  throwError = true;
  invalidate($atom);

  // dispatch should run only the first handler
  dispatch($atom)();
  expect(results).toEqual([1]);
});

test('atomAction can be called multiple times with the same function', () => {
  let counter = 0;

  function $atom() {
    const fn = () => {
      ++counter;
    };

    atomAction(fn, []);
    atomAction(fn, []);
    atomAction(fn, []);
  }

  dispatch($atom)();
  expect(counter).toBe(3);
});

test('atomAction cannot be called outside of a computation', () => {
  expect(() => atomAction(() => {}, [])).toThrowError(ComputationContextRequiredAtomError);
});

test('atomAction does not allow running hooks inside its handler', () => {
  let err1, err2, err3;

  function $atom1() {
    atomAction(() => {
      try {
        atomMemo(() => 123, []);
      } catch (err) {
        err1 = err;
      }
    }, []);
  }

  function $atom2() {
    atomAction(() => {
      try {
        atomRef(123);
      } catch (err) {
        err2 = err;
      }
    }, []);
  }

  function $atom3() {
    atomAction(() => {
      try {
        atomAction(() => {}, []);
      } catch (err) {
        err3 = err;
      }
    }, []);
  }

  dispatch($atom1)();
  expect(err1).toBeInstanceOf(ComputationContextRequiredAtomError);

  dispatch($atom2)();
  expect(err2).toBeInstanceOf(ComputationContextRequiredAtomError);

  dispatch($atom3)();
  expect(err3).toBeInstanceOf(ComputationContextRequiredAtomError);
});
