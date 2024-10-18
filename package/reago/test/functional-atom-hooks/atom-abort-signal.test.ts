// =============================================================================
// atomAbortSignal functional atom tests
// =============================================================================

import {atomAbortSignal, atomAction, atomReducer, dispatch, invalidate, read, watch} from 'reago';
import {expect, test} from 'vitest';
import {ComputationContextRequiredAtomError} from '~/error';


test('atomAbortSignal returns the same abort signal during a computation', () => {
  function $atom() {
    return [
      atomAbortSignal(),
      atomAbortSignal(),
      atomAbortSignal()
    ];
  }

  const signals = read($atom);
  expect(signals[0]).toBe(signals[1]);
  expect(signals[0]).toBe(signals[2]);
});

test('atomAbortSignal returns a different signal for each computation', () => {
  const signals: AbortSignal[] = [];

  function $atom() {
    signals.push(atomAbortSignal());
  }

  read($atom);
  invalidate($atom);
  read($atom);
  invalidate($atom);
  read($atom);

  expect(signals.length).toBe(3);
  expect(signals[0]).not.toBe(signals[1]);
  expect(signals[0]).not.toBe(signals[2]);
  expect(signals[1]).not.toBe(signals[2]);
});

test('atomAbortSignal returns a signal that is not aborted during a synchronous computation', () => {
  function $atom() {
    const signal = atomAbortSignal();
    return signal.aborted;
  }

  expect(read($atom)).toBe(false);
});

test('atomAbortSignal returns a signal that is aborted when a new computation starts', () => {
  const signals: AbortSignal[] = [];

  function $atom() {
    signals.push(atomAbortSignal());
    const [_, refresh] = atomReducer(x => x + 1, 0);
    atomAction(refresh, []);
  }

  read($atom);
  dispatch($atom)();
  read($atom);

  expect(signals.length).toBe(2);
  expect(signals[0].aborted).toBeTruthy();
  expect(signals[1].aborted).toBeFalsy();
});

test('atomAbortSignal returns a signal that is aborted when a watched atom is recomputed', () => {
  const signals: AbortSignal[] = [];

  function $atom() {
    signals.push(atomAbortSignal());
    const [_, refresh] = atomReducer(x => x + 1, 0);
    atomAction(refresh, []);
  }

  using watcher = watch($atom, () => {});
  expect(signals.length).toBe(1);
  expect(signals[0].aborted).toBeFalsy();

  dispatch($atom)();
  expect(signals.length).toBe(2);
  expect(signals[0].aborted).toBeTruthy();
  expect(signals[1].aborted).toBeFalsy();
});

test('atomAbortSignal returns a signal that is aborted when the atom is invalidated', () => {
  const signals: AbortSignal[] = [];

  function $atom() {
    signals.push(atomAbortSignal());
  }

  read($atom);
  expect(signals.length).toBe(1);
  expect(signals[0].aborted).toBeFalsy();

  invalidate($atom);
  expect(signals.length).toBe(1);
  expect(signals[0].aborted).toBeTruthy();
});

test('atomAbortSignal returns a signal that is aborted before a new computation starts', () => {
  const signals: AbortSignal[] = [];

  function $atom() {
    if (signals.some(signal => !signal.aborted)) {
      throw new Error('Some old signals are not aborted');
    }
    signals.push(atomAbortSignal());
  }

  read($atom);
  invalidate($atom);
  read($atom);
  invalidate($atom);
  read($atom);
  invalidate($atom);
  invalidate($atom);
  read($atom);
  read($atom);
});

test('atomAbortSignal cannot be called outside of a computation', () => {
  expect(() => atomAbortSignal()).toThrowError(ComputationContextRequiredAtomError);
});
