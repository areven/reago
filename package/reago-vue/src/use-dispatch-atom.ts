// =============================================================================
// useDispatchAtom hook
// =============================================================================

import {useMemo} from 'react';
import {useStore} from './use-store';
import type {AnyAtom, AtomFamilyArgsOf, dispatch} from 'reago';


export function useDispatchAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): ReturnType<typeof dispatch<T>> {
  const store = useStore();

  return useMemo(
    () => store.dispatch(atom, ...args),
    [store, atom, JSON.stringify(args)]
  );
}
