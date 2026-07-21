import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    testTimeout: 60000,
    coverage: {
      reporter: ['lcovonly', 'text'],
      include: ['src/**/*']
    }
  }
})
