// =============================================================================
// Atom supervisor
// =============================================================================

import {
  AnyAtom, AnyFunctionalAtom, AnyGenerativeAtom, AtomActionArgsOf, AtomFamilyArgsOf,
  AtomListener, AtomResultOf, AtomWatcher
} from '~/atom';
import {
  COMPUTING, COMPUTED, FUNCTIONAL_ATOM, GENERATIVE_ATOM, NO_VALUE, MOUNTED_DIRECTLY,
  MOUNTED_TRANSITIVELY, OUTDATED, FRESH, STALE, UNMOUNTED, UNLOADED, LOADED
} from '~/const';
import {HookCountMismatchAtomError, InternalAtomError, InvalidCleanupFunctionAtomError} from '~/error';
import {runWithCallbackContext} from '~/reactor/callback-context';
import {runComputation} from '~/reactor/computation';
import {hashFamilyArguments} from '~/util/arg-hash';
import {compareEqual} from '~/util/comparison';
import {swapOrRecreatePromise, unbindSwappablePromiseIfPending} from '~/util/swappable-promise';
import {trackPromise, trackRejectedPromise, trackResolvedPromise} from '~/util/tracked-promise';
import {AtomFamily, createAtomFamily} from './family';
import {AtomInstance, createAtomInstance} from './instance';
import {AtomStore} from './store';


export class AtomSupervisor {
  readonly store: AtomStore = new AtomStore(this);
  readonly #atomFamily: WeakMap<AnyAtom, AtomFamily<AnyAtom>> = new WeakMap();

  #flushTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly #computationQueue: Set<AtomInstance<AnyAtom>> = new Set();
  readonly #watcherDispatchQueue: Set<AtomWatcher<AnyAtom>> = new Set();
  readonly #sideEffectQueue: Set<AtomInstance<AnyAtom>> = new Set();
  readonly #mountEffectQueue: Set<AtomInstance<AnyAtom>> = new Set();

  getFamily<T extends AnyAtom>(atom: T): AtomFamily<T> {
    let family = this.#atomFamily.get(atom) as AtomFamily<T> | undefined;
    if (family === undefined) {
      family = createAtomFamily(atom);
      this.#atomFamily.set(atom, family);
    }
    return family;
  }

  hasInstance<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): Boolean {
    const family = this.getFamily(atom);
    const hash = hashFamilyArguments(args);
    return family.instanceMap.has(hash);
  }

  getInstance<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): AtomInstance<T> {
    const family = this.getFamily(atom);
    const hash = hashFamilyArguments(args);
    let instance = family.instanceMap.get(hash);
    if (instance === undefined) {
      instance = createAtomInstance(atom, args);
      family.instanceMap.set(hash, instance);
    }
    return instance;
  }

  readInstance<T extends AnyGenerativeAtom>(instance: AtomInstance<T>): Promise<AtomResultOf<T>>;
  readInstance<T extends AnyFunctionalAtom>(instance: AtomInstance<T>): AtomResultOf<T>;
  readInstance<T extends AnyAtom>(instance: AtomInstance<T>): AtomResultOf<T> | Promise<AtomResultOf<T>> {
    this.syncInstance(instance);

    if (instance.promise) {
      return instance.promise;
    }

    if (instance.computation!.result !== NO_VALUE) {
      return instance.computation!.result;
    }

    throw instance.computation!.error;
  }

  watchInstance<T extends AnyAtom>(instance: AtomInstance<T>, listener: AtomListener<T>): AtomWatcher<T> {
    this.syncInstance(instance);
    this.mountInstance(instance);
    const watcher = {
      listener,
      clear: () => {
        this.#watcherDispatchQueue.delete(watcher);
        if (instance.watchers.delete(watcher)) {
          if (instance.watchers.size === 0) {
            this.unmountInstance(instance);
            this.flush();
          }
        }
      },
      [Symbol.dispose]: () => {
        watcher.clear();
      }
    };
    instance.watchers.add(watcher);
    return watcher;
  }

  dispatchInstance<T extends AnyAtom>(instance: AtomInstance<T>, ...args: AtomActionArgsOf<T>): void {
    this.syncInstance(instance);
    if (instance.status === COMPUTED) {
      this.#runInstanceActions(instance, ...args);
    } else if (instance.status === COMPUTING) {
        instance.promise!.finally(() => {
          this.dispatchInstance(instance, ...args);
        }).catch(() => {});
    } else {
      throw new InternalAtomError();
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

    for (const pendingInstance of this.#sideEffectQueue) {
      this.#runInstanceSideEffects(pendingInstance);
    }

    for (const pendingInstance of this.#mountEffectQueue) {
      this.#runInstanceMountEffects(pendingInstance);
    }

    for (const pendingWatcher of this.#watcherDispatchQueue) {
      this.#watcherDispatchQueue.delete(pendingWatcher);
      runWithCallbackContext({supervisor: this}, pendingWatcher.listener);
    }

    if (this.#flushTimeout) {
      this.flush();
    }
  }

  requestAsyncFlush(): void {
    if (this.#flushTimeout === null) {
      this.#flushTimeout = setTimeout(() => {
        this.flush();
      }, 0);
    }
  }

  #runInstanceComputation<T extends AnyAtom>(instance: AtomInstance<T>): void {
    // Abort any async tasks from the previous invocation
    instance.computation?.abortController.abort();

    // Run a new computation
    this.#computationQueue.delete(instance);
    const prevComputation = instance.computation;
    const newComputation = runComputation(this, instance);
    instance.status = COMPUTING;
    instance.freshness = FRESH;
    instance.computation = newComputation;
    let instanceValueChanged = false;

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
          if (instance.computation!.error !== NO_VALUE) {
            throw instance.computation!.error;
          }
          return instance.computation!.result as AtomResultOf<T>;
        },
        (err) => {
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

  #runInstanceSideEffects<T extends AnyAtom>(instance: AtomInstance<T>): void {
    this.#sideEffectQueue.delete(instance);

    for (const sideEffect of instance.stackSideEffect) {
      if (!sideEffect.setup) continue;

      if (sideEffect.cleanup) {
        runWithCallbackContext({supervisor: this}, sideEffect.cleanup);
        sideEffect.cleanup = undefined;
      }

      let effectResult;
      runWithCallbackContext({supervisor: this}, () => {
        effectResult = sideEffect.setup!.call(undefined);
      });
      sideEffect.setup = undefined;

      if (effectResult !== undefined) {
        if (typeof effectResult !== 'function') {
          throw new InvalidCleanupFunctionAtomError();
        }
        sideEffect.cleanup = effectResult;
      }
    }
  }

  #runInstanceMountEffects<T extends AnyAtom>(instance: AtomInstance<T>): void {
    this.#mountEffectQueue.delete(instance);
    const isMounted = instance.mount !== UNMOUNTED;

    for (const mountEffect of instance.stackMountEffect) {
      if (mountEffect.cleanup && (!isMounted || (isMounted && mountEffect.status === UNLOADED))) {
        runWithCallbackContext({supervisor: this}, mountEffect.cleanup);
        mountEffect.status = UNLOADED;
        mountEffect.cleanup = undefined;
      }

      if (isMounted && mountEffect.status === UNLOADED) {
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

    // Queue side effects
    if (instance.stackSideEffect.some(frame => !!frame.setup)) {
      this.#sideEffectQueue.add(instance);
    }

    // Queue mount effects
    if (instance.mount !== UNMOUNTED) {
      if (instance.stackMountEffect.some(frame => frame.status === UNLOADED)) {
        this.#mountEffectQueue.add(instance);
      }
    }
  }
}
