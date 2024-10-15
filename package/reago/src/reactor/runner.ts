// =============================================================================
// Atom runner
// =============================================================================

import {AnyAtom, AtomFamilyArgsOf, AtomGenerator, AtomResultOf} from '~/atom';
import {FUNCTIONAL_ATOM} from '~/const';
import {isGenerator} from '~/util/type-check';


export interface AtomRunner<T extends AnyAtom> {
  (...args: AtomFamilyArgsOf<T>): AtomRunnerGenerator<AtomResultOf<T>>;
}

export type AtomRunnerGenerator<Result> = AtomGenerator<Result> & {
  readonly [FUNCTIONAL_ATOM]?: true;
};

export type AtomRunnerStep<Result> = IteratorResult<Promise<unknown>, Result>;

export function createRunner<T extends AnyAtom>(atom: T): AtomRunner<T> {
  return function (...args: any[]) {
    const result = atom(...args);
    if (isGenerator(result)) {
      return result;
    } else {
      return {
        [FUNCTIONAL_ATOM]: true,
        next() {
          return {done: true, value: result as AtomResultOf<T>};
        },
        return() {
          return {done: true, value: undefined as AtomResultOf<T>};
        },
        throw() {
          return {done: true, value: undefined as AtomResultOf<T>};
        },
        [Symbol.iterator]() {
          return this;
        }
      } as unknown as AtomRunnerGenerator<AtomResultOf<T>>;
    }
  };
}
