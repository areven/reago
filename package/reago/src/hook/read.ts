// =============================================================================
// read hook
// =============================================================================

import {MOUNTED_TRANSITIVELY, UNMOUNTED} from '~/const';
import {AnyAtom, AnyFunctionalAtom, AnyGenerativeAtom, AtomFamilyArgsOf, AtomResultOf} from '~/core/atom';
import {requireComputationContext} from '~/reactor/computation-context';


export function _read<T extends AnyGenerativeAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): Promise<AtomResultOf<T>>;
export function _read<T extends AnyFunctionalAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): AtomResultOf<T>;
export function _read<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomResultOf<T> | Promise<AtomResultOf<T>> {
  const context = requireComputationContext();
  const targetInstance = context.supervisor.requireInstance(atom, ...args);

  if (!context.computation.abortController.signal.aborted) {
    context.computation.dependencies.add(targetInstance);
    context.instance.dependencies.add(targetInstance);
    targetInstance.dependants.add(context.instance);

    if (context.instance.mount !== UNMOUNTED && targetInstance.mount === UNMOUNTED) {
      context.supervisor.mountInstance(targetInstance, MOUNTED_TRANSITIVELY);
    }
  }

  return context.supervisor.readInstance(targetInstance);
}
