// =============================================================================
// Memory management tests
// =============================================================================

import LeakDetector from 'jest-leak-detector';
import {atomAction, atomState, deasync, dispatch, read, watch} from 'reago';
import {expect, test} from 'vitest';
import type {Atom} from 'reago';


test('reago does not hold atoms that are no longer referenced', async () => {
  let $atom: Atom<number> | undefined = () => 123;
  const detector = createDetector($atom);

  expect(read($atom)).toBe(123);

  $atom = undefined;
  await expect(detector()).resolves.toBe(false);
});

test('reago holds atoms that are tracked as dependencies', async () => {
  let $atom1: Atom<number> | undefined = () => 123;
  const $atom2: Atom<number> | undefined = () => read($atom1!) * 2;
  const detector1 = createDetector($atom1);

  // add $atom1 as a dependency of $atom2
  read($atom2);

  // unref $atom1 but it shouldn't be garbage collected
  $atom1 = undefined;
  await expect(detector1()).resolves.toBe(true);
});

test('reago does not hold atoms that were tracked as dependants', async () => {
  const $atom1 = () => {
    const [value, setValue] = atomState(123);
    atomAction(setValue, []);
    return value;
  };

  let $atom2: Atom<number> | undefined = () => read($atom1) * 2;
  const detector = createDetector($atom2);

  expect(read($atom1)).toBe(123);
  expect(read($atom2)).toBe(246);

  $atom2 = undefined;
  await expect(detector()).resolves.toBe(false);

  // ensure $atom1 still computes fine ($atom2 still has an entry in the dependants weakset)
  expect(read($atom1)).toBe(123);
  dispatch($atom1)(13);
  expect(read($atom1)).toBe(13); // $atom2 entry should be wiped here
});

test('reago holds atoms that are mounted', async () => {
  // $atom1 value can be freely changed
  const $atom1 = () => {
    const [value, setValue] = atomState(123);
    atomAction(setValue, []);
    return value;
  };

  // $atom2 value doesn't change directly, but together with $atom1
  let $atom2: Atom<number> | undefined = () => read($atom1) * 2;
  const detector = createDetector($atom2);
  expect(read($atom2)).toBe(246);

  // we're creating a watcher on $atom2 that effectively triggers on $atom1 changes
  let changed = false;
  watch($atom2, () => { // we have to leak the watcher here and never clear() it
    changed = true;
  });

  // even though nothing directly references $atom2 anymore, we still have a watcher
  // that should run whenever $atom1 changes - mounted $atom2 must be kept internally
  $atom2 = undefined;
  await expect(detector()).resolves.toBe(true);

  // changing $atom1 should trigger the leaked watcher on $atom2
  dispatch($atom1)(14);
  expect(changed).toBeTruthy();
});

test('reago does not hold atoms that are no longer mounted', async () => {
  let $atom: Atom<number> | undefined = () => 123;
  const detector = createDetector($atom);

  const watcher = watch($atom, () => {});
  expect(read($atom)).toBe(123);

  $atom = undefined;
  await expect(detector()).resolves.toBe(true);
  watcher.clear();
  await expect(detector()).resolves.toBe(false);
});

test('reago does not hold yielded promises that are no longer referenced', async () => {
  let promise1: Promise<number> | undefined = Promise.resolve(123);
  let promise2: Promise<number> | undefined = Promise.reject();

  const $atom: Atom<Promise<number>> | undefined = function* () {
    try {
      yield promise1!;
      yield promise2!;
    } catch (err) {}
    return 8;
  };

  const detector1 = createDetector(promise1);
  const detector2 = createDetector(promise2);
  await expect(read($atom!)).resolves.toBe(8);

  promise1 = undefined;
  promise2 = undefined;
  await expect(detector1()).resolves.toBe(false);
  await expect(detector2()).resolves.toBe(false);
});

test('reago does not hold promises passed to deasync()', async () => {
  let promise1: Promise<number> | undefined = Promise.resolve(123);
  let promise2: Promise<number> | undefined = Promise.reject();
  const detector1 = createDetector(promise1);
  const detector2 = createDetector(promise2);
  deasync(promise1);
  deasync(promise2);
  promise1 = undefined;
  promise2 = undefined;
  await expect(detector1()).resolves.toBe(false);
  await expect(detector2()).resolves.toBe(false);

  let promise3: Promise<number> | undefined = Promise.resolve(123);
  let promise4: Promise<number> | undefined = Promise.reject();
  const detector3 = createDetector(promise3);
  const detector4 = createDetector(promise4);
  deasync(promise3);
  deasync(promise4);
  await promise3;
  await promise4.catch(() => {});
  promise3 = undefined;
  promise4 = undefined;
  await expect(detector3()).resolves.toBe(false);
  await expect(detector4()).resolves.toBe(false);
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
