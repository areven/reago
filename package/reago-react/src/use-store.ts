// =============================================================================
// useStore hook
// =============================================================================

import {useContext} from 'react';
import {getDefaultStore} from 'reago';
import {StoreContext} from './provider';
import type {Store} from 'reago';


export function useStore(): Store {
  const contextStore = useContext(StoreContext);
  return contextStore ?? getDefaultStore();
}
