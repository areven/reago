// =============================================================================
// atomMountEffect hook
// =============================================================================

import {LOADED, UNLOADED} from '~/const';
import {requireComputationContextStackFrame} from '~/reactor/computation-context';
import {compareDepsEqual} from '~/util/comparison';
import type {AtomHook, AtomHookFrame} from '~/core/atom-hook';


export interface AtomMountEffectFrame extends AtomHookFrame {
  status: typeof UNLOADED | typeof LOADED; // status of the current `setup` func
  setup: AtomMountEffect;
  cleanup?: AtomMountEffectCleanup; // present if there is a cleanup function that should eventually run
  dependencies: unknown[];
}

export type AtomMountEffect = () => (void | AtomMountEffectCleanup);
export type AtomMountEffectCleanup = () => void;

export function atomMountEffect(
  setup: AtomMountEffect,
  dependencies: unknown[]
): void {
  const frame = requireComputationContextStackFrame<AtomMountEffectFrame>(atomMountEffect, (context) => {
    const frame: AtomMountEffectFrame = {
      hook: atomMountEffect,
      status: UNLOADED,
      setup,
      dependencies
    };
    context.instance.stackMountEffect.push(frame);
    return frame;
  });

  if (!compareDepsEqual(frame.dependencies, dependencies)) {
    frame.status = UNLOADED;
    frame.setup = setup;
    frame.dependencies = dependencies;
  }
}

(atomMountEffect as AtomHook).onSkip = (frame: AtomMountEffectFrame) => {
  // force unload of the previous effect
  frame.status = UNLOADED;
  frame.setup = () => {};

  // set dependencies to something that won't match anything user provided
  frame.dependencies = [{}];
};
