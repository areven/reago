// =============================================================================
// atomEffect hook
// =============================================================================

import {AtomHookFrame} from '~/atom';
import {requireComputationContextStackFrame} from '~/reactor/computation-context';
import {compareDepsEqual} from '~/util/comparison';


export interface AtomEffectFrame extends AtomHookFrame {
  setup?: AtomEffect; // present if the setup should run, removed after it's "loaded"
  cleanup?: AtomEffectCleanup; // present if there is a cleanup function that should eventually run
  dependencies?: unknown[];
}

export type AtomEffect = () => (void | AtomEffectCleanup);
export type AtomEffectCleanup = () => void;

export function atomEffect(
  setup: AtomEffect,
  dependencies?: unknown[]
): void {
  const frame = requireComputationContextStackFrame<AtomEffectFrame>(atomEffect, (context) => {
    const frame: AtomEffectFrame = {
      hook: atomEffect,
      setup,
      dependencies
    };
    context.instance.stackSideEffect.push(frame);
    return frame;
  });

  if (!dependencies || !frame.dependencies || !compareDepsEqual(frame.dependencies, dependencies)) {
    frame.setup = setup;
    frame.dependencies = dependencies;
  }
}

atomEffect.onSkip = (frame: AtomEffectFrame): void => {
  // force unload of the previous effect
  frame.setup = () => {};

  // set dependencies to something that won't match anything user provided
  frame.dependencies = [{}];
};
