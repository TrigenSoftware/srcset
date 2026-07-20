import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      formats: ['es'],
      entry: {
        cli: './src/cli.ts'
      }
    },
    rolldownOptions: {
      external: id => /^(?:node:|@srcset\/|argue-cli|tinyglobby)/.test(id),
      output: {
        topLevelVar: false,
        banner: '#!/usr/bin/env node'
      }
    },
    sourcemap: true,
    minify: false,
    emptyOutDir: false
  },
  test: {
    exclude: [...configDefaults.exclude, './package'],
    coverage: {
      reporter: ['lcovonly', 'text'],
      include: ['src/**/*']
    }
  }
})
