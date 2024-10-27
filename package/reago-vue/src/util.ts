// =============================================================================
// Utils
// =============================================================================

export function isPromiseLike(value: any): value is PromiseLike<unknown> {
  return value instanceof Object && typeof value.then === 'function';
}
