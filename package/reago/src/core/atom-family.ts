// =============================================================================
// Atom family
// =============================================================================

import type {AnyAtom} from './atom';
import type {AtomInstance} from './atom-instance';


export interface AtomFamily<T extends AnyAtom> {
  readonly atom: T,
  readonly instanceMap: Map<string, AtomInstance<T>>;
}

export function createAtomFamily<T extends AnyAtom>(atom: T): AtomFamily<T> {
  return {
    atom,
    instanceMap: new Map()
  };
}
