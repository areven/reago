// =============================================================================
// Public dispatch() API
// =============================================================================

import {AnyAtom, AtomDispatcher, AtomFamilyArgsOf} from '~/core/atom';
import {IllegalOperationAtomError} from '~/error';
import {getCallbackContext} from '~/reactor/callback-context';
import {getComputationContext} from '~/reactor/computation-context';
import {getDefaultStore} from './store';


export function dispatch<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomDispatcher<T> {
  if (getComputationContext() !== null) {
    throw new IllegalOperationAtomError();
  } else if (getCallbackContext() !== null) {
    const {supervisor} = getCallbackContext()!;
    return supervisor.store.dispatch(atom, ...args);
  } else {
    return getDefaultStore().dispatch(atom, ...args);
  }
}
