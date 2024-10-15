// =============================================================================
// Public store API
// =============================================================================

import {AtomStore} from '~/space/store';
import {AtomSupervisor} from '~/space/supervisor';


export type Store = AtomStore;

let defaultStore: Store | null = null;

export function getDefaultStore(): Store {
  if (defaultStore === null) {
    const supervisor = new AtomSupervisor();
    defaultStore = supervisor.store;
  }
  return defaultStore;
}

export function createStore(): Store {
  const supervisor = new AtomSupervisor();
  return supervisor.store;
}
