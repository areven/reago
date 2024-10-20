// =============================================================================
// atomMemo hook
// =============================================================================

import {PENDING, REJECTED, RESOLVED} from '~/const';
import {requireComputationContextStackFrame, runWithoutComputationContext} from '~/reactor/computation-context';
import {compareDepsEqual} from '~/util/comparison';
import type {AtomHookFrame} from '~/core/atom-hook';


export interface AtomMemoFrame<Value> extends AtomHookFrame {
  status: typeof PENDING | typeof RESOLVED | typeof REJECTED;
  value?: Value;
  error?: unknown;
  dependencies: unknown[];
}

export function atomMemo<Value>(
  calculateValue: () => Value,
  dependencies: unknown[]
): Value {
  const frame = requireComputationContextStackFrame<AtomMemoFrame<Value>>(atomMemo, () => ({
    hook: atomMemo,
    status: PENDING,
    dependencies
  }));

  if (frame.status === PENDING || !compareDepsEqual(frame.dependencies, dependencies)) {
    frame.dependencies = dependencies;
    try {
      runWithoutComputationContext(() => {
        frame.value = calculateValue();
      });
      frame.status = RESOLVED;
      delete frame.error;
    } catch (err) {
      frame.error = err;
      frame.status = REJECTED;
      delete frame.value;
    }
  }

  if (frame.status === RESOLVED) {
    return frame.value!;
  } else {
    throw frame.error;
  }
}
