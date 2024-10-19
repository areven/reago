// =============================================================================
// Generative atom rules
// =============================================================================

import {read} from 'reago';
import {expect, test} from 'vitest';
import {GeneratorPromiseExpectedAtomError} from '~/error';


test('generative atom requires yielded values to be promises', () => {
  function* $atom1() {
    yield 123;
  }

  function* $atom2() {
    yield $atom1;
  }

  function* $atom3() {
    yield null;
  }

  function* $atom4() {
    yield undefined;
  }

  function* $atom5() {
    yield {};
  }

  expect(() => read($atom1)).toThrowError(GeneratorPromiseExpectedAtomError);
  expect(() => read($atom2)).toThrowError(GeneratorPromiseExpectedAtomError);
  expect(() => read($atom3)).toThrowError(GeneratorPromiseExpectedAtomError);
  expect(() => read($atom4)).toThrowError(GeneratorPromiseExpectedAtomError);
  expect(() => read($atom5)).toThrowError(GeneratorPromiseExpectedAtomError);
});
