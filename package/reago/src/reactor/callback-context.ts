// =============================================================================
// Reactor callback context
// =============================================================================

import {Supervisor} from '~/space/supervisor';
import type {AnyAtom} from '~/core/atom';


const callbackContextStack: CallbackContext<AnyAtom>[] = [];

export interface CallbackContext<T extends AnyAtom> {
  /**
   * Reference to the space supervisor.
   */
  readonly supervisor: Supervisor;
}

export function runWithCallbackContext(
  context: CallbackContext<AnyAtom>,
  fn: () => void
): void {
  callbackContextStack.push(context);
  try {
    fn();
  } finally {
    callbackContextStack.pop();
  }
}

export function getCallbackContext(): CallbackContext<AnyAtom> | null {
  return callbackContextStack.length > 0 ? callbackContextStack[callbackContextStack.length - 1] : null;
}
