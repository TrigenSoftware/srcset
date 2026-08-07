import { defineConfig } from '@trigen/oxlint'
import reactConfig from '@trigen/oxlint-config/react'
import testConfig from '@trigen/oxlint-config/test'
import tsTypeCheckedConfig from '@trigen/oxlint-config/typescript-type-checked'
import rootConfig from '../../oxlint.config.ts'

export default defineConfig({
  extends: [
    rootConfig,
    reactConfig,
    tsTypeCheckedConfig,
    testConfig
  ],
  env: {
    node: false,
    browser: true
  }
})
