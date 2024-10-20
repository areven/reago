// =============================================================================
// Argument hashing
// =============================================================================

import type {AtomFamilyArgs} from '~/core/atom';


export function hashFamilyArguments(args: AtomFamilyArgs): string {
  return JSON.stringify(args);
}
