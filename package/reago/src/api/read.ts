// =============================================================================
// Public read() API
// =============================================================================

import {AnyAtom, AnyFunctionalAtom, AnyGenerativeAtom, AtomFamilyArgsOf, AtomResultOf} from '~/core/atom';
import {_read} from '~/hook/read';
import {getCallbackContext} from '~/reactor/callback-context';
import {getComputationContext} from '~/reactor/computation-context';
import {getDefaultStore} from './store';


export function read<T extends AnyGenerativeAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): Promise<AtomResultOf<T>>;
export function read<T extends AnyFunctionalAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): AtomResultOf<T>;
export function read<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomResultOf<T> | Promise<AtomResultOf<T>> {
  if (getComputationContext() !== null) {
    return _read(atom, ...args);
  } else if (getCallbackContext() !== null) {
    const {supervisor} = getCallbackContext()!;
    return supervisor.store.read(atom, ...args);
  } else {
    return getDefaultStore().read(atom, ...args);
  }
}
