// =============================================================================
// tsup configuration
// =============================================================================

import {defineConfig} from 'tsup';


export default defineConfig({
  tsconfig: './tsconfig.build.json',
  entry: ['src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true
});
