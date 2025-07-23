// =============================================================================
// Vitest configuration
// =============================================================================

import {defineProject, mergeConfig, type ViteUserConfig} from 'vitest/config';
import baseConfig from '../../vitest.config';


const config: ViteUserConfig = mergeConfig(baseConfig, defineProject({
  test: {
    environment: 'node',
    include: [
      'test/**/*.test.ts'
    ],
    typecheck: {
      enabled: true,
      include: [
        'test/**/*.test-d.ts'
      ]
    }
  }
}));

export default config;
