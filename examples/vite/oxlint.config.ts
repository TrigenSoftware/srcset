import { defineConfig } from '@trigen/oxlint'
import rootConfig from '../../oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  // The bundler config runs in node, the entry code runs in a browser.
  env: {
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
        // A component without imports is still a module.
        'import/unambiguous': 'off',
        // Script blocks are indented inside the `<script>` tag,
        // including the closing tag line.
        'stylistic-js/indent': 'off',
        'stylistic-js/eol-last': 'off',
        'stylistic-js/no-trailing-spaces': 'off'
      }
    }
  ]
})
