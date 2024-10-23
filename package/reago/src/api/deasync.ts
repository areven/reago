// =============================================================================
// Public deasync() API
// =============================================================================

import {PENDING, RESOLVED} from '~/const';
import {atomComputationEffect} from '~/hook/atom-computation-effect';
import {atomMemo} from '~/hook/atom-memo';
import {atomReducer} from '~/hook/atom-reducer';
import {getPromiseState, trackPromise} from '~/util/tracked-promise';
import {isAnyAtom, isPromiseLike} from '~/util/type-check';
import {read} from './read';
import type {AnyAtom, AtomFamilyArgsOf, AtomResultOf, FunctionalAtom} from '~/core/atom';


export type DeasyncAtom<T extends AnyAtom> = FunctionalAtom<
  DeasyncState<Awaited<AtomResultOf<T>>>,
  AtomFamilyArgsOf<T>,
  never // actions are not carried over
>;

export type DeasyncState<ResultType = unknown, ErrorType = unknown> = (
  PendingDeasyncState |
  ResolvedDeasyncState<ResultType> |
  RejectedDeasyncState<ErrorType>
);

interface PendingDeasyncState {
  status: 'pending';
}

interface ResolvedDeasyncState<ResultType> {
  status: 'resolved';
  result: ResultType;
}

interface RejectedDeasyncState<ErrorType> {
  status: 'rejected';
  error: ErrorType;
}

export function deasync<T>(promise: PromiseLike<T>): DeasyncState<Awaited<T>>;
export function deasync<T extends AnyAtom>(atom: T): DeasyncAtom<T>;
export function deasync<T>(value: T): ResolvedDeasyncState<T>;
export function deasync(input: unknown): unknown {
  if (isPromiseLike(input)) {
    return deasyncPromise(input);
  } else if (isAnyAtom(input)) {
    return deasyncAtom(input);
  } else {
    return deasyncRaw(input);
  }
}

function deasyncRaw<T>(value: T): ResolvedDeasyncState<T> {
  return {
    status: 'resolved',
    result: value
  };
}

function deasyncPromise<T>(promise: PromiseLike<T>): DeasyncState<Awaited<T>> {
  trackPromise(promise);
  const state = getPromiseState(promise);
  if (state.status === PENDING) {
    return {
      status: 'pending'
    };
  } else if (state.status === RESOLVED) {
    return {
      status: 'resolved',
      result: state.result
    };
  } else {
    return {
      status: 'rejected',
      error: state.error
    }
  }
}

function deasyncAtom<T extends AnyAtom>(atom: T): DeasyncAtom<T> {
  return (...args) => {
    const result = read(atom, ...args);
    const unpacked = isPromiseLike(result) ? deasyncPromise(result) : deasyncRaw(result);

    const [_tick, refresh] = atomReducer(x => x + 1, 0);
    atomComputationEffect(
      () => {
        if (unpacked.status === 'pending' && isPromiseLike(result)) {
          result.then(refresh, refresh);
        }
      },
      [unpacked.status, result]
    );

    return atomMemo(
      () => unpacked,
      [unpacked.status, (unpacked as any).result, (unpacked as any).error]
    );
  };
}
