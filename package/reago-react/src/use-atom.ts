// =============================================================================
// useAtom hook
// =============================================================================

import {useDispatchAtom} from './use-dispatch-atom';
import {useReadAtom} from './use-read-atom';
import type {AnyAtom, AtomFamilyArgsOf, dispatch} from 'reago';


export function useAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): [
  ReturnType<typeof useReadAtom<T>>,
  ReturnType<typeof dispatch<T>>
] {
  return [
    useReadAtom(atom, ...args),
    useDispatchAtom(atom, ...args)
  ];
}
