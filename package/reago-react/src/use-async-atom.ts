// =============================================================================
// useAsyncAtom hook
// =============================================================================

import {useDispatchAtom} from './use-dispatch-atom';
import {useReadAsyncAtom} from './use-read-async-atom';
import type {AnyAtom, AtomFamilyArgsOf, AtomResultOf, dispatch} from 'reago';


export function useAsyncAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): [
  Awaited<AtomResultOf<T>>,
  ReturnType<typeof dispatch<T>>
] {
  return [
    useReadAsyncAtom(atom, ...args),
    useDispatchAtom(atom, ...args)
  ];
}
