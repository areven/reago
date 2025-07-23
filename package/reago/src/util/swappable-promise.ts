// =============================================================================
// Swappable promise
// =============================================================================

import {METADATA, PENDING, REJECTED, RESOLVED} from '~/const';
import {assert} from '~/error';


export type SwappablePromise<Type> = Promise<Type> & {
  [METADATA]: (
    PendingSwappablePromise<Type> |
    ResolvedSwappablePromise |
    RejectedSwappablePromise
  );
};

export interface PendingSwappablePromise<Type> {
  status: typeof PENDING;
  promise: PromiseLike<Type> | null;
  setPromise: (p: PromiseLike<Type> | null) => void;
}

export interface ResolvedSwappablePromise {
  status: typeof RESOLVED;
}

export interface RejectedSwappablePromise {
  status: typeof REJECTED;
}

export function createSwappablePromise<Type>(initial: PromiseLike<Type> | null = null): SwappablePromise<Type> {
  let resolve: (value: Type | PromiseLike<Type>) => void;
  let reject: (reason?: any) => void;

  const promise: SwappablePromise<Type> = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  }) as SwappablePromise<Type>;

  promise[METADATA] = {
    status: PENDING,
    promise: null,
    setPromise: (p: PromiseLike<Type> | null) => {
      assert(promise[METADATA].status === PENDING);

      if (promise[METADATA].promise === p) {
        return;
      }

      promise[METADATA].promise = p;
      p?.then(
        (result) => {
          if (promise[METADATA].status === PENDING && promise[METADATA].promise === p) {
            promise[METADATA] = {
              status: RESOLVED
            };
            resolve(result);
          }
        },
        (error: unknown) => {
          if (promise[METADATA].status === PENDING && promise[METADATA].promise === p) {
            promise[METADATA] = {
              status: REJECTED
            };
            reject(error);
          }
        }
      );
    }
  };

  if (initial) {
    promise[METADATA].setPromise(initial);
  }

  return promise;
}

export function swapOrRecreatePromise<Type>(
  swappablePromise: SwappablePromise<Type> | undefined,
  innerPromise: PromiseLike<Type>
): SwappablePromise<Type> {
  if (swappablePromise && swappablePromise[METADATA].status === PENDING) {
    swappablePromise[METADATA].setPromise(innerPromise);
    return swappablePromise;
  } else {
    return createSwappablePromise(innerPromise);
  }
}

export function unbindSwappablePromiseIfPending<Type>(swappablePromise: SwappablePromise<Type>): void {
  if (swappablePromise[METADATA].status === PENDING) {
    swappablePromise[METADATA].setPromise(null);
  }
}
