// =============================================================================
// Argument hashing
// =============================================================================

import {AtomFamilyArgs} from '~/atom';


export function hashFamilyArguments(args: AtomFamilyArgs): string {
  return JSON.stringify(args);
}
