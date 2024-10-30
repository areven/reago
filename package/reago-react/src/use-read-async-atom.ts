// =============================================================================
// useReadAsyncAtom hook
// =============================================================================

import ReactExports, {useDebugValue, useEffect, useReducer} from 'react';
import {deasync, type AnyAtom, type AtomFamilyArgsOf, type AtomResultOf} from 'reago';
import {useStore} from './use-store';
import {isPromiseLike} from './util';


export function useReadAsyncAtom<T extends AnyAtom>(
  atom: T,
  ...args: AtomFamilyArgsOf<T>
): Awaited<AtomResultOf<T>> {
  // read current value from the store
  const store = useStore();
  const value = store.read(atom, ...args);

  // allow triggering a re-render on demand
  const [_tick, refresh] = useReducer(x => x + 1, 0);

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
