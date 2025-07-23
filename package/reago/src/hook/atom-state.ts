// =============================================================================
// atomState hook
// =============================================================================

import {
  requireComputationContext, requireComputationContextStackFrame, runWithoutComputationContext
} from '~/reactor/computation-context';
import {compareEqual} from '~/util/comparison';
import type {AtomHookFrame} from '~/core/atom-hook';


export interface AtomStateFrame<Value> extends AtomHookFrame {
  data: AtomState<Value>;
}

export type AtomState<Value> = [Value, AtomStateSetter<Value>];
export type AtomStateSetter<Value> = (nextState: AtomStateSetterNextState<Value>) => void;
export type AtomStateSetterNextState<Value> = Value | ((prevState: Value) => Value);

export function atomState<Value>(
  initialState: Value | (() => Value)
): AtomState<Value> {
  const {supervisor, instance} = requireComputationContext();

  const frame = requireComputationContextStackFrame<AtomStateFrame<Value>>(atomState, () => {
    let value: Value;
    if (initialState instanceof Function) {
      runWithoutComputationContext(() => {
        value = initialState();
      });
    } else {
      value = initialState;
    }

    const setter = (nextState: AtomStateSetterNextState<Value>): void => {
      const next = nextState instanceof Function ? nextState(frame.data[0]) : nextState;
      if (compareEqual(frame.data[0], next)) return;
      frame.data = [next, frame.data[1]];
      supervisor.invalidateInstance(instance);
    };

    return {
      hook: atomState,
      data: [value!, setter]
    };
  });

  return frame.data;
}
