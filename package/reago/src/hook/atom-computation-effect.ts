// =============================================================================
// atomComputationEffect hook
// =============================================================================

import {METADATA} from '~/const';
import {requireComputationContextStackFrame} from '~/reactor/computation-context';
import {compareDepsEqual} from '~/util/comparison';
import type {AtomHook, AtomHookFrame} from '~/core/atom-hook';


export interface AtomComputationEffectFrame extends AtomHookFrame {
  setup?: AtomComputationEffect; // present if the setup should run, removed after it's "loaded"
  cleanup?: AtomComputationEffectCleanup; // present if there is a cleanup function that should eventually run
  dependencies?: unknown[];
}

export type AtomComputationEffect = () => (void | AtomComputationEffectCleanup);
export interface AtomComputationEffectCleanup {
  (): void;
  [METADATA]?: {
    token: WeakKey;
  };
}

export function atomComputationEffect(
  setup: AtomComputationEffect,
  dependencies?: unknown[]
): void {
  const frame = requireComputationContextStackFrame<AtomComputationEffectFrame>(atomComputationEffect, (context) => {
    const frame: AtomComputationEffectFrame = {
      hook: atomComputationEffect,
      setup,
      dependencies
    };
    context.instance.stackComputationEffect.push(frame);
    return frame;
  });

  if (!dependencies || !frame.dependencies || !compareDepsEqual(frame.dependencies, dependencies)) {
    frame.setup = setup;
    frame.dependencies = dependencies;
  }
}

(atomComputationEffect as AtomHook).onSkip = (frame: AtomComputationEffectFrame): void => {
  // force unload of the previous effect
  frame.setup = () => {};

  // set dependencies to something that won't match anything user provided
  frame.dependencies = [{}];
};
