<style src="./annotationLayer.css"></style>

<script lang="ts">
import Vue, { type PropType } from 'vue'
import ResizeSensor from '@daguanren21/vue-resize-sensor'
import {
  PDFJSWrapper,
  createLoadingTask,
  type PdfSrc,
} from './pdfjsWrapper'

function isValidPage(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && Number.isInteger(value)
    && value >= 1
}

const VuePdf = Vue.extend({
  name: 'VuePdf',
  components: {
    ResizeSensor,
  },
  props: {
    src: {
      type: [String, Object, Uint8Array, ArrayBuffer] as PropType<PdfSrc | ''>,
      default: '',
    },
    page: {
      type: Number,
      default: 1,
    },
    rotate: {
      type: Number,
      default: undefined,
    },
  },
  data() {
    return {
      pdf: null as PDFJSWrapper | null,
    }
  },
  watch: {
    src() {
      this.pdf?.loadDocument(this.src as PdfSrc)
    },
    page(value: number) {
      // Number inputs can briefly emit NaN / empty while typing.
      if (!isValidPage(value))
        return
      this.pdf?.loadPage(value, this.rotate)
    },
    rotate() {
      this.pdf?.renderPage(this.rotate)
    },
  },
  mounted() {
    const canvas = this.$refs.canvas as HTMLCanvasElement
    const annotationLayer = this.$refs.annotationLayer as HTMLElement
    this.pdf = new PDFJSWrapper(canvas, annotationLayer, (event, ...args) => {
      this.$emit(event, ...args)
    })

    this.$on('loaded', () => {
      if (isValidPage(this.page))
        this.pdf?.loadPage(this.page, this.rotate)
    })

    this.$on('page-size', (width: number, height: number) => {
      canvas.style.height = `${canvas.offsetWidth * (height / width)}px`
    })

    this.pdf.loadDocument(this.src as PdfSrc)
  },
  beforeDestroy() {
    this.pdf?.destroy()
    this.pdf = null
  },
  methods: {
    resize(size: { width: number, height: number }) {
      if (this.$el.parentNode === null || (size.width === 0 && size.height === 0))
        return

      const canvas = this.$refs.canvas as HTMLCanvasElement
      if (!canvas.width)
        return

      canvas.style.height = `${canvas.offsetWidth * (canvas.height / canvas.width)}px`

      const resolutionScale = this.pdf?.getResolutionScale()
      if (resolutionScale !== undefined && (resolutionScale < 0.85 || resolutionScale > 1.15))
        this.pdf?.renderPage(this.rotate)
    },
    print(dpi?: number, pageList?: number[]) {
      this.pdf?.printPage(dpi, pageList)
    },
  },
})

// Preserve legacy static helper: pdf.createLoadingTask(...)
type VuePdfComponent = typeof VuePdf & {
  createLoadingTask: typeof createLoadingTask
}

const component = VuePdf as VuePdfComponent
component.createLoadingTask = createLoadingTask

export default component
</script>

<template>
  <span style="position: relative; display: block">
    <canvas
      ref="canvas"
      style="display: inline-block; width: 100%; height: 100%; vertical-align: top"
    />
    <span
      ref="annotationLayer"
      class="annotationLayer"
      style="display: inline-block; width: 100%; height: 100%"
    />
    <ResizeSensor :initial="true" @resize="resize" />
  </span>
</template>
