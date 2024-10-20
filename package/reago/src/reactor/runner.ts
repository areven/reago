// =============================================================================
// Reactor runner
// =============================================================================

import {FUNCTIONAL_ATOM} from '~/const';
import {isGenerator} from '~/util/type-check';
import type {AnyAtom, AtomFamilyArgsOf, AtomGenerator, AtomResultOf} from '~/core/atom';


export interface Runner<T extends AnyAtom> {
  (...args: AtomFamilyArgsOf<T>): RunnerGenerator<AtomResultOf<T>>;
}

export type RunnerGenerator<Result> = AtomGenerator<Result> & {
  readonly [FUNCTIONAL_ATOM]?: true;
};

export type RunnerStep<Result> = IteratorResult<Promise<unknown>, Result>;

export function createRunner<T extends AnyAtom>(atom: T): Runner<T> {
  return function (...args: any[]) {
    const result = atom(...args);
    if (isGenerator(result)) {
      return result;
    } else {
      return {
        [FUNCTIONAL_ATOM]: true,
        next() {
          return {done: true, value: result as AtomResultOf<T>};
        }
      } as unknown as RunnerGenerator<AtomResultOf<T>>;
    }
  };
}
