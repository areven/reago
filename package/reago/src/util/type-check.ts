// =============================================================================
// Type checking
// =============================================================================

import type {AnyAtom} from '~/core/atom';


export function isAnyAtom(value: unknown): value is AnyAtom {
  return typeof value === 'function';
}

export function isPromiseLike(value: unknown): value is PromiseLike<any> {
  return (
    value instanceof Object &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

export function isGenerator(value: unknown): value is Generator<any> {
  return (
    value instanceof Object &&
    'next' in value &&
    'return' in value &&
    'throw' in value &&
    typeof value.next === 'function' &&
    typeof value.return === 'function' &&
    typeof value.throw === 'function'
  );
}
