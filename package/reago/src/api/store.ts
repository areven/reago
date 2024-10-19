// =============================================================================
// Public store API
// =============================================================================

import {Store as StoreClass} from '~/space/store';
import {Supervisor} from '~/space/supervisor';


export type Store = StoreClass;

let defaultStore: Store | null = null;

export function getDefaultStore(): Store {
  if (defaultStore === null) {
    const supervisor = new Supervisor();
    defaultStore = supervisor.store;
  }
  return defaultStore;
}

export function createStore(): Store {
  const supervisor = new Supervisor();
  return supervisor.store;
}
