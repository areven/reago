// =============================================================================
// atomReducer hook
// =============================================================================

import {
  requireComputationContext, requireComputationContextStackFrame, runWithoutComputationContext
} from '~/reactor/computation-context';
import {compareEqual} from '~/util/comparison';
import type {AtomHookFrame} from '~/core/atom-hook';


export interface AtomReducerFrame<Value, ActionArgs extends any[]> extends AtomHookFrame {
  data: AtomReducer<Value, ActionArgs>;
}

export type AtomReducer<Value, ActionArgs extends any[] = any[]> = [Value, AtomReducerDispatcher<ActionArgs>];
export type AtomReducerReducer<Value, ActionArgs extends any[]> = (prevState: Value, ...args: ActionArgs) => Value;
export type AtomReducerDispatcher<ActionArgs extends any[]> = (...args: ActionArgs) => void;

export function atomReducer<Value, ActionArgs extends any[] = any[]>(
  reducer: AtomReducerReducer<Value, ActionArgs>,
  initialArg: Value,
  init?: (initialArg: Value) => Value
): AtomReducer<Value, ActionArgs> {
  const {supervisor, instance} = requireComputationContext();

  const frame = requireComputationContextStackFrame<AtomReducerFrame<Value, ActionArgs>>(atomReducer, () => {
    let value;
    if (init) {
      runWithoutComputationContext(() => {
        value = init(initialArg);
      });
    } else {
      value = initialArg;
    }

    const dispatcher = (...args: ActionArgs): void => {
      const next = reducer(frame.data[0], ...args);
      if (compareEqual(frame.data[0], next)) return;
      frame.data = [next, frame.data[1]];
      supervisor.invalidateInstance(instance);
    };

    return {
      hook: atomReducer,
      data: [value!, dispatcher]
    };
  });

  return frame.data;
}
