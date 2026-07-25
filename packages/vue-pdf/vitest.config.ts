import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue2'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@daguanren21/vue-resize-sensor': fileURLToPath(
        new URL('../vue-resize-sensor/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.{test,spec}.ts'],
    globals: false,
    restoreMocks: true,
    clearMocks: true,
  },
})
