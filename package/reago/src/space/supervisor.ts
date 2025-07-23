// =============================================================================
// Space supervisor
// =============================================================================

import {
  COMPUTED, COMPUTING, FRESH, FUNCTIONAL_ATOM, GENERATIVE_ATOM, LOADED, METADATA,
  MOUNTED_DIRECTLY, MOUNTED_TRANSITIVELY, NO_VALUE, OUTDATED, STALE, UNLOADED, UNMOUNTED
} from '~/const';
import {createAtomFamily} from '~/core/atom-family';
import {createAtomInstance} from '~/core/atom-instance';
import {createAtomWatcher} from '~/core/atom-watcher';
import {assert, HookCountMismatchAtomError, InvalidCleanupFunctionAtomError} from '~/error';
import {runWithCallbackContext} from '~/reactor/callback-context';
import {createComputation, runComputation} from '~/reactor/computation';
import {hashFamilyArguments} from '~/util/arg-hash';
import {compareEqual} from '~/util/comparison';
import {swapOrRecreatePromise, unbindSwappablePromiseIfPending} from '~/util/swappable-promise';
import {trackPromise, trackRejectedPromise, trackResolvedPromise} from '~/util/tracked-promise';
import {Store} from './store';
import type {AnyAtom, AtomActionArgsOf, AtomFamilyArgsOf, AtomImplResultOf, AtomResultOf} from '~/core/atom';
import type {AtomFamily} from '~/core/atom-family';
import type {AtomInstance} from '~/core/atom-instance';
import type {AtomListener, AtomWatcher} from '~/core/atom-watcher';
import type {AtomComputationEffectCleanup} from '~/hook/atom-computation-effect';


export class Supervisor {
  readonly store: Store = new Store(this);
  readonly #atomFamily: WeakMap<AnyAtom, AtomFamily<AnyAtom>> = new WeakMap();
  readonly #mountGCLock: Set<AtomInstance<AnyAtom>> = new Set();

  #flushTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly #computationQueue: Set<AtomInstance<AnyAtom>> = new Set();
  readonly #watcherDispatchQueue: Set<AtomWatcher> = new Set();

  readonly #computationEffectQueue: Set<AtomInstance<AnyAtom>> = new Set();
  readonly #computationEffectCleanupRegistry: FinalizationRegistry<AtomComputationEffectCleanup>;
  readonly #mountEffectQueue: Set<AtomInstance<AnyAtom>> = new Set();

