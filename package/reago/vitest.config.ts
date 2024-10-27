// =============================================================================
// Vitest configuration
// =============================================================================

import {defineProject, mergeConfig} from 'vitest/config';
import baseConfig from '../../vitest.config';


export default mergeConfig(baseConfig, defineProject({
  test: {
    include: [
      'test/**/*.test.ts'
    ],
    environment: 'node'
  }
}));
