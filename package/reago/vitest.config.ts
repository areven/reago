// =============================================================================
// Vitest configuration
// =============================================================================

import {defineProject, mergeConfig} from 'vitest/config';
import baseConfig from '../../vitest.config';


export default mergeConfig(baseConfig, defineProject({
  test: {
    environment: 'node',
    include: [
      'test/**/*.test.ts'
    ],
    typecheck: {
      enabled: true,
      include: [
        'test/**/*.test-d.ts'
      ],
    }
  }
}));
