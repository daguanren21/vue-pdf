import { describe, expect, it, vi } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  AnnotationLayer: class {},
  PasswordResponses: { NEED_PASSWORD: 1, INCORRECT_PASSWORD: 2 },
  RenderingCancelledException: class extends Error {},
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({ promise: Promise.resolve({ numPages: 1 }) })),
}))

vi.mock('pdfjs-dist/web/pdf_viewer.mjs', () => ({
  PDFLinkService: class {
    setDocument() {}
    setViewer() {}
  },
}))

import pdf, {
  createLoadingTask,
  setWorkerSrc,
  ensureWorker,
  CMapReaderFactory,
  getDefaultCMapOptions,
  PDFJSWrapper,
  VuePdf,
} from '../src/index'

describe('package exports', () => {
  it('default export is the component with static createLoadingTask', () => {
    expect(pdf).toBeTruthy()
    expect(typeof pdf.createLoadingTask).toBe('function')
    expect(pdf.createLoadingTask).toBe(createLoadingTask)
  })

  it('named exports are available', () => {
    expect(VuePdf).toBeTruthy()
    expect(typeof createLoadingTask).toBe('function')
    expect(typeof setWorkerSrc).toBe('function')
    expect(typeof ensureWorker).toBe('function')
    expect(typeof CMapReaderFactory).toBe('function')
    expect(typeof getDefaultCMapOptions).toBe('function')
    expect(PDFJSWrapper).toBeTruthy()
  })
})
