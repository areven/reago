// =============================================================================
// Swappable promise
// =============================================================================

import {PENDING, REJECTED, RESOLVED} from '~/const';
import {InternalAtomError} from '~/error';


const SWAPPABLE = Symbol();

export type SwappablePromise<Type> = Promise<Type> & {
  [SWAPPABLE]: (
    PendingSwappablePromise<Type> |
    ResolvedSwappablePromise |
    RejectedSwappablePromise
  );
};

export interface PendingSwappablePromise<Type> {
  status: typeof PENDING;
  promise: Promise<Type> | null;
  setPromise: (p: Promise<Type> | null) => void;
}

export interface ResolvedSwappablePromise {
  status: typeof RESOLVED;
}

export interface RejectedSwappablePromise {
  status: typeof REJECTED;
}

export function createSwappablePromise<Type>(initial: Promise<Type> | null = null): SwappablePromise<Type> {
  let resolve: (value: Type | PromiseLike<Type>) => void;
  let reject: (reason?: any) => void;

  const promise: SwappablePromise<Type> = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  }) as SwappablePromise<Type>;

  promise[SWAPPABLE] = {
    status: PENDING,
    promise: null,
    setPromise: (p: Promise<Type> | null) => {
      if (promise[SWAPPABLE].status !== PENDING) {
        throw new InternalAtomError();
      }

      if (promise[SWAPPABLE].promise === p) {
        return;
      }

      promise[SWAPPABLE].promise = p;
      p?.then(
        (result) => {
          if (promise[SWAPPABLE].status === PENDING && promise[SWAPPABLE].promise === p) {
            promise[SWAPPABLE] = {
              status: RESOLVED
            };
            resolve(result);
          }
        },
        (error) => {
          if (promise[SWAPPABLE].status === PENDING && promise[SWAPPABLE].promise === p) {
            promise[SWAPPABLE] = {
              status: REJECTED
            };
            reject(error);
          }
        }
      );
    }
  };

  if (initial) {
    promise[SWAPPABLE].setPromise(initial);
  }

  return promise;
}

export function swapOrRecreatePromise<Type>(
  swappablePromise: SwappablePromise<Type> | undefined,
  innerPromise: Promise<Type>
): SwappablePromise<Type> {
  if (swappablePromise && swappablePromise[SWAPPABLE].status === PENDING) {
    swappablePromise[SWAPPABLE].setPromise(innerPromise);
    return swappablePromise;
  } else {
    return createSwappablePromise(innerPromise);
  }
}

export function unbindSwappablePromiseIfPending<Type>(swappablePromise: SwappablePromise<Type>): void {
  if (swappablePromise[SWAPPABLE].status === PENDING) {
    swappablePromise[SWAPPABLE].setPromise(null);
  }
}
