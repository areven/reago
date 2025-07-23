// =============================================================================
// Generative atom optimizations tests
// =============================================================================

import {atomAction, atomRef, atomState, dispatch, invalidate, read, watch} from 'reago';
import {expect, test} from 'vitest';


test('generative atom computes its value synchronously if yielded promises have known values', async () => {
  let atom1Counter = 0, atom2Counter = 0;

  const promise1 = Promise.resolve(2);
  const promise2 = Promise.resolve({x: 6});

  function* $atom1() {
    ++atom1Counter;

    const val1: number = yield promise1;
    const val2: {x: number} = yield promise2;
    const [val3, setVal3] = atomState(0);

    atomAction(setVal3, []);

    return val1 + val2.x + val3;
  }

  function $atom2() {
    const promise = read($atom1);
    const ref = atomRef<null | Promise<number>>(null);

    if (ref.current === null) {
      ref.current = promise;
    } else if (ref.current !== promise) {
      throw new Error('promise changed');
    }

    return ++atom2Counter;
  }

  // yielded promise values are unknown during first computation
  const firstComputation = read($atom1);
  await expect(firstComputation).resolves.toBe(8);
  expect(atom1Counter).toBe(1);

  // we know yielded promise values during second computation already, so we should
  // synchronously determine that result didn't change and return the same instance promise
  invalidate($atom1);
  const secondComputation = read($atom1);
  expect(secondComputation).toBe(firstComputation);
  await expect(secondComputation).resolves.toBe(8);

  // likewise, $atom2 subscribing to $atom1 shouldn't recompute when $atom1 recomputes,
  // because we should synchronously know the result is the same
  using watcher = watch($atom2, () => {});
  expect(read($atom2)).toBe(1);
  expect(read($atom2)).toBe(1);
  invalidate($atom1);
  await expect(read($atom1)).resolves.toBe(8);
  expect(read($atom2)).toBe(1);
  expect(atom2Counter).toBe(1);

  // changing $atom1 value should trigger a chain of recomputations though
  dispatch($atom1)(10);
  await expect(read($atom1)).resolves.toBe(18);
  expect(() => read($atom2)).toThrowError('promise changed');
});

test('generative atom syncs its actions synchronously if yielded promises have known values', async () => {
  const promise1 = Promise.resolve(1);
  const promise2 = Promise.resolve(2);
  let lastReturnedValue = 0;

  function* $atom() {
    yield promise1;
    yield promise2;
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);

    lastReturnedValue = value;
    return value;
  }

  // after this read we should know values of all yielded promises
  await expect(read($atom)).resolves.toBe(0);

  // action array is computed, atom isn't stale, dispatch will run synchronously
  dispatch($atom)(3);

  // this dispatch call will need to sync actions since state changed, but sync
  // should happen synchronously since yielded promises didn't change
  dispatch($atom)(8);

  // without using await (!), we should know the last value
  void read($atom);
  expect(lastReturnedValue).toBe(8);
});

test('generative atom will not restart computation if outdated dependency was not reached yet', async () => {
  let counter = 0;

  function $atom1() {
    const [value, setValue] = atomState(13);
    atomAction(setValue, []);
    return value;
  }

  function* $atom2() {
    ++counter;
    yield Promise.resolve(123);
    return read($atom1);
  }

  // initialize both
  await expect(read($atom2)).resolves.toBe(13);
  expect(counter).toBe(1);

  // run $atom2 up to the first yield
  invalidate($atom2);
  const promise = read($atom2);
  expect(counter).toBe(2);

  // update $atom1, it should not restart computation since we didn't reach read($atom1) yet
  dispatch($atom1)(82382);
  expect(counter).toBe(2);

  // let it run till the end and observe computation wasn't restarted
  await promise;
  expect(counter).toBe(2);
});
