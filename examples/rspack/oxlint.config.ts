import { defineConfig } from '@trigen/oxlint'
import rootConfig from '../../oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  // The bundler config runs in node, the entry code runs in a browser.
  env: {
    browser: true
  }
})
