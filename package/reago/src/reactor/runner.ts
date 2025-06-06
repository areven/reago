// =============================================================================
// Reactor runner
// =============================================================================

import {FUNCTIONAL_ATOM} from '~/const';
import {isGenerator} from '~/util/type-check';
import type {AnyAtom, AtomFamilyArgsOf, AtomGenerator, AtomImplResultOf} from '~/core/atom';


export interface Runner<T extends AnyAtom> {
  (...args: AtomFamilyArgsOf<T>): RunnerGenerator<AtomImplResultOf<T>>;
}

export type RunnerGenerator<Result> = AtomGenerator<Result> & {
  readonly [FUNCTIONAL_ATOM]?: true;
};

export type RunnerStep<Result> = IteratorResult<PromiseLike<unknown>, Result>;

export function createRunner<T extends AnyAtom>(atom: T): Runner<T> {
  return function (...args: any[]) {
    const result = atom(...args);
    if (isGenerator(result)) {
      return result;
    } else {
      return {
        [FUNCTIONAL_ATOM]: true,
        next() {
          return {done: true, value: result as AtomImplResultOf<T>};
        }
      } as unknown as RunnerGenerator<AtomImplResultOf<T>>;
    }
  };
}
