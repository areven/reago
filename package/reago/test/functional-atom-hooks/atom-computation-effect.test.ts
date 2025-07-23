// =============================================================================
// atomComputationEffect functional atom tests
// =============================================================================

import LeakDetector from 'jest-leak-detector';
import {atomAction, atomComputationEffect, atomMemo, atomRef, invalidate, read, watch, type Atom} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError, InvalidCleanupFunctionAtomError} from '~/error';


test('atomComputationEffect handler without specified dependencies runs on every computation', () => {
  let counter = 0;

  function $atom() {
    atomComputationEffect(() => {
      ++counter;
    });
  }

  read($atom);
  expect(counter).toBe(1);

  read($atom);
  expect(counter).toBe(1);

  invalidate($atom);
  read($atom);
  expect(counter).toBe(2);

  invalidate($atom);
  invalidate($atom);
  read($atom);
  expect(counter).toBe(3);
});

test('atomComputationEffect handler with an empty dependency array runs only on first computation', () => {
  let counter = 0;

  function $atom() {
    atomComputationEffect(() => {
      ++counter;
    }, []);
  }

  read($atom);
  expect(counter).toBe(1);

  read($atom);
  expect(counter).toBe(1);

  invalidate($atom);
  read($atom);
  expect(counter).toBe(1);

  invalidate($atom);
  invalidate($atom);
  read($atom);
  expect(counter).toBe(1);

  invalidate($atom);
  using watcher = watch($atom, () => {});
  expect(counter).toBe(1);
});

test('atomComputationEffect handler re-runs when atom is recomputed with changed dependencies', () => {
  let counter = 0, increaseBy = 1;

  function $atom() {
    atomComputationEffect(() => {
      counter += increaseBy;
    }, [increaseBy]);
  }

  read($atom);
  expect(counter).toBe(1);

  invalidate($atom);
  read($atom);
  expect(counter).toBe(1);

  increaseBy = 7;
  invalidate($atom);
  read($atom);
  expect(counter).toBe(8);
});

test('atomComputationEffect is not immediately recomputed if an unmounted atom is invalidated', () => {
  let counter = 0;
  let recompute = 0;

  function $atom() {
    atomComputationEffect(() => {
      ++counter;
    }, [recompute]);
  }

  // first computation, effect will run
  read($atom);
  expect(counter).toBe(1);

  // we change the deps and invalidate the atom, but it's not recomputed
  // immediately because it's not mounted
  ++recompute;
  invalidate($atom);

  // the effect doesn't run! it's a side effect of a computation, it doesn't
  // trigger a computation on its own
  expect(counter).toBe(1);

  // manually triggering a read will make the new effect run
  read($atom);
  expect(counter).toBe(2);
});

test('atomComputationEffect handler can optionally return a cleanup function', () => {
  let setupCounter = 0, cleanupCounter = 0;
  let recompute = 1;

  function $atom() {
    atomComputationEffect(() => {
      ++setupCounter;
      return () => {
        ++cleanupCounter;
      };
    }, [recompute]);
  }

  read($atom);
  expect(setupCounter).toBe(1);
  expect(cleanupCounter).toBe(0);

  invalidate($atom);
  read($atom);
  expect(setupCounter).toBe(1);
  expect(cleanupCounter).toBe(0);

  ++recompute;
  invalidate($atom);
  read($atom);
  expect(setupCounter).toBe(2);
  expect(cleanupCounter).toBe(1);
});

test('atomComputationEffect cleanup function must be a valid function', () => {
  function $atom() {
    atomComputationEffect(() => {
      return 123 as any;
    }, []);
  }

  expect(() => read($atom)).toThrowError(InvalidCleanupFunctionAtomError);
});

