// =============================================================================
// Commitlint configuration
// =============================================================================

import {RuleConfigSeverity as Severity, UserConfig} from '@commitlint/types';


const commitlintConfig: UserConfig = {
  rules: {
    'body-leading-blank': [Severity.Error, 'always'],
    'body-max-line-length': [Severity.Error, 'always', 100],
    'footer-leading-blank': [Severity.Error, 'always'],
    'footer-max-line-length': [Severity.Error, 'always', 100],
    'header-max-length': [Severity.Error, 'always', 100],
    'header-trim': [Severity.Error, 'always'],
    'scope-case': [Severity.Error, 'always', 'lower-case'],
    'scope-max-length': [Severity.Error, 'always', 20],
    'subject-case': [
      Severity.Error,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case']
    ],
    'subject-empty': [Severity.Error, 'never'],
    'subject-exclamation-mark': [Severity.Error, 'never'],
    'subject-full-stop': [Severity.Error, 'never', '.'],
    'type-case': [Severity.Error, 'always', 'lower-case'],
    'type-empty': [Severity.Error, 'never'],
    'type-enum': [
      Severity.Error,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test'
      ]
    ]
  }
};

export default commitlintConfig;
