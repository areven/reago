// =============================================================================
// Iterable weakset
// =============================================================================

import LeakDetector from 'jest-leak-detector';
import {expect, test} from 'vitest';
import {IterableWeakSet} from '~/util/iterable-weakset';


test('iterable weakset does not prevent gc collection', async () => {
  let ref1: any = {asd: 123};
  let ref2: any = () => 123;

  const detector1 = createDetector(ref1);
  const detector2 = createDetector(ref2);

  const set = new IterableWeakSet();
  set.add(ref1);
  set.add(ref2);

  ref1 = undefined;
  ref2 = undefined;

  await expect(detector1()).resolves.toBe(false);
  await expect(detector2()).resolves.toBe(false);
});

test('iterable weakset `Symbol.iterator()` skips garbage collected entries', async () => {
  const ref1: {v: number} | undefined = {v: 123};
  let ref2: {v: number} | undefined = {v: 456};

  const detector = createDetector(ref2);

  const set = new IterableWeakSet();
  set.add(ref1);
  set.add(ref2);

  ref2 = undefined;
  await detector();

  for (const entry of set) {
    expect(entry).toBe(ref1);
  }
});

test('iterable weakset `some()` skips garbage collected entries', async () => {
  const ref1: {v: number} | undefined = {v: 123};
  let ref2: {v: number} | undefined = {v: 456};

  const detector = createDetector(ref2);

  const set = new IterableWeakSet<{v: number}>();
  set.add(ref1);
  set.add(ref2);

  ref2 = undefined;
  await detector();

  expect(set.some(entry => entry.v === 456)).toBeFalsy();
  expect(set.some(entry => entry.v === 123)).toBeTruthy();
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
