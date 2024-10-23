// =============================================================================
// Reactor computation
// =============================================================================

import {FUNCTIONAL_ATOM, GENERATIVE_ATOM, NO_VALUE, REJECTED, RESOLVED} from '~/const';
import {ComputationAbortedAtomError, GeneratorPromiseExpectedAtomError} from '~/error';
import {Supervisor} from '~/space/supervisor';
import {getPromiseState, trackPromise, type PromiseState} from '~/util/tracked-promise';
import {isPromiseLike} from '~/util/type-check';
import {runWithComputationContext, type ComputationContext} from './computation-context';
import {createRunner, type RunnerGenerator, type RunnerStep} from './runner';
import type {AnyAtom, AtomResultOf} from '~/core/atom';
import type {AtomInstance} from '~/core/atom-instance';


export interface Computation<T extends AnyAtom> {
  /**
   * Computation mode - functional or generative.
   */
  mode: typeof FUNCTIONAL_ATOM | typeof GENERATIVE_ATOM;

  /**
   * Value of the atom or NO_VALUE if atom is not computed yet.
   */
  result: AtomResultOf<T> | typeof NO_VALUE;

  /**
   * Error thrown during the computation or NO_VALUE if there was no error.
   */
  error: unknown | typeof NO_VALUE;

  /**
   * Promise that tracks the state of an async computation.
   *
   * It's present only if the computation turned out to be async. Note that
   * only generative atoms can compute asynchronously, but not all of them will.
   */
  promise?: Promise<void>;

  /**
   * Abort controller for the computation.
   */
  abortController: AbortController;

  /**
   * Pointer to the current stack frame, for hooks.
   */
  pointer: number;

  /**
   * Set of atom instance dependencies.
   *
   * These are atom instances that were referenced during this computation.
   */
  dependencies: Set<AtomInstance<AnyAtom>>;
}

export function createComputation<T extends AnyAtom>(): Computation<T> {
  return {
    mode: FUNCTIONAL_ATOM,
    result: NO_VALUE,
    error: NO_VALUE,
    abortController: new AbortController(),
    pointer: 0,
    dependencies: new Set()
  };
}

export function runComputation<T extends AnyAtom>(
  supervisor: Supervisor,
  instance: AtomInstance<T>,
  computation: Computation<T>
): void {
  // Set up the environment
  const context: ComputationContext<T> = {
    supervisor,
    instance,
    computation
  };

  // Get the runner generator
  let generator: RunnerGenerator<AtomResultOf<T>>;
  try {
    runWithComputationContext(context, () => {
      generator = createRunner<T>(instance.atom)(...instance.args);
    });
  } catch (err) {
    storeComputationError(computation, err);
    return;
  }

  if (generator![FUNCTIONAL_ATOM] !== true) {
    computation.mode = GENERATIVE_ATOM;
  }

  // Try to compute it synchronously first
  let stepPromise = runComputationSynchronousSteps(context, generator!, 'next');
  if (stepPromise === null) {
    return;
  }

  // Compute the remaining steps asynchronously
  computation.promise = (async () => {
    while (stepPromise !== null) {
      let method: 'next' | 'throw', value: unknown;
      try {
        value = await stepPromise;
        method = 'next';
      } catch (err) {
        value = err;
        method = 'throw';
      }
      stepPromise = runComputationSynchronousSteps(context, generator!, method, value);
    }
  })();
}

function runComputationSynchronousSteps<T extends AnyAtom>(
  context: ComputationContext<T>,
  generator: RunnerGenerator<AtomResultOf<T>>,
  method: 'next' | 'throw',
  value: unknown = undefined
): null | PromiseLike<unknown> {
  let step = runComputationStep(context, generator, method, value);
  if (step === null) return null;

  do {
    if (!isPromiseLike(step.value)) {
      storeComputationError(
        context.computation,
        new GeneratorPromiseExpectedAtomError(step.value)
      );
      return null;
    }

    trackPromise(step.value);
    const promiseState: PromiseState = getPromiseState(step.value);

    if (promiseState.status === RESOLVED) {
      step = runComputationStep(context, generator, 'next', promiseState.result);
      if (step === null) return null;
    } else if (promiseState.status === REJECTED) {
      step = runComputationStep(context, generator, 'throw', promiseState.error);
      if (step === null) return null;
    } else {
      // ugh, async computation needed
      return step.value;
    }
  } while (true);
}

function runComputationStep<T extends AnyAtom>(
  context: ComputationContext<T>,
  generator: RunnerGenerator<AtomResultOf<T>>,
  method: 'next' | 'throw',
  value: unknown = undefined
): null | RunnerStep<AtomResultOf<T>> {
  let result = null;
  runWithComputationContext(context, () => {
    if (context.computation.abortController.signal.aborted) {
      // if the computation is prematurely aborted, allow the generator to clean
      // up its resources using a try .. finally block
      try {
        generator.return(undefined as AtomResultOf<T>);
      } catch (err) {
        // swallow errors, they're irrelevant
      }
      storeComputationAborted(context.computation);
      return;
    }

    let step;
    try {
      step = generator[method](value);
    } catch (err) {
      storeComputationError(context.computation, err);
      return;
    }

    if (step.done) {
      storeComputationResult(context.computation, step.value);
      return;
    }

    result = step;
  });
  return result;
}

function storeComputationResult<T extends AnyAtom>(computation: Computation<T>, result: AtomResultOf<T>): void {
  computation.result = result;
}

function storeComputationError<T extends AnyAtom>(computation: Computation<T>, error: unknown): void {
  computation.error = error;
}

function storeComputationAborted<T extends AnyAtom>(computation: Computation<T>): void {
  computation.error = new ComputationAbortedAtomError();
}
