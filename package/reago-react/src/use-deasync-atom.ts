// =============================================================================
// useDeasyncAtom hook
// =============================================================================

import {useDispatchAtom} from './use-dispatch-atom';
import {useReadDeasyncAtom} from './use-read-deasync-atom';
import type {AnyAtom, AtomFamilyArgsOf, dispatch} from 'reago';


export function useDeasyncAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): [
  ReturnType<typeof useReadDeasyncAtom<T>>,
  ReturnType<typeof dispatch<T>>
] {
  return [
    useReadDeasyncAtom(atom, ...args),
    useDispatchAtom(atom, ...args)
  ];
}
