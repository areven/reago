// =============================================================================
// read hook
// =============================================================================

import {MOUNTED_TRANSITIVELY, UNMOUNTED} from '~/const';
import {requireComputationContext} from '~/reactor/computation-context';
import type {AnyAtom, AtomFamilyArgsOf, AtomResultOf} from '~/core/atom';


export function _read<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomResultOf<T> {
  const context = requireComputationContext();
  const targetInstance = context.supervisor.getOrCreateInstance(atom, ...args);

  // register it as a dependency and mount the subgraph if needed
  if (!context.computation.abortController.signal.aborted) {
    context.instance.dependencies.add(targetInstance);
    targetInstance.dependants.add(context.instance);

    if (context.instance.mount !== UNMOUNTED && targetInstance.mount === UNMOUNTED) {
      context.supervisor.mountInstance(targetInstance, MOUNTED_TRANSITIVELY);
    }
  }

  // calculate the target value, possibly invalidating its dependants (including us!)
  context.supervisor.syncInstance(targetInstance);

  // store it as a dependency in the computation itself, indicating that from now on
  // the computation relies on target's value and should be notified of changes
  context.computation.dependencies.add(targetInstance);

  // returns the already calculated value
  return context.supervisor.readInstance(targetInstance);
}