test('atomComputationEffect handlers run and clean in the order atoms are committed', () => {
  const mountOrder: number[] = [], unmountOrder: number[] = [];
  let recompute = 0;

  function $atom1() {
    atomComputationEffect(() => {
      mountOrder.push(1);
      return () => unmountOrder.push(1);
    }, [recompute]);
  }

  function $atom2() {
    read($atom1);
    atomComputationEffect(() => {
      mountOrder.push(2);
      return () => unmountOrder.push(2);
    }, [recompute]);
  }

  function $atom3() {
    atomComputationEffect(() => {
      mountOrder.push(3);
      return () => unmountOrder.push(3);
    }, [recompute]);
    read($atom1);
  }

  function $atom4() {
    atomComputationEffect(() => {
      mountOrder.push(4);
      return () => unmountOrder.push(4);
    }, [recompute]);
    read($atom1);
  }

  function $atom5() {
    read($atom3);
    read($atom4);
    atomComputationEffect(() => {
      mountOrder.push(5);
      return () => unmountOrder.push(5);
    }, [recompute]);
    read($atom2);
  }

  read($atom5);
  expect(mountOrder).toEqual([1, 3, 4, 2, 5]);

  ++recompute;
  invalidate($atom1);
  invalidate($atom2);
  invalidate($atom3);
  invalidate($atom4);
  invalidate($atom5);
  read($atom5);
  expect(unmountOrder).toEqual([1, 3, 4, 2, 5]);
});

test('atomComputationEffect handlers run in the order they appeared in an atom', () => {
  const runOrder: number[] = [];

  function $atom() {
    atomComputationEffect(() => {
      runOrder.push(1);
    }, []);

    atomComputationEffect(() => {
      runOrder.push(2);
    }, []);

    atomComputationEffect(() => {
      runOrder.push(3);
    }, []);
  }

  read($atom);
  expect(runOrder).toEqual([1, 2, 3]);
});

test('atomComputationEffect handlers cleanup in reverse order they appeared in an atom', () => {
  const runOrder: number[] = [];
  let recompute = 0;

  function $atom() {
    atomComputationEffect(() => {
      return () => {
        runOrder.push(1);
      };
    }, [recompute]);

    atomComputationEffect(() => {
      return () => {
        runOrder.push(2);
      };
    }, [recompute]);

    atomComputationEffect(() => {
      return () => {
        runOrder.push(3);
      };
    }, [recompute]);
  }

  read($atom);
  ++recompute;
  invalidate($atom);
  read($atom);
  expect(runOrder).toEqual([3, 2, 1]);
});

test('atomComputationEffect sets up new handlers only after running all cleanup tasks first', () => {
  const deps1 = [0], deps2 = [0], deps3 = [0];
  const order: string[] = [];

  function $atom() {
    atomComputationEffect(() => {
      order.push('mount1');
      return () => order.push('unmount1');
    }, [...deps1]);

    atomComputationEffect(() => {
      order.push('mount2');
      return () => order.push('unmount2');
    }, [...deps2]);

    atomComputationEffect(() => {
      order.push('mount3');
      return () => order.push('unmount3');
    }, [...deps3]);
  }

  read($atom);
  expect(order).toEqual([
    'mount1',
    'mount2',
    'mount3'
  ]);

  deps1[0] = 1;
  deps3[0] = 1;
  order.length = 0;
  invalidate($atom);
  read($atom);
  expect(order).toEqual([
    'unmount3',
    'unmount1',
    'mount1',
    'mount3'
  ]);
});

test('atomComputationEffect does a shallow comparison of dependencies', () => {
  let counter = 0;
  const results: number[] = [];

  function $atom() {
    const currentCounter = ++counter;

    atomComputationEffect(
      () => {
        results.push(currentCounter);
      },
      [{key: 123}]
    );

    atomComputationEffect(
      () => {
        results.push(currentCounter);
      },
      [[true]]
    );
  }

  read($atom);
  expect(results).toEqual([1, 1]);
  invalidate($atom);
  read($atom);
  expect(results).toEqual([1, 1, 2, 2]);
});

