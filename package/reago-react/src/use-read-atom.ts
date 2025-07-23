// =============================================================================
// useReadAtom hook
// =============================================================================

import {useDebugValue, useEffect, useReducer} from 'react';
import {useStore} from './use-store';
import type {AnyAtom, AtomFamilyArgsOf, AtomResultOf} from 'reago';


export function useReadAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): AtomResultOf<T> {
  // read current value from the store
  const store = useStore();
  const value = store.read(atom, ...args);

  // allow triggering a re-render on demand
  const [_tick, refresh] = useReducer((x: number) => x + 1, 0);

  // listen to value changes
  useEffect(() => {
    // value might have changed before useEffect had a chance to fire
    if (!Object.is(value, store.read(atom, ...args))) {
      refresh();
    }

    // setup a watcher even if value changed - it might revert before `useReadAsyncAtom`
    // runs again, in which case useEffect dependencies will remain the same
    const watcher = store.watch(atom, ...args, refresh);
    return () => watcher.clear();
  }, [store, atom, JSON.stringify(args), value]);

  // that's it
  useDebugValue(value);
  return value;
}
