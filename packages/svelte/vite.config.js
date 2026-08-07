import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // Svelte components are tested in the client runtime.
    conditions: ['browser']
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    exclude: [...configDefaults.exclude, './package', '.svelte-kit/**'],
    coverage: {
      reporter: ['lcovonly', 'text'],
      include: ['src/**/*']
    }
  }
})
