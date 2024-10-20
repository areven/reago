// =============================================================================
// Vitest configuration
// =============================================================================

import {defineConfig} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';


export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    conditions: ['raw']
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportOnFailure: true,
      include: [
        'package/*/src/**'
      ]
    }
  }
});
