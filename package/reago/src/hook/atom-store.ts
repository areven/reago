// =============================================================================
// atomStore hook
// =============================================================================

import {requireComputationContext, requireComputationContextStackFrame} from '~/reactor/computation-context';
import type {Store} from '~/api/store';


export function atomStore(): Store {
  requireComputationContextStackFrame(
    atomStore,
    () => ({hook: atomStore})
  );

  return requireComputationContext().supervisor.store;
}
