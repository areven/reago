// =============================================================================
// Atom watcher
// =============================================================================

import {METADATA} from '~/const';
import {AnyAtom} from './atom';
import {AtomInstance} from './atom-instance';
import {Supervisor} from '~/space/supervisor';


export type AtomWatcher<T extends AnyAtom = AnyAtom> = {
  [METADATA]: {
    readonly supervisor: Supervisor,
    readonly instance: AtomInstance<T>,
    readonly listener: AtomListener<T>
  } | undefined,
  readonly clear: () => void,
  readonly [Symbol.dispose]: () => void
};

export type AtomListener<T extends AnyAtom = AnyAtom> = () => any;

export function createAtomWatcher<T extends AnyAtom = AnyAtom>(
  supervisor: Supervisor,
  instance: AtomInstance<T>,
  listener: AtomListener<T>
): AtomWatcher<T> {
  const watcher: AtomWatcher<T> = {
    [METADATA]: {
      supervisor,
      instance,
      listener,
    },
    clear: () => {
      // don't use the function args here or you'll cause a memory leak
      if (watcher[METADATA]) {
        const {supervisor, instance} = watcher[METADATA];
        watcher[METADATA] = undefined; // allow gc to collect it
        if (instance.watchers.delete(watcher)) {
          if (instance.watchers.size === 0) {
            supervisor.unmountInstance(instance);
            supervisor.flush();
          }
        }
      }
    },
    [Symbol.dispose]: () => {
      watcher.clear();
    }
  };
  return watcher;
}
