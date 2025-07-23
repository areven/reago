// =============================================================================
// Vitest configuration
// =============================================================================

import {defineProject, mergeConfig, type ViteUserConfig} from 'vitest/config';
import baseConfig from '../../vitest.config';


const config: ViteUserConfig = mergeConfig(baseConfig, defineProject({
  test: {
    include: [
      'test/**/*.test.ts',
      'test/**/*.test.tsx'
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

export default config;
