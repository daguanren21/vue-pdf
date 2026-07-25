import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import dts from 'vite-plugin-dts'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'VueResizeSensor',
      formats: ['es'],
      fileName: () => 'vue-resize-sensor.js',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        assetFileNames: 'vue-resize-sensor.[ext]',
        exports: 'named',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    target: 'es2020',
  },
})
