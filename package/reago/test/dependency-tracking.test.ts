// =============================================================================
// Dependency tracking
// =============================================================================

import {atomAction, atomState, dispatch, invalidate, read} from 'reago';
import {expect, test} from 'vitest';


test('read() registers a simple linear dependency chain', async () => {
  let counter1 = 0, counter2 = 0, counter3 = 0, counter4 = 0;

  function $atom1() {
    ++counter1;
    const [value, setValue] = atomState(5);
    atomAction(setValue, []);
    return value;
  }

  function $atom2() {
    ++counter2;
    return read($atom1) * 2;
  }

  expect(read($atom2)).toBe(10);
  expect(counter1).toBe(1);
  expect(counter2).toBe(1);

  dispatch($atom1)(10);
  expect(read($atom2)).toBe(20);
  expect(counter1).toBe(2);
  expect(counter2).toBe(2);

  function* $atom3() {
    ++counter3;
    const x: number = yield Promise.resolve(5);
    return read($atom2) + x;
  }

  await expect(read($atom3)).resolves.toBe(25);
  dispatch($atom1)(5);
  dispatch($atom1)(5);
  await expect(read($atom3)).resolves.toBe(15);
  expect(counter3).toBe(2);

  function* $atom4() {
    ++counter4;
    const val3: number = yield read($atom3);
    return val3 + 1000;
  }

  const read1 = read($atom4);
  const read2 = read($atom4);
  await expect(read1).resolves.toBe(1015);
  await expect(read2).resolves.toBe(1015);
  dispatch($atom1)(54);
  await expect(read($atom4)).resolves.toBe(1113);
  expect(counter4).toBe(2);
});

test('read() registers a non-linear dependency chain', async () => {
  let counter1 = 0, counter2 = 0, counter3 = 0, counter4 = 0, counter5 = 0;

  function $atom1() {
    ++counter1;
    const [value, setValue] = atomState(5);
    atomAction(setValue, []);
    return value;
  }

  function $atom2() {
    ++counter2;
    return read($atom1);
  }

  function $atom3() {
    ++counter3;
    return read($atom1) + read($atom2) ;
  }

  expect(read($atom3)).toBe(10);
  expect(read($atom3)).toBe(10);
  expect(counter1).toBe(1);
  expect(counter2).toBe(1);
  expect(counter3).toBe(1);

  invalidate($atom2);
  expect(read($atom3)).toBe(10);
  expect(counter1).toBe(1);
  expect(counter2).toBe(2);
  expect(counter3).toBe(1);

  dispatch($atom1)(8);
  expect(read($atom3)).toBe(16);
  expect(counter1).toBe(2);
  expect(counter2).toBe(3);
  expect(counter3).toBe(2);

  function* $atom4() {
    ++counter4;
    const val1 = read($atom1);
    yield Promise.resolve(null);
    const val2 = read($atom3);
    yield Promise.resolve(null);
    return val1 + val2;
  }

  function* $atom5() {
    ++counter5;
    const val4: number = yield read($atom4);
    return val4 + read($atom2);
  }

  await expect(read($atom5)).resolves.toBe(32);
  expect(counter1).toBe(2);
  expect(counter2).toBe(3);
  expect(counter3).toBe(2);
  expect(counter4).toBe(1);
  expect(counter5).toBe(1);

  dispatch($atom1)(13);
  await expect(read($atom5)).resolves.toBe(52);
  expect(counter1).toBe(3);
  expect(counter2).toBe(4);
  expect(counter3).toBe(3);
  expect(counter4).toBe(2);
  expect(counter5).toBe(2);
});

