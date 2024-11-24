// =============================================================================
// TypeScript internals type tests
// =============================================================================

import {expectTypeOf, test} from 'vitest';
import type {Atom, AtomImplResultOf, AtomResultOf, FunctionalAtom, GenerativeAtom} from '~/core/atom';


test('AtomResultOf works for hand-written FunctionalAtom signatures', () => {
  expectTypeOf<AtomResultOf<FunctionalAtom<number>>>().toEqualTypeOf<number>();
  expectTypeOf<AtomResultOf<FunctionalAtom<null>>>().toEqualTypeOf<null>();
  expectTypeOf<AtomResultOf<FunctionalAtom<undefined>>>().toEqualTypeOf<undefined>();
  expectTypeOf<AtomResultOf<FunctionalAtom<Promise<number>>>>().toEqualTypeOf<Promise<number>>();
  expectTypeOf<AtomResultOf<FunctionalAtom<Promise<Promise<number>>>>>().toEqualTypeOf<Promise<Promise<number>>>();
});

test('AtomResultOf works for hand-written GenerativeAtom signatures', () => {
  expectTypeOf<AtomResultOf<GenerativeAtom<number>>>().toEqualTypeOf<Promise<number>>();
  expectTypeOf<AtomResultOf<GenerativeAtom<null>>>().toEqualTypeOf<Promise<null>>();
  expectTypeOf<AtomResultOf<GenerativeAtom<undefined>>>().toEqualTypeOf<Promise<undefined>>();
  expectTypeOf<AtomResultOf<GenerativeAtom<Promise<number>>>>().toEqualTypeOf<Promise<Promise<number>>>();
  expectTypeOf<
    AtomResultOf<GenerativeAtom<Promise<Promise<number>>>>
  >().toEqualTypeOf<Promise<Promise<Promise<number>>>>();
});

test('AtomImplResultOf works for hand-written Atom signatures', () => {
  expectTypeOf<AtomImplResultOf<Atom<number>>>().toEqualTypeOf<number>();
  expectTypeOf<AtomImplResultOf<Atom<null>>>().toEqualTypeOf<null>();
  expectTypeOf<AtomImplResultOf<Atom<undefined>>>().toEqualTypeOf<undefined>();
  expectTypeOf<AtomImplResultOf<Atom<Promise<number>>>>().toEqualTypeOf<number | Promise<number>>();
  expectTypeOf<
    AtomImplResultOf<Atom<Promise<Promise<number>>>>
  >().toEqualTypeOf<Promise<number> | Promise<Promise<number>>>();
});

test('AtomImplResultOf works for hand-written FunctionalAtom signatures', () => {
  expectTypeOf<AtomImplResultOf<FunctionalAtom<number>>>().toEqualTypeOf<number>();
  expectTypeOf<AtomImplResultOf<FunctionalAtom<null>>>().toEqualTypeOf<null>();
  expectTypeOf<AtomImplResultOf<FunctionalAtom<undefined>>>().toEqualTypeOf<undefined>();
  expectTypeOf<AtomImplResultOf<FunctionalAtom<Promise<number>>>>().toEqualTypeOf<Promise<number>>();
  expectTypeOf<
    AtomImplResultOf<FunctionalAtom<Promise<Promise<number>>>>
  >().toEqualTypeOf<Promise<Promise<number>>>();
});

test('AtomImplResultOf works for functional atom definitions', () => {
  const $atom1 = () => 123;
  const $atom2 = () => Promise.resolve(123);

  expectTypeOf<AtomImplResultOf<typeof $atom1>>().toEqualTypeOf<number>();
  expectTypeOf<AtomImplResultOf<typeof $atom2>>().toEqualTypeOf<Promise<number>>();
});

test('AtomImplResultOf works for hand-written GenerativeAtom signatures', () => {
  expectTypeOf<AtomImplResultOf<GenerativeAtom<number>>>().toEqualTypeOf<number>();
  expectTypeOf<AtomImplResultOf<GenerativeAtom<null>>>().toEqualTypeOf<null>();
  expectTypeOf<AtomImplResultOf<GenerativeAtom<undefined>>>().toEqualTypeOf<undefined>();
  expectTypeOf<AtomImplResultOf<GenerativeAtom<Promise<number>>>>().toEqualTypeOf<Promise<number>>();
  expectTypeOf<
    AtomImplResultOf<GenerativeAtom<Promise<Promise<number>>>>
  >().toEqualTypeOf<Promise<Promise<number>>>();
});

test('AtomImplResultOf works for generative atom definitions', () => {
  function* $atom1() {
    return 123;
  }

  function* $atom2() {
    return Promise.resolve(123);
  }

  expectTypeOf<AtomImplResultOf<typeof $atom1>>().toEqualTypeOf<number>();
  expectTypeOf<AtomImplResultOf<typeof $atom2>>().toEqualTypeOf<Promise<number>>();
});