  constructor() {
    this.#computationEffectCleanupRegistry = new FinalizationRegistry((cleanup) => {
      runWithCallbackContext({supervisor: this}, cleanup);
    });
  }

  getOrCreateFamily<T extends AnyAtom>(atom: T): AtomFamily<T> {
    let family = this.#atomFamily.get(atom) as AtomFamily<T> | undefined;
    if (family === undefined) {
      family = createAtomFamily(atom);
      this.#atomFamily.set(atom, family);
    }
    return family;
  }

  getInstance<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): AtomInstance<T> | null {
    const family = this.getOrCreateFamily(atom);
    const hash = hashFamilyArguments(args);
    return family.instanceMap.get(hash) ?? null;
  }

  getOrCreateInstance<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): AtomInstance<T> {
    const family = this.getOrCreateFamily(atom);
    const hash = hashFamilyArguments(args);
    let instance = family.instanceMap.get(hash);
    if (instance === undefined) {
      instance = createAtomInstance(atom, args);
      family.instanceMap.set(hash, instance);
    }
    return instance;
  }

  readInstance<T extends AnyAtom>(instance: AtomInstance<T>): AtomResultOf<T> {
    this.syncInstance(instance);

    if (instance.promise) {
      return instance.promise as AtomResultOf<T>;
    }

    if (instance.computation!.result !== NO_VALUE) {
      return instance.computation!.result as AtomResultOf<T>;
    }

    throw instance.computation!.error;
  }

  watchInstance<T extends AnyAtom>(instance: AtomInstance<T>, listener: AtomListener<T>): AtomWatcher<T> {
    this.syncInstance(instance);
    this.mountInstance(instance);

    const watcher = createAtomWatcher(this, instance, listener);
    instance.watchers.add(watcher);

    return watcher;
  }

  dispatchInstance<T extends AnyAtom>(instance: AtomInstance<T>, ...args: AtomActionArgsOf<T>): void {
    this.syncInstance(instance);
    if (instance.status === COMPUTED) {
      this.#runInstanceActions(instance, ...args);
    } else {
      assert(instance.status === COMPUTING);
      instance.promise!.finally(() => {
        this.dispatchInstance(instance, ...args);
      }).catch(() => {});
    }
  }

  syncInstance<T extends AnyAtom>(instance: AtomInstance<T>): void {
    if (instance.freshness === STALE) {
      // we have a computed value, but there is something in the subgraph that is
      // outdated and might possibly invalidate the current result
      for (const dependency of instance.dependencies) {
        this.syncInstance(dependency);
      }
      instance.freshness = FRESH;
    }

    if (instance.status === OUTDATED) {
      // TODO: consider running runInstanceComputation here instead of flushing
      this.#computationQueue.add(instance);
    }

    this.flush();
  }

  mountInstance<T extends AnyAtom>(
    instance: AtomInstance<T>,
    mode: typeof MOUNTED_DIRECTLY | typeof MOUNTED_TRANSITIVELY = MOUNTED_DIRECTLY
  ): void {
    if (instance.mount === UNMOUNTED) {
      for (const dependency of instance.dependencies) {
        this.mountInstance(dependency, MOUNTED_TRANSITIVELY);
      }

      this.#mountGCLock.add(instance);
      this.#mountEffectQueue.add(instance);
    }

    if (instance.mount !== MOUNTED_DIRECTLY) {
      instance.mount = mode;
    }
  }

  unmountInstance<T extends AnyAtom>(instance: AtomInstance<T>): void {
    const hasMountedParent = instance.dependants.some(dependant => dependant.mount !== UNMOUNTED);
    instance.mount = hasMountedParent ? MOUNTED_TRANSITIVELY : UNMOUNTED;

    if (instance.mount === UNMOUNTED) {
      this.#mountGCLock.delete(instance);
      this.#mountEffectQueue.add(instance);

      const reverseUnmount: AtomInstance<AnyAtom>[] = [];
      for (const dependency of instance.dependencies) {
        if (dependency.mount === MOUNTED_TRANSITIVELY) {
          reverseUnmount.push(dependency);
        }
      }

      for (let x = reverseUnmount.length - 1; x >= 0; --x) {
        this.unmountInstance(reverseUnmount[x]);
      }
    }
  }

  invalidateInstance<T extends AnyAtom>(instance: AtomInstance<T>): void {
    this.#markInstanceAsOutdated(instance);
  }

  // TODO: we really need an explicit way to manage atom instance lifecycle
  // destroyInstance<T extends AnyAtom>(instance: AtomInstance<T>): void {
  //   ...
  // }

  flush(): void {
    if (this.#flushTimeout) {
      clearTimeout(this.#flushTimeout);
      this.#flushTimeout = null;
    }

    for (const pendingInstance of this.#computationQueue) {
      this.#runInstanceComputation(pendingInstance);
    }

    for (const pendingInstance of this.#computationEffectQueue) {
      this.#runInstanceComputationEffects(pendingInstance);
    }

    for (const pendingInstance of this.#mountEffectQueue) {
      this.#runInstanceMountEffects(pendingInstance);
    }

    for (const pendingWatcher of this.#watcherDispatchQueue) {
      this.#watcherDispatchQueue.delete(pendingWatcher);
      if (pendingWatcher[METADATA]) {
        runWithCallbackContext({supervisor: this}, pendingWatcher[METADATA].listener);
      }
    }

    if (this.#flushTimeout) {
      this.flush();
    }
  }

  requestAsyncFlush(): void {
    if (this.#flushTimeout === null) {
      this.#flushTimeout = setTimeout(this.flush.bind(this), 0);
    }
  }

  #runInstanceComputation<T extends AnyAtom>(instance: AtomInstance<T>): void {
    // Abort any async tasks from the previous invocation
    instance.computation?.abortController.abort();

    // Run a new computation
    this.#computationQueue.delete(instance);
    const prevComputation = instance.computation;
    const newComputation = createComputation<T>();
    let instanceValueChanged = false;

    instance.status = COMPUTING;
    instance.freshness = FRESH;
    instance.computation = newComputation;
    runComputation(this, instance, instance.computation);

    // Process the result
    if (!newComputation.promise) {
      this.#commitComputation(instance);

      const hasNewValue = (
        !prevComputation ||
        (newComputation.result !== NO_VALUE && !compareEqual(newComputation.result, prevComputation.result)) ||
        (newComputation.error !== NO_VALUE && !compareEqual(newComputation.error, prevComputation.error))
      );

      if (newComputation.mode === FUNCTIONAL_ATOM) {
        delete instance.promise;
        instanceValueChanged = hasNewValue;
      } else if (newComputation.mode === GENERATIVE_ATOM && (hasNewValue || !instance.promise)) {
        const prevPromise = instance.promise;
        if (newComputation.result !== NO_VALUE) {
          instance.promise = swapOrRecreatePromise(instance.promise, Promise.resolve(newComputation.result));
          trackResolvedPromise(instance.promise, newComputation.result);
        } else {
          instance.promise = swapOrRecreatePromise(instance.promise, Promise.reject(newComputation.error));
          trackRejectedPromise(instance.promise, newComputation.error);
        }
        instanceValueChanged = instance.promise !== prevPromise;
      }
    } else {
      const committedPromise = newComputation.promise!.then(
        () => {
          if (!newComputation.abortController.signal.aborted) {
            this.#commitComputation(instance);
          }
          if (newComputation.error !== NO_VALUE) {
            throw newComputation.error;
          }
          return newComputation.result as AtomImplResultOf<T>;
        },
        /* istanbul ignore next -- @preserve */
        (err: unknown) => {
          // should be unreachable - errors are reported via `computation.error`
          newComputation.error = err;
          if (!newComputation.abortController.signal.aborted) {
            this.#commitComputation(instance);
          }
          throw err;
        }
      );

      const prevPromise = instance.promise;
      instance.promise = swapOrRecreatePromise(instance.promise, committedPromise);
      instanceValueChanged = instance.promise !== prevPromise;
      trackPromise(instance.promise);
    }

    // Invalidate dependants if value changed
    if (instanceValueChanged) {
      for (const dependant of instance.dependants) {
        if (dependant.status === COMPUTING && !dependant.computation!.dependencies.has(instance)) {
          // computation is running and has not reached this dependency yet, so
          // there is no need to restart it - it will use the new value
          continue;
        }
        this.#markInstanceAsOutdated(dependant);
      }
    }

    // Notify watchers
    if (instanceValueChanged && instance.watchers.size > 0) {
      for (const watcher of instance.watchers) {
        this.#watcherDispatchQueue.add(watcher);
      }
      this.requestAsyncFlush();
    }
  }

  #runInstanceActions<T extends AnyAtom>(instance: AtomInstance<T>, ...args: AtomActionArgsOf<T>): void {
    for (const action of instance.stackAction) {
      runWithCallbackContext({supervisor: this}, () => {
        action.handler.call(undefined, ...args);
      });
    }
  }

  #runInstanceComputationEffects<T extends AnyAtom>(instance: AtomInstance<T>): void {
    this.#computationEffectQueue.delete(instance);

    // cleanup in reverse order computation effects appeared in code
    for (let x = instance.stackComputationEffect.length - 1; x >= 0; --x) {
      const computationEffect = instance.stackComputationEffect[x];
      if (computationEffect.setup && computationEffect.cleanup) {
        runWithCallbackContext({supervisor: this}, computationEffect.cleanup);
        this.#computationEffectCleanupRegistry.unregister(computationEffect.cleanup[METADATA]!.token);
        computationEffect.cleanup = undefined;
      }
    }

    // setup in the order computation effects appeared in code
    for (const computationEffect of instance.stackComputationEffect) {
      if (!computationEffect.setup) continue;
      assert(!computationEffect.cleanup);

      let effectResult;
      runWithCallbackContext({supervisor: this}, () => {
        effectResult = computationEffect.setup!.call(undefined);
      });
      computationEffect.setup = undefined;

      if (effectResult !== undefined) {
        if (typeof effectResult !== 'function') {
          throw new InvalidCleanupFunctionAtomError();
        }

        computationEffect.cleanup = function () {
          effectResult!();
        };
        computationEffect.cleanup[METADATA] = {
          token: {} // guaranteed to be unique
        };

        this.#computationEffectCleanupRegistry.register(
          instance, // tracked ref
          computationEffect.cleanup, // held value
          computationEffect.cleanup[METADATA].token // unregister token
        );
      }
    }
  }

  #runInstanceMountEffects<T extends AnyAtom>(instance: AtomInstance<T>): void {
    this.#mountEffectQueue.delete(instance);
    const isMounted = instance.mount !== UNMOUNTED;

    // cleanup in reverse order mount effects appeared in code
    for (let x = instance.stackMountEffect.length - 1; x >= 0; --x) {
      const mountEffect = instance.stackMountEffect[x];
      if (mountEffect.cleanup && (!isMounted || (isMounted && mountEffect.status === UNLOADED))) {
        runWithCallbackContext({supervisor: this}, mountEffect.cleanup);
        mountEffect.status = UNLOADED;
        mountEffect.cleanup = undefined;
      }
    }

    // setup in the order mount effects appeared in code
    for (const mountEffect of instance.stackMountEffect) {
      if (isMounted && mountEffect.status === UNLOADED) {
        assert(!mountEffect.cleanup);

        let effectResult;
        runWithCallbackContext({supervisor: this}, () => {
          effectResult = mountEffect.setup.call(undefined);
        });
        mountEffect.status = LOADED;

        if (effectResult !== undefined) {
          if (typeof effectResult !== 'function') {
            throw new InvalidCleanupFunctionAtomError();
          }
          mountEffect.cleanup = effectResult;
        }
      }
    }
  }

  #markInstanceAsOutdated<T extends AnyAtom>(instance: AtomInstance<T>): void {
    if (instance.status === OUTDATED) {
      return;
    }

    const immediateComputation = (
      instance.status === COMPUTING ||
      instance.mount === MOUNTED_DIRECTLY ||
      instance.mount === MOUNTED_TRANSITIVELY
    );

    instance.status = OUTDATED;
    instance.freshness = FRESH;
    instance.computation?.abortController.abort();
    if (instance.promise) {
      unbindSwappablePromiseIfPending(instance.promise);
    }

    if (immediateComputation) {
      this.#computationQueue.add(instance);
      this.requestAsyncFlush();
    }

    for (const dependant of instance.dependants) {
      this.#markInstanceAsStale(dependant);
    }
  }

  #markInstanceAsStale<T extends AnyAtom>(instance: AtomInstance<T>): void {
    if (instance.status === OUTDATED || instance.freshness === STALE) {
      return;
    }

    instance.freshness = STALE;

    for (const dependant of instance.dependants) {
      this.#markInstanceAsStale(dependant);
    }
  }

  #commitComputation<T extends AnyAtom>(instance: AtomInstance<T>): void {
    instance.status = COMPUTED;
    const computation = instance.computation!;

    // Abort async tasks if computation failed
    if (computation.error !== NO_VALUE) {
      computation.abortController.abort();
    }

    // Commit dependencies referenced during computation
    const computationDeps = computation.dependencies;

    for (const dependency of instance.dependencies) {
      if (computationDeps.has(dependency)) continue;

      instance.dependencies.delete(dependency);
      dependency.dependants.delete(instance);

      if (dependency.mount === MOUNTED_TRANSITIVELY && instance.mount === UNMOUNTED) {
        this.unmountInstance(dependency);
      }
    }

    computation.dependencies.clear(); // no longer needed

    // Freeze hooks stack after the first successful computation
    if (computation.result !== NO_VALUE) {
      instance.freezeStack = true;
    }

    // Check if all known hooks were ran
    if (computation.pointer < instance.stack.length) {
      if (computation.error === NO_VALUE) {
        computation.result = NO_VALUE;
        computation.error = new HookCountMismatchAtomError();
      }

      for (let ptr = computation.pointer; ptr < instance.stack.length; ++ptr) {
        instance.stack[ptr].hook.onSkip?.(instance.stack[ptr]);
      }
    }

    // Queue computation effects
    if (instance.stackComputationEffect.some(frame => !!frame.setup)) {
      this.#computationEffectQueue.add(instance);
    }

    // Queue mount effects
    if (instance.mount !== UNMOUNTED) {
      if (instance.stackMountEffect.some(frame => frame.status === UNLOADED)) {
        this.#mountEffectQueue.add(instance);
      }
    }
  }
}
