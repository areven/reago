// =============================================================================
// Atom instance
// =============================================================================

import {
  COMPUTING, COMPUTED, MOUNTED_DIRECTLY, MOUNTED_TRANSITIVELY, UNMOUNTED, FRESH, OUTDATED, STALE
} from '~/const';
import {IterableWeakSet} from '~/util/iterable-weakset';
import type {AtomActionFrame} from '~/hook/atom-action';
import type {AtomComputationEffectFrame} from '~/hook/atom-computation-effect';
import type {AtomMountEffectFrame} from '~/hook/atom-mount-effect';
import type {Computation} from '~/reactor/computation';
import type {SwappablePromise} from '~/util/swappable-promise';
import type {AnyAtom, AtomFamilyArgsOf, AtomImplResultOf} from './atom';
import type {AtomHookFrame} from './atom-hook';
import type {AtomWatcher} from './atom-watcher';


export interface AtomInstance<T extends AnyAtom> {
  /**
   * Reference to the atom this instance is derived from.
   */
  readonly atom: T;

  /**
   * Atom arguments for the fn call.
   *
   * An array of arguments passed to the atom for computation, used to implement
   * atom families.
   */
  readonly args: AtomFamilyArgsOf<T>;

  /**
   * Current status of the atom instance.
   *
   * - `COMPUTED` - computed and seemingly up to date (see `freshness`)
   * - `COMPUTING` - atom is generative and computation is still running
   * - `OUTDATED` - outdated or not computed at all
   *
   * Note that in case of functional atoms the `COMPUTING` state can't be observed
   * outside since everything runs synchronously.
   */
  status: typeof COMPUTED | typeof COMPUTING | typeof OUTDATED;

  /**
   * Current freshness of the atom instance.
   *
   * - `FRESH` - computation result is known to be up to date
   * - `STALE` - something in the dependency subgraph requires recomputing
   *
   * An atom instance that is `COMPUTED` might depend directly or indirectly
   * on other instances that are marked as `OUTDATED`. We don't know yet if
   * their values are going to change, but if they do, they could potentially
   * trigger a recomputation of this instance as well.
   */
  freshness: typeof FRESH | typeof STALE;

  /**
   * Current mount state of the atom instance.
   */
  mount: typeof MOUNTED_DIRECTLY | typeof MOUNTED_TRANSITIVELY | typeof UNMOUNTED;

  /**
   * Promise that resolves/rejects with the computation result.
   *
   * The promise is created for generative atoms only.
   */
  promise?: SwappablePromise<AtomImplResultOf<T>>;

  /**
   * Reference to the active computation.
   *
   * This prop is `undefined` only if an atom instance hasn't been computed before.
   */
  computation?: Computation<T>;

  /**
   * Collection of attached watchers.
   *
   * They should be notified of any value changes of this atom instance.
   */
  watchers: Set<AtomWatcher<T>>;

  /**
   * Collection of atom instance dependencies.
   *
   * These are atoms that this atom directly depends on.
   */
  dependencies: Set<AtomInstance<AnyAtom>>;

  /**
   * Collection of atom instance dependants.
   *
   * These are atoms that directly depend on the value of this atom and need
   * to be notified when the value here changes.
   */
  dependants: IterableWeakSet<AtomInstance<AnyAtom>>;

  /**
   * Internal stack for hooks.
   *
   * The stack maintains internal state of each hook call, in their order of
   * invocation. The n-th element of the stack corresponds to the state of
   * the n-th hook call within an atom.
   */
  stack: AtomHookFrame[];

  /**
   * Internal stack for hooks, restricted to `atomAction` hook type.
   *
   * Contains the same data as `stack.filter(o => o.hook = atomAction)`.
   * Used to improve performance of `dispatch()` calls.
   */
  stackAction: AtomActionFrame[];

  /**
   * Internal stack for hooks, restricted to `atomComputationEffect` hook type.
   *
   * Contains the same data as `stack.filter(o => o.hook = atomComputationEffect)`.
   * Used to improve performance of computation effects handling.
   */
  stackComputationEffect: AtomComputationEffectFrame[];

  /**
   * Internal stack for hooks, restricted to `atomMountEffect` hook type.
   *
   * Contains the same data as `stack.filter(o => o.hook = atomMountEffect)`.
   * Used to improve performance of mount effects handling.
   */
  stackMountEffect: AtomMountEffectFrame[];

  /**
   * Flag indicating that the stack is frozen.
   *
   * If true, no new hooks should be added to the stack. The stack is frozen
   * after first successful computation, helping to catch any developer mistakes
   * that could result in inconsistent hook calls across computations.
   */
  freezeStack: boolean;
}

export function createAtomInstance<T extends AnyAtom>(
  atom: T,
  args: AtomFamilyArgsOf<T>
): AtomInstance<T> {
  return {
    atom,
    args,
    status: OUTDATED,
    freshness: FRESH,
    mount: UNMOUNTED,
    watchers: new Set(),
    dependencies: new Set(),
    dependants: new IterableWeakSet(),
    stack: [],
    stackAction: [],
    stackComputationEffect: [],
    stackMountEffect: [],
    freezeStack: false
  };
}
