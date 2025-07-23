// =============================================================================
// useReadAsyncAtom hook
// =============================================================================

import {useEffect, useMemo, useReducer} from 'react';
import {deasync} from 'reago';
import {useReadAtom} from './use-read-atom';
import {isPromiseLike} from './util';
import type {AnyAtom, AtomFamilyArgsOf, AtomResultOf, DeasyncState} from 'reago';


export function useReadDeasyncAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): DeasyncStateOf<T> {
  const result = useReadAtom(atom, ...args);
  const [_tick, refresh] = useReducer((x: number) => x + 1, 0);

  const unpacked = (
    isPromiseLike(result) ?
      deasync(result) :
      {status: 'resolved', result} // `result` could be an atom, so build the obj manually
  ) as DeasyncStateOf<T>;

  useEffect(() => {
    let relevant = true;

    if (unpacked.status === 'pending') {
      const callback = (): void => {
        if (relevant) {
          refresh();
        }
      };

      (result as PromiseLike<unknown>).then(callback, callback);
    }

    return () => {
      relevant = false;
    };
  }, [unpacked.status, result]);

  return useMemo(
    () => unpacked,
    [
      unpacked.status,
      (unpacked as any).result,
      (unpacked as any).error
    ]
  );
}

type DeasyncStateOf<T extends AnyAtom> = DeasyncState<Awaited<AtomResultOf<T>>>;
