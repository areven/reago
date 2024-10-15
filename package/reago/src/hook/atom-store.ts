// =============================================================================
// atomStore hook
// =============================================================================

import {Store} from '~/api/store';
import {requireComputationContext, requireComputationContextStackFrame} from '~/reactor/computation-context';


export function atomStore(): Store {
  requireComputationContextStackFrame(
    atomStore,
    () => ({hook: atomStore})
  );

  return requireComputationContext().supervisor.store;
}
