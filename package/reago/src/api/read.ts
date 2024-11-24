// =============================================================================
// Public read() API
// =============================================================================

import {_read} from '~/hook/read';
import {getCallbackContext} from '~/reactor/callback-context';
import {getComputationContext} from '~/reactor/computation-context';
import {getDefaultStore} from './store';
import type {AnyAtom, AtomFamilyArgsOf, AtomResultOf} from '~/core/atom';


export function read<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomResultOf<T> {
  if (getComputationContext() !== null) {
    return _read(atom, ...args);
  } else if (getCallbackContext() !== null) {
    const {supervisor} = getCallbackContext()!;
    return supervisor.store.read(atom, ...args);
  } else {
    return getDefaultStore().read(atom, ...args);
  }
}
