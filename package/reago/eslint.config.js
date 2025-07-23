// =============================================================================
// Eslint configuration
// =============================================================================

import config from '@areven/eslint-config';


export default [
  ...config.default,
  {
    files: ['./test/**/*'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
];
