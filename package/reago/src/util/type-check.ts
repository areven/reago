// =============================================================================
// Type checking
// =============================================================================

import type {AnyAtom} from '~/core/atom';


export function isAnyAtom(value: any): value is AnyAtom {
  return typeof value === 'function';
}

export function isPromiseLike(value: any): value is PromiseLike<any> {
  return value instanceof Object && typeof value.then === 'function';
}

export function isGenerator(value: any): value is Generator<any> {
  return (
    value instanceof Object &&
    typeof value.next === 'function' &&
    typeof value.return === 'function' &&
    typeof value.throw === 'function'
  );
}
