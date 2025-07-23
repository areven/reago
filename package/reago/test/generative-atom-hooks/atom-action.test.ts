// =============================================================================
// atomAction generative atom tests
// =============================================================================

import {atomAction, dispatch, read} from 'reago';
import {expect, test} from 'vitest';


test('atomAction handler will run even if it was not reached when dispatch() was invoked', async () => {
  let registered = false;
  let triggered = false;

  function* $atom() {
    yield Promise.resolve(123);
    registered = true;
    atomAction(() => {
      triggered = true;
    }, []);
  }

  // run everything up to the first yield
  const promise = read($atom);
  expect(registered).toBeFalsy();
  expect(triggered).toBeFalsy();

  // trigger a dispatch but it doesn't see the atomAction yet
  dispatch($atom)();
  expect(registered).toBeFalsy();
  expect(triggered).toBeFalsy();

  // when computation finishes, the dispatch will run
  await promise;
  expect(registered).toBeTruthy();
  expect(triggered).toBeTruthy();
});

test('atomAction handler will run even if an exception was thrown after it was registered', async () => {
  let registered = false;
  let triggered = false;

  function* $atom() {
    yield Promise.resolve(123);
    registered = true;
    atomAction(() => {
      triggered = true;
    }, []);
    throw new Error('fail');
  }

  // run everything up to the first yield
  const promise = read($atom);
  expect(registered).toBeFalsy();
  expect(triggered).toBeFalsy();

  // trigger a dispatch but it doesn't see the atomAction yet
  dispatch($atom)();
  expect(registered).toBeFalsy();
  expect(triggered).toBeFalsy();

  // when computation finishes, the dispatch will run
  await promise.catch(() => {});
  expect(registered).toBeTruthy();
  expect(triggered).toBeTruthy();
});
