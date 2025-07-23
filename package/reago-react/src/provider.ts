// =============================================================================
// Store provider
// =============================================================================

import {createContext, createElement, useRef} from 'react';
import {createStore} from 'reago';
import type {Context, FunctionComponentElement, ReactNode} from 'react';
import type {Store} from 'reago';


export const StoreContext: Context<Store | undefined> = createContext<Store | undefined>(undefined);

export function StoreProvider({
  children,
  store
}: {
  children?: ReactNode,
  store?: Store
}): FunctionComponentElement<{value: Store | undefined}> {
  const storeRef = useRef<Store>();
  if (!store && !storeRef.current) {
    storeRef.current = createStore();
  }

  return createElement(
    StoreContext.Provider,
    {value: store ?? storeRef.current},
    children
  );
}
