// =============================================================================
// Reago
// =============================================================================

export type {
  Atom,
  AnyAtom,
  AtomResultOf,
  AtomFamilyArgsOf,
  AtomActionArgsOf
} from '~/core/atom';

export type {
  AtomWatcher,
  AtomListener
} from '~/core/atom-watcher';

export {
  getDefaultStore,
  createStore,
  type Store
} from '~/api/store';

export {read} from '~/api/read';
export {watch} from '~/api/watch';
export {dispatch} from '~/api/dispatch';
export {invalidate} from '~/api/invalidate';

export {
  atomAbortSignal
} from '~/hook/atom-abort-signal';

export {
  atomAction,
  type AtomAction
} from '~/hook/atom-action';

export {
  atomComputationEffect,
  type AtomComputationEffect,
  type AtomComputationEffectCleanup
} from '~/hook/atom-computation-effect';

export {
  atomMemo
} from '~/hook/atom-memo';

export {
  atomMountEffect,
  type AtomMountEffect,
  type AtomMountEffectCleanup
} from '~/hook/atom-mount-effect';

export {
  atomReducer,
  type AtomReducer,
  type AtomReducerReducer,
  type AtomReducerDispatcher
} from '~/hook/atom-reducer';

export {
  atomRef,
  type AtomRef
} from '~/hook/atom-ref';

export {
  atomState,
  type AtomState,
  type AtomStateSetter
} from '~/hook/atom-state';

export {
  atomStore
} from '~/hook/atom-store';
