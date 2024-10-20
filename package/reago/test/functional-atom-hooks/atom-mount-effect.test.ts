// =============================================================================
// atomMountEffect functional atom tests
// =============================================================================

import {atomAction, atomMemo, atomMountEffect, atomRef, atomState, dispatch, invalidate, read, watch} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError, InvalidCleanupFunctionAtomError} from '~/error';


test('atomMountEffect has no effect if atom is not mounted', () => {
  let effectRan = false;

  function $atom() {
    const [value, setValue] = atomState(123);

    atomMountEffect(() => {
      effectRan = true;
    }, []);

    atomAction(setValue, []);

    return value;
  }

  expect(read($atom)).toBe(123);
  expect(read($atom)).toBe(123);
  invalidate($atom);
  expect(read($atom)).toBe(123);
  invalidate($atom);
  expect(read($atom)).toBe(123);
  dispatch($atom)(8);
  expect(read($atom)).toBe(8);
  expect(effectRan).toBeFalsy();
});

test('atomMountEffect handler runs when mounted directly', () => {
  let mountCounter = 0, unmountCounter = 0;

  function $atom() {
    atomMountEffect(() => {
      ++mountCounter;
      return () => {
        ++unmountCounter;
      };
    }, []);
  }

  read($atom);
  expect(mountCounter).toBe(0);
  expect(unmountCounter).toBe(0);

  const watcher1 = watch($atom, () => {});
  expect(mountCounter).toBe(1);
  invalidate($atom);
  read($atom);
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(0);

  watcher1.clear();
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(1);
  invalidate($atom);
  read($atom);
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(1);

  const watcher2 = watch($atom, () => {});
  expect(mountCounter).toBe(2);
  watcher2.clear();
});

test('atomMountEffect handler runs when mounted indirectly', () => {
  let mountCounter = 0, unmountCounter = 0;

  function $atom() {
    atomMountEffect(() => {
      ++mountCounter;
      return () => {
        ++unmountCounter;
      };
    }, []);
  }

  function $atom1() {
    read($atom);
  }

  function $atom2() {
    read($atom);
  }

  read($atom1);
  expect(mountCounter).toBe(0);
  expect(unmountCounter).toBe(0);

  const watcher1 = watch($atom1, () => {});
  expect(mountCounter).toBe(1);
  invalidate($atom1);
  read($atom1);
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(0);

  const watcher2 = watch($atom2, () => {});
  expect(mountCounter).toBe(1);
  invalidate($atom2);
  read($atom2);
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(0);

  watcher1.clear();
  expect(mountCounter).toBe(1);
  invalidate($atom2);
  read($atom2);
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(0);

  watcher2.clear();
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(1);
  invalidate($atom);
  read($atom);
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(1);

  const watcher3 = watch($atom, () => {});
  expect(mountCounter).toBe(2);
  expect(unmountCounter).toBe(1);

  const watcher4 = watch($atom1, () => {});
  expect(mountCounter).toBe(2);
  expect(unmountCounter).toBe(1);

  watcher4.clear();
  expect(mountCounter).toBe(2);
  expect(unmountCounter).toBe(1);

  watcher3.clear();
  expect(mountCounter).toBe(2);
  expect(unmountCounter).toBe(2);
});

test('atomMountEffect handlers run from bottom to top and cleanup in reverse', () => {
  const mountOrder: number[] = [], unmountOrder: number[] = [];

  function $atom1() {
    atomMountEffect(() => {
      mountOrder.push(1);
      return () => unmountOrder.push(1);
    }, []);
  }

  function $atom2() {
    read($atom1);
    atomMountEffect(() => {
      mountOrder.push(2);
      return () => unmountOrder.push(2);
    }, []);
  }

  function $atom3() {
    atomMountEffect(() => {
      mountOrder.push(3);
      return () => unmountOrder.push(3);
    }, []);
    read($atom1);
  }

  function $atom4() {
    atomMountEffect(() => {
      mountOrder.push(4);
      return () => unmountOrder.push(4);
    }, []);
    read($atom1);
  }

  function $atom5() {
    read($atom3);
    read($atom4);
    atomMountEffect(() => {
      mountOrder.push(5);
      return () => unmountOrder.push(5);
    }, []);
    read($atom2);
  }

  const watcher = watch($atom5, () => {});
  expect(mountOrder).toEqual([1, 3, 4, 2, 5]);

  watcher.clear();
  expect(unmountOrder).toEqual([5, 2, 4, 3, 1]);
});

