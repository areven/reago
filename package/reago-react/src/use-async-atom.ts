// =============================================================================
// useAsyncAtom hook
// =============================================================================

import {useDispatchAtom} from './use-dispatch-atom';
import {useReadAsyncAtom} from './use-read-async-atom';
import type {AnyAtom, AtomFamilyArgsOf, dispatch} from 'reago';


export function useAsyncAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): [
  ReturnType<typeof useReadAsyncAtom<T>>,
  ReturnType<typeof dispatch<T>>
] {
  return [
    useReadAsyncAtom(atom, ...args),
    useDispatchAtom(atom, ...args)
  ];
}
