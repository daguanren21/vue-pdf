import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue2'
import dts from 'vite-plugin-dts'
import { createRequire } from 'node:module'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('.', import.meta.url))

function copyPdfWorker(): Plugin {
  return {
    name: 'copy-pdf-worker',
    closeBundle() {
      const workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
      const outDir = join(root, 'dist')
      const workerDest = join(outDir, 'pdf.worker.min.mjs')
      if (!existsSync(outDir))
        mkdirSync(outDir, { recursive: true })
      copyFileSync(workerSrc, workerDest)

      const srcDest = join(root, 'src', 'pdf.worker.min.mjs')
      copyFileSync(workerSrc, srcDest)
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      rollupTypes: true,
      insertTypesEntry: true,
      entryRoot: 'src',
    }),
    copyPdfWorker(),
  ],
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        'vue-pdf': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        CMapReaderFactory: fileURLToPath(new URL('./src/CMapReaderFactory.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_format, entryName) => (entryName === 'vue-pdf' ? 'vue-pdf.js' : `${entryName}.js`),
    },
    rollupOptions: {
      external: [
        'vue',
        '@daguanren21/vue-resize-sensor',
        'pdfjs-dist',
        'pdfjs-dist/web/pdf_viewer.mjs',
        /^pdfjs-dist\/(?!build\/pdf\.worker\.min\.mjs).*/,
      ],
      output: {
        assetFileNames: 'vue-pdf.[ext]',
        exports: 'named',
        preserveModules: false,
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    target: 'es2020',
  },
})
