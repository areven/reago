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
    browser: {
      provider: 'playwright',
      name: 'chromium',
      enabled: true,
      headless: true,
      screenshotFailures: false
    }
  }
}));
