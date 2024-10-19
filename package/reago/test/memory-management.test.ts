// =============================================================================
// Memory management
// =============================================================================

import LeakDetector from 'jest-leak-detector';
import {Atom, atomAction, atomState, dispatch, read, watch} from 'reago';
import {expect, test} from 'vitest';


test('reago does not hold atoms that are no longer referenced', async () => {
  let $atom: Atom<number> | undefined = () => 123;
  const detector = createDetector($atom);

  expect(read($atom)).toBe(123);

  $atom = undefined;
  await expect(detector()).resolves.toBe(false);
});

test('reago does not hold atoms that were tracked as dependants', async () => {
  const $atom1 = () => {
    const [value, setValue] = atomState(123);
    atomAction(setValue, []);
    return value;
  }

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

test('reago does not hold atoms that are no longer subscribed', async () => {
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

  let $atom: Atom<number> | undefined = function* () {
    try {
      yield promise1!;
      yield promise2!;
    } catch (err) {}
    return 8;
  }

  const detector1 = createDetector(promise1);
  const detector2 = createDetector(promise2);
  await expect(read($atom!)).resolves.toBe(8);

  promise1 = undefined;
  promise2 = undefined;
  await expect(detector1()).resolves.toBe(false);
  await expect(detector2()).resolves.toBe(false);
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
