// =============================================================================
// atomAbortSignal hook
// =============================================================================

import {requireComputationContext, requireComputationContextStackFrame} from '~/reactor/computation-context';


export function atomAbortSignal(): AbortSignal {
  const {computation} = requireComputationContext();
  requireComputationContextStackFrame(
    atomAbortSignal,
    () => ({hook: atomAbortSignal})
  );

  return computation.abortController.signal;
}
