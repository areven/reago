// =============================================================================
// useReadAsyncAtom hook
// =============================================================================

import ReactExports from 'react';
import {deasync, type AnyAtom, type AtomFamilyArgsOf, type AtomResultOf} from 'reago';
import {useReadAtom} from './use-read-atom';
import {isPromiseLike} from './util';


export function useReadAsyncAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): Awaited<AtomResultOf<T>> {
  const value = useReadAtom(atom, ...args);

  if (isPromiseLike(value)) {
    return use(value) as Awaited<AtomResultOf<T>>;
  } else {
    return value as Awaited<AtomResultOf<T>>;
  }
}

function use<T>(promise: PromiseLike<T>): Awaited<T> {
  const unpacked = deasync(promise);

  if (unpacked.status === 'resolved') {
    return unpacked.result;
  } else if (unpacked.status === 'rejected') {
    throw unpacked.error;
  } else if ((ReactExports as any).use) {
    return (ReactExports as any).use(promise);
  } else {
    throw promise;
  }
}