test('read() registers multiple dependencies', async () => {
  let counter1 = 0, counter2 = 0, counter3 = 0, counter4 = 0, counter5 = 0;

  function $atom1() {
    ++counter1;
    const [value, setValue] = atomState(5);
    atomAction(setValue, []);
    return value;
  }

  function $atom2() {
    ++counter2;
    const [value, setValue] = atomState(3);
    atomAction(setValue, []);
    return value;
  }

  function $atom3() {
    ++counter3;
    return read($atom1) + read($atom2);
  }

  expect(read($atom3)).toBe(8);
  expect(counter1).toBe(1);
  expect(counter2).toBe(1);
  expect(counter3).toBe(1);

  dispatch($atom2)(0);
  expect(read($atom3)).toBe(5);
  expect(counter1).toBe(1);
  expect(counter2).toBe(2);
  expect(counter3).toBe(2);

  function* $atom4() {
    ++counter4;
    return 1000;
  }

  function* $atom5() {
    ++counter5;
    const add: number = yield read($atom4);
    return read($atom3) + add;
  }

  await expect(read($atom5)).resolves.toBe(1005);
  expect(counter4).toBe(1);
  expect(counter5).toBe(1);

  dispatch($atom2)(80);
  await expect(read($atom5)).resolves.toBe(1085);
  expect(counter2).toBe(3);
  expect(counter4).toBe(1);
  expect(counter5).toBe(2);
});

test('read() swaps from one dependency to another', async () => {
  let counter1 = 0, counter2 = 0, counter3 = 0, counter4 = 0;

  function $atom1() {
    ++counter1;
    const [value, setValue] = atomState(5);
    atomAction(setValue, []);
    return value;
  }

  function $atom2() {
    ++counter2;
    const [value, setValue] = atomState(3);
    atomAction(setValue, []);
    return value;
  }

  function $atom3() {
    ++counter3;
    const [first, setFirst] = atomState(true);
    atomAction(setFirst, []);
    return first ? read($atom1) : read($atom2);
  }

  expect(read($atom3)).toBe(5);
  expect(counter1).toBe(1);
  expect(counter2).toBe(0);
  expect(counter3).toBe(1);

  dispatch($atom2)(4);
  expect(counter1).toBe(1);
  expect(counter2).toBe(1); // note the instance is still outdated
  expect(counter3).toBe(1);

  dispatch($atom1)(123);
  expect(counter1).toBe(1);
  expect(counter2).toBe(1);
  expect(counter3).toBe(1);

  expect(read($atom3)).toBe(123);
  expect(counter1).toBe(2);
  expect(counter2).toBe(1);
  expect(counter3).toBe(2);

  dispatch($atom3)(false);
  expect(read($atom3)).toBe(4);
  expect(counter1).toBe(2);
  expect(counter2).toBe(2);
  expect(counter3).toBe(3);

  dispatch($atom1)(0);
  expect(read($atom3)).toBe(4);
  expect(counter1).toBe(2);
  expect(counter2).toBe(2);
  expect(counter3).toBe(3);

  function* $atom4() {
    ++counter4;
    const [nested, setNested] = atomState(true);
    atomAction(setNested, []);

    if (nested) {
      yield Promise.resolve(123);
      return read($atom3);
    } else {
      return -1;
    }
  }

  await expect(read($atom4)).resolves.toBe(4);
  expect(counter1).toBe(2);
  expect(counter2).toBe(2);
  expect(counter3).toBe(3);
  expect(counter4).toBe(1);

  dispatch($atom1)(3434);
  await expect(read($atom4)).resolves.toBe(4);
  expect(counter1).toBe(3);
  expect(counter2).toBe(2);
  expect(counter3).toBe(3);
  expect(counter4).toBe(1);

  dispatch($atom2)(3);
  await expect(read($atom4)).resolves.toBe(3);
  expect(counter1).toBe(3);
  expect(counter2).toBe(3);
  expect(counter3).toBe(4);
  expect(counter4).toBe(2);

  dispatch($atom4)(false);
  dispatch($atom2)(34);
  await expect(read($atom4)).resolves.toBe(-1);
  expect(counter1).toBe(3);
  expect(counter2).toBe(3);
  expect(counter3).toBe(4);
  expect(counter4).toBe(3);
});

