// =============================================================================
// atomRef hook
// =============================================================================

import {AtomHookFrame} from '~/core/atom-hook';
import {requireComputationContextStackFrame} from '~/reactor/computation-context';


export interface AtomRefFrame<Value> extends AtomHookFrame {
  readonly data: AtomRef<Value>;
}

export interface AtomRef<Value> {
  current: Value;
}

export function atomRef<Value>(
  initialValue: Value
): AtomRef<Value> {
  const frame = requireComputationContextStackFrame<AtomRefFrame<Value>>(atomRef, () => ({
    hook: atomRef,
    data: {
      current: initialValue
    }
  }));

  return frame.data;
}
