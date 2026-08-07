import { defineConfig } from '@trigen/oxlint'
import testConfig from '@trigen/oxlint-config/test'
import tsTypeCheckedConfig from '@trigen/oxlint-config/typescript-type-checked'
import rootConfig from '../../oxlint.config.ts'

export default defineConfig({
  ignorePatterns: ['.svelte-kit'],
  extends: [
    rootConfig,
    tsTypeCheckedConfig,
    testConfig
  ],
  env: {
    node: false,
    browser: true
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      globals: {
        $props: 'readonly',
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $bindable: 'readonly'
      },
      rules: {
        // Svelte requires `let` for reactive props: reassignment is done by the compiler.
        'prefer-const': 'off',
        // Script blocks are indented inside the `<script>` tag,
        // including the closing tag line.
        'stylistic-js/indent': 'off',
        'stylistic-js/eol-last': 'off',
        'stylistic-js/no-trailing-spaces': 'off'
      }
    }
  ]
})
