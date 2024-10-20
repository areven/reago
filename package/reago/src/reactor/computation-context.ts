// =============================================================================
// Reactor computation context
// =============================================================================

import {ComputationContextRequiredAtomError, HookCountMismatchAtomError, HookMismatchAtomError} from '~/error';
import {Supervisor} from '~/space/supervisor';
import type {AnyAtom} from '~/core/atom';
import type {AtomHook, AtomHookFrame} from '~/core/atom-hook';
import type {AtomInstance} from '~/core/atom-instance';
import type {Computation} from './computation';


const computationContextStack: (ComputationContext<AnyAtom> | null)[] = [];

export interface ComputationContext<T extends AnyAtom> {
  /**
   * Reference to the space supervisor.
   */
  readonly supervisor: Supervisor;

  /**
   * Reference to the currently active atom instance.
   */
  readonly instance: AtomInstance<T>;

  /**
   * Reference to the current computation.
   */
  readonly computation: Computation<T>;
}

export function runWithComputationContext(
  context: ComputationContext<AnyAtom>,
  fn: () => void
): void {
  computationContextStack.push(context);
  try {
    fn();
  } finally {
    computationContextStack.pop();
  }
}

export function runWithoutComputationContext(fn: () => void): void {
  computationContextStack.push(null);
  try {
    fn();
  } finally {
    computationContextStack.pop();
  }
}

export function getComputationContext(): ComputationContext<AnyAtom> | null {
  return computationContextStack.length > 0 ?
    computationContextStack[computationContextStack.length - 1] : null;
}

export function requireComputationContext(): ComputationContext<AnyAtom> {
  const context = getComputationContext();
  if (context === null) {
    throw new ComputationContextRequiredAtomError();
  }
  return context;
}

export function requireComputationContextStackFrame<T extends AtomHookFrame = AtomHookFrame>(
  hook: AtomHook,
  frameInitializer: (context: ComputationContext<AnyAtom>) => T
): T {
  const context = requireComputationContext();

  if (context.computation.pointer < context.instance.stack.length) {
    if (context.instance.stack[context.computation.pointer].hook !== hook) {
      throw new HookMismatchAtomError();
    }

    return context.instance.stack[context.computation.pointer++] as T;
  } else {
    if (context.instance.freezeStack) {
      throw new HookCountMismatchAtomError();
    }
    const frame = frameInitializer(context);
    context.computation.pointer++;
    context.instance.stack.push(frame);
    return frame;
  }
}
