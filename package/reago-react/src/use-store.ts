// =============================================================================
// useStore hook
// =============================================================================

import {useContext} from 'react';
import {getDefaultStore, type Store} from 'reago';
import {StoreContext} from './provider';


export function useStore(): Store {
  const contextStore = useContext(StoreContext);
  return contextStore ?? getDefaultStore();
}
