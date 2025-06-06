// =============================================================================
// Public deasync() API tests
// =============================================================================

import {atomAction, atomState, deasync, dispatch, invalidate, read} from 'reago';
import {expect, test} from 'vitest';


test('deasync() returns the original value if given something that is neither a promise nor an atom', () => {
  expect(deasync(123)).toEqual({
    status: 'resolved',
    result: 123
  });

  expect(deasync(null)).toEqual({
    status: 'resolved',
    result: null
  });

  expect(deasync(undefined)).toEqual({
    status: 'resolved',
    result: undefined
  });

  expect(deasync(true)).toEqual({
    status: 'resolved',
    result: true
  });

  expect(deasync(false)).toEqual({
    status: 'resolved',
    result: false
  });

  expect(deasync(Symbol.dispose)).toEqual({
    status: 'resolved',
    result: Symbol.dispose
  });

  const obj = {x: 14};
  const output1 = deasync(obj);
  expect(output1.status).toBe('resolved');
  expect(output1.result).toBe(obj);

  const arr = [1, [2], {x: 3}];
  const output2 = deasync(arr);
  expect(output2.status).toBe('resolved');
  expect(output2.result).toBe(arr);
});

test('deasync() returns `pending` for an unresolved promise', () => {
  const input = new Promise(() => {});
  const output = deasync(input);
  expect(output).toEqual({
    status: 'pending'
  });
});

test('deasync() returns `pending` if settled promises has not been seen before', () => {
  expect(deasync(Promise.resolve(123))).toEqual({status: 'pending'});
  expect(deasync(Promise.reject())).toEqual({status: 'pending'});
  expect(deasync(Promise.reject(new Error('asd')))).toEqual({status: 'pending'});
});

test('deasync() eventually returns `resolved` for resolved promises', async () => {
  const promise = Promise.resolve(123);
  const output1 = deasync(promise);
  expect(output1).toEqual({status: 'pending'});

  await promise;
  const output2 = deasync(promise);
  expect(output2).toEqual({status: 'resolved', result: 123});
});

test('deasync() eventually returns `rejected` for rejected promises', async () => {
  const promise = Promise.reject(new Error('asd'));
  const output1 = deasync(promise);
  expect(output1).toEqual({status: 'pending'});

  await promise.catch(() => {});
  const output2 = deasync(promise);
  expect(output2).toEqual({status: 'rejected', error: new Error('asd')});
});

test('deasync() preserves the reference to original result', async () => {
  const result = {x: 123};
  const promise = Promise.resolve(result);

  deasync(promise);
  await promise;

  const output = deasync(promise);
  expect(output.status).toBe('resolved');
  expect((output as any).result).toBe(result);
});

test('deasync() preserves the reference to original error', async () => {
  const error = new Error('yikes!');
  const promise = Promise.reject(error);

  deasync(promise);
  await promise.catch(() => {});

  const output = deasync(promise);
  expect(output.status).toBe('rejected');
  expect((output as any).error).toBe(error);
});

test('deasync() can be called multiple times on the same promise', async () => {
  const promise = Promise.resolve(123);
  expect(deasync(promise)).toEqual({status: 'pending'});
  expect(deasync(promise)).toEqual({status: 'pending'});
  expect(deasync(promise)).toEqual({status: 'pending'});

  await promise;
  expect(deasync(promise)).toEqual({status: 'resolved', result: 123});
  expect(deasync(promise)).toEqual({status: 'resolved', result: 123});
  expect(deasync(promise)).toEqual({status: 'resolved', result: 123});
});

test('deasync() can immediately return the result of a synchronously computed generative atom', async () => {
  const promise1 = Promise.resolve(2);
  const promise2 = Promise.resolve({x: 6});

  function* $atom() {
    const val1: number = yield promise1;
    const val2: {x: number} = yield promise2;
    const [val3, setVal3] = atomState(0);
    atomAction(setVal3, []);
    return val1 + val2.x + val3;
  }

  // yielded promise values are unknown during first computation
  await expect(read($atom)).resolves.toBe(8);

  // now everything should compute synchronously, we're not using `await` anymore
  dispatch($atom)(3);
  const resultPromise = read($atom);
  expect(deasync(resultPromise)).toEqual({
    status: 'resolved',
    result: 11
  });
});


