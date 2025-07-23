// =============================================================================
// Utils
// =============================================================================

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value instanceof Object &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
