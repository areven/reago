// =============================================================================
// Promise state tracking
// =============================================================================

import {PENDING, REJECTED, RESOLVED} from '~/const';


const promiseState = new WeakMap<Promise<any>, PromiseState<unknown>>();

export type PromiseState<ResultType = unknown, ErrorType = unknown> = (
  PendingPromiseState |
  ResolvedPromiseState<ResultType> |
  RejectedPromiseState<ErrorType>
);

export interface PendingPromiseState {
  status: typeof PENDING;
}

export interface ResolvedPromiseState<ResultType> {
  status: typeof RESOLVED;
  result: ResultType;
}

export interface RejectedPromiseState<ErrorType> {
  status: typeof REJECTED;
  error: ErrorType;
}

export function trackPromise<Type>(promise: Promise<Type>): void {
  if (promiseState.has(promise)) {
    return;
  }

  promiseState.set(promise, {status: PENDING});

  promise.then(
    (result) => {
      promiseState.set(promise, {
        status: RESOLVED,
        result
      });
    },
    (error) => {
      promiseState.set(promise, {
        status: REJECTED,
        error
      });
    }
  );
}

export function trackResolvedPromise<Type>(promise: Promise<Type>, result: Type): void {
  promiseState.set(promise, {
    status: RESOLVED,
    result
  });
}

export function trackRejectedPromise<Type>(promise: Promise<Type>, error: unknown): void {
  promiseState.set(promise, {
    status: REJECTED,
    error
  });
}

export function getPromiseState<Type>(promise: Promise<Type>): PromiseState<Type> {
  return promiseState.get(promise) as PromiseState<Type> ?? {status: PENDING};
}