test('deasync() can wrap a functional atom that returns a promise', async () => {
  let counter = 0;

  function $atom() {
    return Promise.resolve(++counter);
  }

  const $derived = deasync($atom);
  expect($derived).toBeInstanceOf(Function);

  const result1 = read($derived);
  const result2 = read($derived);
  expect(result1).toBe(result2);
  expect(result1).toEqual({
    status: 'pending'
  });

  await read($atom);

  const result3 = read($derived);
  const result4 = read($derived);
  expect(result3).toBe(result4);
  expect(result3).toEqual({
    status: 'resolved',
    result: 1
  });

  invalidate($atom);

  const result5 = read($derived);
  const result6 = read($derived);
  expect(result5).toBe(result6);
  expect(result5).toEqual({
    status: 'pending'
  });

  await read($atom);

  const result7 = read($derived);
  const result8 = read($derived);
  expect(result7).toBe(result8);
  expect(result7).toEqual({
    status: 'resolved',
    result: 2
  });
});

test('deasync() can wrap a functional atom that does not return a promise', () => {
  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  const $derived = deasync($atom);
  expect($derived).toBeInstanceOf(Function);

  const result1 = read($derived);
  const result2 = read($derived);
  expect(result1).toBe(result2);
  expect(result1).toEqual({
    status: 'resolved',
    result: 0
  });

  dispatch($atom)(84);

  const result3 = read($derived);
  const result4 = read($derived);
  expect(result3).toBe(result4);
  expect(result4).toEqual({
    status: 'resolved',
    result: 84
  });
});


test('deasync() can wrap a functional atom that can return both a primitive and a promise', async () => {
  let counter = 0;

  function $atom() {
    return ++counter === 1 ? 8 : Promise.resolve(123);
  }

  const $derived = deasync($atom);
  expect($derived).toBeInstanceOf(Function);

  const result1 = read($derived);
  const result2 = read($derived);
  expect(result1).toBe(result2);
  expect(result1).toEqual({
    status: 'resolved',
    result: 8
  });

  invalidate($derived); // changes nothing

  const result3 = read($derived);
  expect(result3).toBe(result1);
  expect(result3).toEqual({
    status: 'resolved',
    result: 8
  });

  invalidate($atom); // now we'll get ap promise

  const result4 = read($derived);
  const result5 = read($derived);
  expect(result4).toBe(result5);
  expect(result4).toEqual({
    status: 'pending'
  });

  await read($atom);

  const result6 = read($derived);
  const result7 = read($derived);
  expect(result6).toBe(result7);
  expect(result6).toEqual({
    status: 'resolved',
    result: 123
  });
});

test('deasync() can wrap a generative atom', async () => {
  const promise1 = Promise.resolve(2);
  const promise2 = Promise.resolve({x: 6});

  function* $atom() {
    const val1: number = yield promise1;
    const val2: {x: number} = yield promise2;
    const [val3, setVal3] = atomState(0);
    atomAction(setVal3, []);
    return val1 + val2.x + val3;
  }

  const $derived = deasync($atom);

  // yielded promise values are unknown during first computation
  const result1 = read($derived);
  const result2 = read($derived);
  expect(result1).toBe(result2);
  expect(result1).toEqual({
    status: 'pending'
  });

  // wait for async computation to finish
  await expect(read($atom)).resolves.toBe(8);

  // we should be able to read the result now
  const result3 = read($derived);
  const result4 = read($derived);
  expect(result3).toBe(result4);
  expect(result3).toEqual({
    status: 'resolved',
    result: 8
  });

  // the "magic" bit - not everything should compute synchronously and `await` isn't needed
  dispatch($atom)(3);
  const result5 = read($derived);
  const result6 = read($derived);
  expect(result5).toBe(result6);
  expect(result5).toEqual({
    status: 'resolved',
    result: 11
  });
});

test('deasync() called on an atom always returns the same derived atom', () => {
  function $atom1() {
    return Promise.resolve(123);
  }

  function* $atom2() {
    return 42;
  }

  const atom1Ref1 = deasync($atom1);
  const atom1Ref2 = deasync($atom1);
  expect(atom1Ref1).toBe(atom1Ref2);

  const atom2Ref1 = deasync($atom2);
  const atom2Ref2 = deasync($atom2);
  expect(atom2Ref1).toBe(atom2Ref2);
});
