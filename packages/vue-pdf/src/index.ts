import VuePdf from './VuePdf.vue'
import { createLoadingTask } from './createLoadingTask'
import { setWorkerSrc, ensureWorker, resolveBundledWorkerSrc } from './worker'
import CMapReaderFactory, { getDefaultCMapOptions } from './CMapReaderFactory'
import { PDFJSWrapper } from './pdfjsWrapper'

export {
  VuePdf,
  createLoadingTask,
  setWorkerSrc,
  ensureWorker,
  resolveBundledWorkerSrc,
  CMapReaderFactory,
  getDefaultCMapOptions,
  PDFJSWrapper,
}

// Match legacy default export shape: component + static createLoadingTask
type VuePdfWithStatics = typeof VuePdf & {
  createLoadingTask: typeof createLoadingTask
  setWorkerSrc: typeof setWorkerSrc
}

const component = VuePdf as VuePdfWithStatics
component.createLoadingTask = createLoadingTask
component.setWorkerSrc = setWorkerSrc

export default component
