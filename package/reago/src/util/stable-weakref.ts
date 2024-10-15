// =============================================================================
// Stable WeakRef
// =============================================================================

const stableWeakRefMap = new WeakMap<WeakKey, WeakRef<WeakKey>>();

export function stableWeakRef<T extends WeakKey>(v: T): WeakRef<T> {
  let ref = stableWeakRefMap.get(v) as WeakRef<T> | undefined;
  if (ref === undefined) {
    ref = new WeakRef(v);
    stableWeakRefMap.set(v, ref);
  }
  return ref;
}