test('read() correctly tracks multiple instances of the same atom', async () => {
  let counter1a = 0, counter1b = 0, counter2 = 0;

  function $atom1(which: 'a' | 'b') {
    if (which === 'a') {
      ++counter1a;
    } else {
      ++counter1b;
    }

    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function* $atom2() {
    ++counter2;
    const [which, setWhich] = atomState<'a' | 'b'>('a');
    atomAction(setWhich, []);
    return read($atom1, which) * 2;
  }

  await expect(read($atom2)).resolves.toBe(0);
  expect(counter1a).toBe(1);
  expect(counter1b).toBe(0);
  expect(counter2).toBe(1);

  dispatch($atom1, 'b')(2);
  await expect(read($atom2)).resolves.toBe(0);
  expect(counter1a).toBe(1);
  expect(counter1b).toBe(1); // still outdated
  expect(counter2).toBe(1);

  dispatch($atom2)('b');
  await expect(read($atom2)).resolves.toBe(4);
  expect(counter1a).toBe(1);
  expect(counter1b).toBe(2);
  expect(counter2).toBe(2);

  dispatch($atom1, 'a')(83823);
  await expect(read($atom2)).resolves.toBe(4);
  expect(counter1a).toBe(1);
  expect(counter1b).toBe(2);
  expect(counter2).toBe(2);
});

test('read() drops dependencies that are no longer reachable', async () => {
  let counter1 = 0, counter2 = 0, counter3 = 0, counter4 = 0, counter5 = 0;

  function* $atom1() {
    ++counter1;
    const [value, setValue] = atomState(5);
    atomAction(setValue, []);
    return value;
  }

  function $atom2() {
    ++counter2;
    const [value, setValue] = atomState(3);
    atomAction(setValue, []);
    return value;
  }

  function* $atom3() {
    ++counter3;
    const [interrupt, setInterrupt] = atomState(false);
    atomAction(setInterrupt, []);

    const val1: number = yield read($atom1);
    if (interrupt) {
      throw new Error('interrupted');
    }
    const val2: number = read($atom2);
    return val1 + val2;
  }

  await expect(read($atom3)).resolves.toBe(8);
  await expect(read($atom3)).resolves.toBe(8);
  expect(counter1).toBe(1);
  expect(counter2).toBe(1);
  expect(counter3).toBe(1);

  dispatch($atom1)(8);
  await expect(read($atom3)).resolves.toBe(11);
  expect(counter1).toBe(2);
  expect(counter2).toBe(1);
  expect(counter3).toBe(2);

  dispatch($atom3)(true);
  await expect(read($atom3)).rejects.toThrow();
  expect(counter1).toBe(2);
  expect(counter2).toBe(1);
  expect(counter3).toBe(3);

  dispatch($atom2)(4);
  await expect(read($atom3)).rejects.toThrow();
  expect(counter1).toBe(2);
  expect(counter2).toBe(1);
  expect(counter3).toBe(3);

  dispatch($atom1)(132);
  await expect(read($atom3)).rejects.toThrow();
  expect(counter1).toBe(3);
  expect(counter2).toBe(1);
  expect(counter3).toBe(4);
});

test('read() drops dependencies found during an interrupted computation', async () => {
  let counter = 0, counter1 = 0, counter2 = 0, counter3 = 0;
  let register = true;


  function $dep1() {
    ++counter1;
    return Math.random();
  }

  function $dep2() {
    ++counter2;
    return Math.random();
  }

  function $dep3() {
    ++counter3;
    return Math.random();
  }

  function* $atom() {
    const returnValue = ++counter;
    if (register) {
      read($dep1);
      read($dep2);
      read($dep3);
    }
    yield Promise.resolve(123); // we'll interrupt here
    return returnValue;
  }

  // run everything up to `yield`
  const promise = read($atom);

  // all dep* atoms were read
  expect(counter1).toBe(1);
  expect(counter2).toBe(1);
  expect(counter3).toBe(1);

  // we discard the computation, new one is started but this time with no deps
  register = false;
  invalidate($atom);

  // promise resolves to the result of last computation
  await expect(promise).resolves.toBe(2);
  expect(counter).toBe(2);

  // we can now modify nested atoms freely and that shouldn't do anything
  invalidate($dep1);
  invalidate($dep2);
  invalidate($dep3);
  expect(counter1).toBe(1);
  expect(counter2).toBe(1);
  expect(counter3).toBe(1);
  await expect(read($atom)).resolves.toBe(2);
  expect(counter).toBe(2);
});
