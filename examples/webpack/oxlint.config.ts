import { defineConfig } from '@trigen/oxlint'
import reactConfig from '@trigen/oxlint-config/react'
import rootConfig from '../../oxlint.config.ts'

export default defineConfig({
  extends: [
    rootConfig,
    reactConfig
  ],
  // The bundler config runs in node, the entry code runs in a browser.
  env: {
    browser: true
  },
  rules: {
    // Preact JSX uses real DOM attribute names, like `class`.
    'react/no-unknown-property': 'off'
  }
})