test('atomMountEffect updates the stored handler if dependencies have changed', () => {
  let counter = 0;
  let correct = false;

  function $atom() {
    if (++counter === 1) {
      atomMountEffect(() => {
        throw new Error('should not happen');
      }, [counter]);
    } else {
      atomMountEffect(() => {
        correct = true;
      }, [counter]);
    }
  }

  read($atom);
  invalidate($atom);
  using watcher = watch($atom, () => {});
  expect(correct).toBeTruthy();
});

test('atomMountEffect mounted handler re-runs if dependencies have changed', () => {
  const deps = [1];
  let mountCounter = 0, unmountCounter = 0;

  function $atom() {
    atomMountEffect(() => {
      ++mountCounter;
      return () => {
        ++unmountCounter;
      };
    }, [...deps]);
  }

  read($atom);
  expect(mountCounter).toBe(0);
  expect(unmountCounter).toBe(0);

  using watcher = watch($atom, () => {});
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(0);

  deps[0] = 2;
  invalidate($atom);
  expect(mountCounter).toBe(2);
  expect(unmountCounter).toBe(1);
});

test('atomMountEffect mounted handler re-runs immediately if atom is invalidated', () => {
  let mountCounter = 0, unmountCounter = 0;
  let recompute = 0;

  function $atom() {
    atomMountEffect(() => {
      ++mountCounter;
      return () => {
        ++unmountCounter;
      };
    }, [recompute]);
  }

  using watcher = watch($atom, () => {});
  expect(mountCounter).toBe(1);
  expect(unmountCounter).toBe(0);

  ++recompute;
  invalidate($atom); // no read() needed!
  expect(mountCounter).toBe(2);
  expect(unmountCounter).toBe(1);
});

test('atomMountEffect handlers run in the order they appeared in an atom', () => {
  const runOrder: number[] = [];

  function $atom() {
    atomMountEffect(() => {
      runOrder.push(1);
    }, []);

    atomMountEffect(() => {
      runOrder.push(2);
    }, []);

    atomMountEffect(() => {
      runOrder.push(3);
    }, []);
  }

  using watcher = watch($atom, () => {});
  expect(runOrder).toEqual([1, 2, 3]);
});

test('atomMountEffect handler runs if atom was transitively mounted later', () => {
  let mounted = false;

  function $atom1() {
    atomMountEffect(() => {
      mounted = true;
    }, []);
  }

  function $atom2() {
    const [nested, setNested] = atomState(false);
    atomAction(setNested, []);
    if (nested) {
      read($atom1);
    }
  }

  using watcher = watch($atom2, () => {});
  expect(mounted).toBeFalsy();

  dispatch($atom2)(true);
  expect(mounted).toBeTruthy();
});

test('atomMountEffect handlers cleanup in reverse order they appeared in an atom', () => {
  const runOrder: number[] = [];

  function $atom() {
    atomMountEffect(() => {
      return () => {
        runOrder.push(1);
      };
    }, []);

    atomMountEffect(() => {
      return () => {
        runOrder.push(2);
      };
    }, []);

    atomMountEffect(() => {
      return () => {
        runOrder.push(3);
      };
    }, []);
  }

  const watcher = watch($atom, () => {});
  watcher.clear();
  expect(runOrder).toEqual([3, 2, 1]);
});

test('atomMountEffect sets up new handlers only after running all cleanup tasks first', () => {
  const deps1 = [0], deps2 = [0], deps3 = [0];
  const order: string[] = [];

  function $atom() {
    atomMountEffect(() => {
      order.push('mount1');
      return () => order.push('unmount1');
    }, [...deps1]);

    atomMountEffect(() => {
      order.push('mount2');
      return () => order.push('unmount2');
    }, [...deps2]);

    atomMountEffect(() => {
      order.push('mount3');
      return () => order.push('unmount3');
    }, [...deps3]);
  }

  using watcher = watch($atom, () => {});
  expect(order).toEqual([
    'mount1',
    'mount2',
    'mount3'
  ]);

  deps1[0] = 1;
  deps3[0] = 1;
  order.length = 0;
  invalidate($atom);
  expect(order).toEqual([
    'unmount3',
    'unmount1',
    'mount1',
    'mount3'
  ]);
});

test('atomMountEffect does a shallow comparison of dependencies', () => {
  let counter = 0;
  let results: number[] = [];

  function $atom() {
    let currentCounter = ++counter;

    atomMountEffect(
      () => {
        results.push(currentCounter);
      },
      [{key: 123}]
    );

    atomMountEffect(
      () => {
        results.push(currentCounter);
      },
      [[true]]
    );
  }

  read($atom);
  invalidate($atom);
  using watcher = watch($atom, () => {});
  expect(results).toEqual([2, 2]);
});

