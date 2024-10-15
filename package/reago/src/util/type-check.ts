// =============================================================================
// Type checking
// =============================================================================

export function isPromise(value: any): value is Promise<any> {
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
