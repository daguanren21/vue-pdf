import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { createRequire } from 'node:module'
import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

const require = createRequire(import.meta.url)
const monorepoRoot = fileURLToPath(new URL('../..', import.meta.url))
const pkgSrc = fileURLToPath(new URL('../../packages/vue-pdf/src', import.meta.url))

function ensureDevWorker(): Plugin {
  return {
    name: 'ensure-dev-pdf-worker',
    buildStart() {
      const workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
      const dest = `${pkgSrc}/pdf.worker.min.mjs`
      if (!existsSync(dest))
        copyFileSync(workerSrc, dest)
    },
  }
}

export default defineConfig({
  plugins: [vue(), ensureDevWorker()],
  resolve: {
    alias: {
      '@daguanren21/vue-pdf/style.css': fileURLToPath(
        new URL('../../packages/vue-pdf/src/annotationLayer.css', import.meta.url),
      ),
      '@daguanren21/vue-pdf': fileURLToPath(new URL('../../packages/vue-pdf/src/index.ts', import.meta.url)),
      '@daguanren21/vue-resize-sensor': fileURLToPath(
        new URL('../../packages/vue-resize-sensor/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
    open: false,
    fs: {
      allow: [monorepoRoot],
    },
  },
  optimizeDeps: {
    exclude: ['@daguanren21/vue-pdf', '@daguanren21/vue-resize-sensor'],
  },
})
