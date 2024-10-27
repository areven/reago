// =============================================================================
// Store provider
// =============================================================================

import {createStore, type Store} from 'reago';
import {provide, shallowRef, type InjectionKey} from 'vue';


export const StoreKey: InjectionKey<Store> = Symbol('reago-vue-store');

export function provideStore(store?: Store): void {
  const storeRef = shallowRef<Store>();
  if (!store && !storeRef.value) {
    storeRef.value = createStore();
  }
  provide(StoreKey, (store || storeRef.value)!);
}
