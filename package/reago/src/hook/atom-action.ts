// =============================================================================
// atomAction hook
// =============================================================================

import {AtomActionArg} from '~/core/atom';
import {AtomHookFrame} from '~/core/atom-hook';
import {requireComputationContextStackFrame} from '~/reactor/computation-context';
import {compareDepsEqual} from '~/util/comparison';


export interface AtomActionFrame extends AtomHookFrame {
  handler: AtomAction;
  dependencies: unknown[];
}

export type AtomAction = (...args: AtomActionArg[]) => void;

export function atomAction(
  handler: AtomAction,
  dependencies: unknown[]
): void {
  const frame = requireComputationContextStackFrame<AtomActionFrame>(atomAction, (context) => {
    const frame: AtomActionFrame = {
      hook: atomAction,
      handler,
      dependencies
    };
    context.instance.stackAction.push(frame);
    return frame;
  });

  if (!compareDepsEqual(frame.dependencies, dependencies)) {
    frame.handler = handler;
    frame.dependencies = dependencies;
  }
}

atomAction.onSkip = (frame: AtomActionFrame): void => {
  // disable current handler
  frame.handler = () => {};

  // set dependencies to something that won't match anything user provided
  frame.dependencies = [{}];
};