test('atomMountEffect does not make a copy of the dependency array to use for comparison', () => {
  let counter = 0;
  let deps = [123];
  let wrongHandler = false;

  function $atom() {
    counter++;
    atomMountEffect(
      counter === 1 ? () => {} : () => {
        wrongHandler = true;
      },
      deps
    );
  }

  read($atom);
  const watcher1 = watch($atom, () => {});
  watcher1.clear();
  expect(wrongHandler).toBeFalsy();

  deps[0] = 456; // we're modifying the deps associated with computed value
  invalidate($atom);
  const watcher2 = watch($atom, () => {});
  watcher2.clear();
  expect(wrongHandler).toBeFalsy();
});

test('atomMountEffect discards handlers that appeared in an older computation but are now unreachable', () => {
  let throwError = false;
  let results: number[] = [];

  function $atom() {
    atomMountEffect(() => {
      results.push(1);
    }, []);

    if (throwError) {
      throw new Error('something went wrong');
    }

    atomMountEffect(() => {
      results.push(2);
    }, []);
  }

  // store both handlers in the internal stack
  read($atom);

  // now only the first handler is reachable
  throwError = true;
  invalidate($atom);

  // only the first handler should be mounted
  using watcher = watch($atom, () => {});
  expect(results).toEqual([1]);
});

test('atomMountEffect cleans up handlers that appeared in an older computation but are now unreachable', () => {
  let throwError = false;
  let mountOrder: number[] = [];
  let unmountOrder: number[] = [];

  function $atom() {
    atomMountEffect(() => {
      mountOrder.push(1);
      return () => {
        unmountOrder.push(1);
      };
    }, []);

    if (throwError) {
      throw new Error('something went wrong');
    }

    atomMountEffect(() => {
      mountOrder.push(2);
      return () => {
        unmountOrder.push(2);
      };
    }, []);
  }

  // mount both handlers
  using watcher1 = watch($atom, () => {});
  expect(mountOrder).toEqual([1, 2]);
  expect(unmountOrder).toEqual([]);

  // now only the first handler is reachable
  throwError = true;
  invalidate($atom);
  expect(mountOrder).toEqual([1, 2]);
  expect(unmountOrder).toEqual([2]);
});

test('atomMountEffect can be called multiple times with the same function', () => {
  let mountCounter = 0, unmountCounter = 0;

  function $atom() {
    const fn = () => {
      ++mountCounter;
      return () => {
        ++unmountCounter;
      };
    };

    atomMountEffect(fn, []);
    atomMountEffect(fn, []);
    atomMountEffect(fn, []);
  }

  const watcher = watch($atom, () => {});
  expect(mountCounter).toBe(3);
  expect(unmountCounter).toBe(0);

  watcher.clear();
  expect(mountCounter).toBe(3);
  expect(unmountCounter).toBe(3);
});

test('atomMountEffect cleanup function must be a valid function', () => {
  function $atom() {
    atomMountEffect(() => {
      return 123 as any;
    }, []);
  }

  expect(() => watch($atom, () => {})).toThrowError(InvalidCleanupFunctionAtomError);
});

test('atomMountEffect cannot be called outside of a computation', () => {
  expect(() => atomMountEffect(() => {}, [])).toThrowError(ComputationContextRequiredAtomError);
});

test('atomMountEffect does not allow running hooks inside its handler', () => {
  let err1, err2, err3;

  function $atom1() {
    atomMountEffect(() => {
      try {
        atomMemo(() => 123, []);
      } catch (err) {
        err1 = err;
      }
    }, []);
  }

  function $atom2() {
    atomMountEffect(() => {
      try {
        atomRef(123);
      } catch (err) {
        err2 = err;
      }
    }, []);
  }

  function $atom3() {
    atomMountEffect(() => {
      return () => { // cleanup
        try {
          atomAction(() => {}, []);
        } catch (err) {
          err3 = err;
        }
      };
    }, []);
  }

  using watcher1 = watch($atom1, () => {});
  expect(err1).toBeInstanceOf(ComputationContextRequiredAtomError);

  using watcher2 = watch($atom2, () => {});
  expect(err2).toBeInstanceOf(ComputationContextRequiredAtomError);

  const watcher3 = watch($atom3, () => {});
  watcher3.clear();
  expect(err3).toBeInstanceOf(ComputationContextRequiredAtomError);
});
