<script lang="ts">
import Vue from 'vue'
import pdf, { createLoadingTask, CMapReaderFactory } from '@daguanren21/vue-pdf'
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'
import type { PDFDocumentLoadingTask } from 'pdfjs-dist/types/src/display/api'

// Local sample (public/). Avoids flaky mozilla.github.io network/CORS in China.
const DEMO_URL = '/tracemonkey.pdf'

type LegacyInit = DocumentInitParameters & {
  CMapReaderFactory?: unknown
}

type PdfSource = string | PDFDocumentLoadingTask

export default Vue.extend({
  name: 'App',
  components: {
    Pdf: pdf,
  },
  data(): {
    mode: 'single' | 'multi' | 'loadingTask'
    src: PdfSource
    page: number
    numPages: number
    rotate: number
    progress: number
    error: string
    demoUrl: string
  } {
    return {
      mode: 'single',
      src: DEMO_URL,
      page: 1,
      numPages: 0,
      rotate: 0,
      progress: 0,
      error: '',
      demoUrl: DEMO_URL,
    }
  },
  watch: {
    page(value: number) {
      if (!Number.isFinite(value))
        return
      if (this.numPages > 0 && value > this.numPages)
        this.page = this.numPages
      else if (value < 1)
        this.page = 1
    },
  },
  methods: {
    onNumPages(n: number | undefined) {
      this.numPages = typeof n === 'number' ? n : 0
      if (this.numPages > 0 && this.page > this.numPages)
        this.page = this.numPages
      this.error = ''
    },
    onProgress(ratio: number) {
      this.progress = Math.round((ratio || 0) * 100)
    },
    onError(err: unknown) {
      if (err instanceof Error)
        this.error = err.message || err.name || 'Load failed'
      else if (err && typeof err === 'object' && 'message' in err)
        this.error = String((err as { message: unknown }).message)
      else
        this.error = String(err)
      console.error('[vue2-pdf playground]', err)
    },
    onPageLoaded() {
      this.error = ''
    },
    useSingle() {
      this.mode = 'single'
      this.src = this.demoUrl
      this.page = 1
      this.error = ''
    },
    useMulti() {
      this.mode = 'multi'
      this.error = ''
      const source: LegacyInit = {
        url: this.demoUrl,
        CMapReaderFactory,
      }
      const task = createLoadingTask(source)
      this.src = task
      task.promise.then((doc) => {
        this.numPages = doc.numPages
      }).catch((err: unknown) => {
        this.onError(err)
      })
    },
    useLoadingTask() {
      this.mode = 'loadingTask'
      this.error = ''
      const source: LegacyInit = {
        url: this.demoUrl,
        CMapReaderFactory,
      }
      const task = pdf.createLoadingTask(source)
      this.src = task
      this.page = 1
      task.promise.then((doc) => {
        this.numPages = doc.numPages
      }).catch((err: unknown) => {
        this.onError(err)
      })
    },
    printAll() {
      const ref = this.$refs.pdf as { print?: (dpi?: number) => void } | undefined
      ref?.print?.(100)
    },
  },
})
</script>

<template>
  <div class="app">
    <header>
      <h1>@daguanren21/vue-pdf playground</h1>
      <p>Vue 2.7 + modern ESM monorepo smoke test</p>
    </header>

    <div class="toolbar">
      <button type="button" :class="{ active: mode === 'single' }" @click="useSingle">
        Single page
      </button>
      <button type="button" :class="{ active: mode === 'multi' }" @click="useMulti">
        Multi page (createLoadingTask + CMap)
      </button>
      <button type="button" :class="{ active: mode === 'loadingTask' }" @click="useLoadingTask">
        onsite-style loadingTask
      </button>
      <button type="button" @click="rotate += 90">
        Rotate +90
      </button>
      <button type="button" @click="printAll">
        Print
      </button>
      <label>
        Page
        <input v-model.number="page" type="number" min="1" :max="numPages || 1">
      </label>
      <span v-if="numPages">{{ page }} / {{ numPages }}</span>
      <span v-if="progress > 0 && progress < 100">load {{ progress }}%</span>
    </div>

    <p v-if="error" class="error">
      {{ error }}
    </p>

    <div v-if="mode === 'multi'" class="multi">
      <Pdf
        v-for="i in numPages"
        :key="i"
        :src="src"
        :page="i"
        class="page"
      />
    </div>
    <div v-else class="single">
      <Pdf
        ref="pdf"
        :src="src"
        :page="page"
        :rotate="rotate"
        @num-pages="onNumPages"
        @progress="onProgress"
        @error="onError"
        @page-loaded="onPageLoaded"
        @link-clicked="page = $event"
      />
    </div>
  </div>
</template>

<style>
:root {
  color-scheme: light dark;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

body {
  margin: 0;
  background: #0f1115;
  color: #e8eaed;
}

.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

header h1 {
  margin: 0 0 4px;
  font-size: 22px;
}

header p {
  margin: 0 0 16px;
  opacity: 0.7;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

button {
  border: 1px solid #3a3f4b;
  background: #1a1f2b;
  color: inherit;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

button.active {
  border-color: #5b8cff;
  background: #243049;
}

input[type='number'] {
  width: 64px;
  margin-left: 6px;
  background: #1a1f2b;
  color: inherit;
  border: 1px solid #3a3f4b;
  border-radius: 6px;
  padding: 4px 6px;
}

.single,
.page {
  border: 1px solid #2b3140;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.multi {
  display: grid;
  gap: 12px;
}

.error {
  color: #ff8e8e;
}
</style>