test('atomComputationEffect does not make a copy of the dependency array to use for comparison', () => {
  let counter = 0;
  const deps = [123];
  let wrongHandler = false;

  function $atom() {
    counter++;
    atomComputationEffect(
      counter === 1 ? () => {} : () => {
        wrongHandler = true;
      },
      deps
    );
  }

  read($atom);
  expect(wrongHandler).toBeFalsy();

  deps[0] = 456; // we're modifying the deps associated with computed value
  invalidate($atom);
  read($atom);
  expect(wrongHandler).toBeFalsy();
});

test('atomComputationEffect cleans up handlers that appeared in an older computation but are now unreachable', () => {
  let throwError = false;
  const setupOrder: number[] = [];
  const cleanupOrder: number[] = [];

  function $atom() {
    atomComputationEffect(() => {
      setupOrder.push(1);
      return () => {
        cleanupOrder.push(1);
      };
    }, []);

    if (throwError) {
      throw new Error('something went wrong');
    }

    atomComputationEffect(() => {
      setupOrder.push(2);
      return () => {
        cleanupOrder.push(2);
      };
    }, []);
  }

  // setup both handlers
  read($atom);
  expect(setupOrder).toEqual([1, 2]);
  expect(cleanupOrder).toEqual([]);

  // now only the first handler is reachable
  throwError = true;
  invalidate($atom);
  expect(() => read($atom)).toThrow();
  expect(setupOrder).toEqual([1, 2]);
  expect(cleanupOrder).toEqual([2]);
});

test('atomComputationEffect cleans up handlers from atoms that were garbage collected', async () => {
  let cleaned = false;
  let $atom: Atom<void> | undefined = () => {
    atomComputationEffect(() => {
      return () => {
        cleaned = true;
      };
    }, []);
  };
  const detector = createDetector($atom);

  read($atom!);
  $atom = undefined;
  await expect(detector()).resolves.toBe(false);
  expect(cleaned).toBeTruthy();
});

test('atomComputationEffect can be called multiple times with the same function', () => {
  let mountCounter = 0, unmountCounter = 0;

  function $atom() {
    const fn = () => {
      ++mountCounter;
      return () => {
        ++unmountCounter;
      };
    };

    atomComputationEffect(fn);
    atomComputationEffect(fn);
    atomComputationEffect(fn);
  }

  read($atom);
  expect(mountCounter).toBe(3);
  expect(unmountCounter).toBe(0);

  invalidate($atom);
  read($atom);
  expect(mountCounter).toBe(6);
  expect(unmountCounter).toBe(3);
});

test('atomComputationEffect cannot be called outside of a computation', () => {
  expect(() => atomComputationEffect(() => {}, [])).toThrowError(ComputationContextRequiredAtomError);
});

test('atomComputationEffect does not allow running hooks inside its handler', () => {
  let err1, err2, err3;
  let recompute3 = 0;

  function $atom1() {
    atomComputationEffect(() => {
      try {
        atomMemo(() => 123, []);
      } catch (err) {
        err1 = err;
      }
    }, []);
  }

  function $atom2() {
    atomComputationEffect(() => {
      try {
        atomRef(123);
      } catch (err) {
        err2 = err;
      }
    }, []);
  }

  function $atom3() {
    atomComputationEffect(() => {
      return () => { // cleanup
        try {
          atomAction(() => {}, []);
        } catch (err) {
          err3 = err;
        }
      };
    }, [recompute3]);
  }

  read($atom1);
  expect(err1).toBeInstanceOf(ComputationContextRequiredAtomError);

  read($atom2);
  expect(err2).toBeInstanceOf(ComputationContextRequiredAtomError);

  read($atom3);
  ++recompute3;
  invalidate($atom3);
  read($atom3);
  expect(err3).toBeInstanceOf(ComputationContextRequiredAtomError);
});


function createDetector(value: unknown) {
  const detector = new LeakDetector(value);
  return async function () {
    // annoyingly, jest-leak-detector isn't very reliable when it comes to
    // WeakRefs and sometimes it needs this extra push to trigger gc
    await detector.isLeaking();
    await detector.isLeaking();
    await detector.isLeaking();
    await detector.isLeaking();
    return detector.isLeaking();
  };
}
