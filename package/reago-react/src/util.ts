// =============================================================================
// Utils
// =============================================================================

export function isPromiseLike(value: any): value is PromiseLike<any> {
  return value instanceof Object && typeof value.then === 'function';
}
