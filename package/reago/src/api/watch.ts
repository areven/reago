// =============================================================================
// Public watch() API
// =============================================================================

import {IllegalOperationAtomError} from '~/error';
import {_read} from '~/hook/read';
import {getCallbackContext} from '~/reactor/callback-context';
import {getComputationContext} from '~/reactor/computation-context';
import {getDefaultStore} from './store';
import type {AnyAtom, AtomFamilyArgsOf} from '~/core/atom';
import type {AtomListener, AtomWatcher} from '~/core/atom-watcher';


export function watch<T extends AnyAtom>(
  atom: T,
  ...args: [...AtomFamilyArgsOf<T>, AtomListener<T>]
): AtomWatcher<T> {
  if (getComputationContext() !== null) {
    throw new IllegalOperationAtomError();
  } else if (getCallbackContext() !== null) {
    const {supervisor} = getCallbackContext()!;
    return supervisor.store.watch(atom, ...args);
  } else {
    return getDefaultStore().watch(atom, ...args);
  }
}
