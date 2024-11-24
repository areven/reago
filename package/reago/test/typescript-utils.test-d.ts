// =============================================================================
// TypeScript utils type tests
// =============================================================================

import {expectTypeOf, test} from 'vitest';
import type {Atom, AtomActionArgsOf, AtomFamilyArgsOf, AtomResultOf} from 'reago';


test('AtomResultOf works with hand-written atom signatures', () => {
  expectTypeOf<AtomResultOf<Atom<number>>>().toEqualTypeOf<number>();
  expectTypeOf<AtomResultOf<Atom<null>>>().toEqualTypeOf<null>();
  expectTypeOf<AtomResultOf<Atom<undefined>>>().toEqualTypeOf<undefined>();
  expectTypeOf<AtomResultOf<Atom<Promise<number>>>>().toEqualTypeOf<Promise<number>>();
  expectTypeOf<AtomResultOf<Atom<Promise<Promise<number>>>>>().toEqualTypeOf<Promise<Promise<number>>>();
});

test('AtomResultOf works with atom definitions', () => {
  function $atom1() {
    return 123;
  }

  function $atom2() {
    return Promise.resolve(123);
  }

  function* $atom3() {
    return 123;
  }

  function* $atom4() {
    return Promise.resolve(123);
  }

  expectTypeOf<AtomResultOf<typeof $atom1>>().toEqualTypeOf<number>();
  expectTypeOf<AtomResultOf<typeof $atom2>>().toEqualTypeOf<Promise<number>>();
  expectTypeOf<AtomResultOf<typeof $atom3>>().toEqualTypeOf<Promise<number>>();
  expectTypeOf<AtomResultOf<typeof $atom4>>().toEqualTypeOf<Promise<Promise<number>>>();
});

test('AtomResultOf works with annotated atom definitions', () => {
  const $atom1: Atom<number> = () => 123;
  const $atom2: Atom<Promise<string>> = function* () {
    return 'hi!';
  };

  expectTypeOf<AtomResultOf<typeof $atom1>>().toEqualTypeOf<number>();
  expectTypeOf<AtomResultOf<typeof $atom2>>().toEqualTypeOf<Promise<string>>();
});

test('AtomFamilyArgsOf works with hand-written atom signatures', () => {
  expectTypeOf<AtomFamilyArgsOf<Atom<number>>>().toEqualTypeOf<[]>();
  expectTypeOf<AtomFamilyArgsOf<Atom<number, []>>>().toEqualTypeOf<[]>();
  expectTypeOf<AtomFamilyArgsOf<Atom<number, [string]>>>().toEqualTypeOf<[string]>();
  expectTypeOf<AtomFamilyArgsOf<Atom<number, [string, number]>>>().toEqualTypeOf<[string, number]>();
  expectTypeOf<AtomFamilyArgsOf<Atom<number, string[]>>>().toEqualTypeOf<string[]>();
});

test('AtomFamilyArgsOf works with atom definitions', () => {
  const $atom1 = () => 'asd';
  const $atom2 = (n: number, s: string) => 456;

  expectTypeOf<AtomFamilyArgsOf<typeof $atom1>>().toEqualTypeOf<[]>();
  expectTypeOf<AtomFamilyArgsOf<typeof $atom2>>().toEqualTypeOf<[number, string]>();
});

test('AtomFamilyArgsOf works with annotated atom definitions', () => {
  const $atom1: Atom<number, [number, string]> = (n: number, s: string) => 456;

  expectTypeOf<AtomFamilyArgsOf<typeof $atom1>>().toEqualTypeOf<[number, string]>();
});

test('AtomActionArgsOf works with hand-written atom signatures', () => {
  expectTypeOf<AtomActionArgsOf<Atom<number>>>().toEqualTypeOf<never>();
  expectTypeOf<AtomActionArgsOf<Atom<number, []>>>().toEqualTypeOf<never>();
  expectTypeOf<AtomActionArgsOf<Atom<number, [], []>>>().toEqualTypeOf<[]>();
  expectTypeOf<AtomActionArgsOf<Atom<number, [], [string]>>>().toEqualTypeOf<[string]>();
  expectTypeOf<AtomActionArgsOf<Atom<number, [], [string, string]>>>().toEqualTypeOf<[string, string]>();
});

test('AtomActionArgsOf works with annotated atom definitions', () => {
  const $atom: Atom<number, [], [string]> = () => 456;
  expectTypeOf<AtomActionArgsOf<typeof $atom>>().toEqualTypeOf<[string]>();
});
