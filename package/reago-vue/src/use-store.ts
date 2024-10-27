// =============================================================================
// useStore hook
// =============================================================================

import {getDefaultStore, type Store} from 'reago';
import {inject} from 'vue';
import {StoreKey} from './provider';


export function useStore(): Store {
  return inject(StoreKey, getDefaultStore());
}
