// =============================================================================
// Comparison utils
// =============================================================================

export function compareEqual(a: unknown, b: unknown): boolean {
  return Object.is(a, b);
}

export function compareDepsEqual(a: unknown[], b: unknown[]): boolean {
  if (a === b) {
    return true;
  }

  for (let i = 0; i < Math.max(a.length, b.length); ++i) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}
