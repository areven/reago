// =============================================================================
// Vitest configuration
// =============================================================================

import {defineConfig, type ViteUserConfig} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';


const config: ViteUserConfig = defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    conditions: ['raw']
  },
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json'],
      reportOnFailure: true,
      include: [
        'package/*/src/**'
      ]
    }
  },
  optimizeDeps: {
    include: [
      'react/jsx-dev-runtime',
      '@vitest/coverage-istanbul'
    ]
  }
});

export default config;
