// =============================================================================
// Public invalidate() API
// =============================================================================

import {AnyAtom, AtomFamilyArgsOf} from '~/core/atom';
import {IllegalOperationAtomError} from '~/error';
import {getCallbackContext} from '~/reactor/callback-context';
import {getComputationContext} from '~/reactor/computation-context';
import {getDefaultStore} from './store';


export function invalidate<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): void {
  if (getComputationContext() !== null) {
    throw new IllegalOperationAtomError();
  } else if (getCallbackContext() !== null) {
    const {supervisor} = getCallbackContext()!;
    supervisor.store.invalidate(atom, ...args);
  } else {
    getDefaultStore().invalidate(atom, ...args);
  }
}
