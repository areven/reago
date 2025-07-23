// =============================================================================
// Eslint configuration
// =============================================================================

import config from '@areven/eslint-config-react';


export default [
  ...config.default,
  {
    files: ['./src/**/*', './test/**/*'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-unsafe-return': 'off' // broken
    }
  },
  {
    files: ['./test/**/*'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off' // broken
    }
  }
];
