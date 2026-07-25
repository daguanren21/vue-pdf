import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  AnnotationLayer: class {
    render = vi.fn(async () => undefined)
  },
  PasswordResponses: {
    NEED_PASSWORD: 1,
    INCORRECT_PASSWORD: 2,
  },
  RenderingCancelledException: class RenderingCancelledException extends Error {},
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}))

vi.mock('pdfjs-dist/web/pdf_viewer.mjs', () => ({
  PDFLinkService: class {
    setDocument = vi.fn()
    setViewer = vi.fn()
  },
}))

import { PDFJSWrapper } from '../src/pdfjsWrapper'
import { __resetWorkerForTests } from '../src/worker'

type WrapperInternals = {
  pdfDoc: {
    numPages: number
    getPage: ReturnType<typeof vi.fn>
  } | null
  pendingOperation: Promise<unknown>
  renderPage: (rotate?: number) => void
}

function createDom() {
  const canvas = document.createElement('canvas')
  Object.defineProperty(canvas, 'offsetWidth', { value: 600, configurable: true })
  const annotation = document.createElement('div')
  return { canvas, annotation }
}

function asInternals(wrapper: PDFJSWrapper): WrapperInternals {
  return wrapper as unknown as WrapperInternals
}

describe('PDFJSWrapper.loadPage', () => {
  beforeEach(() => {
    __resetWorkerForTests()
  })

  it('ignores invalid / out-of-range page numbers without emitting error', async () => {
    const { canvas, annotation } = createDom()
    const emit = vi.fn()
    const wrapper = new PDFJSWrapper(canvas, annotation, emit)
    const internals = asInternals(wrapper)

    const getPage = vi.fn()
    internals.pdfDoc = {
      numPages: 3,
      getPage,
    }

    wrapper.loadPage(Number.NaN)
    wrapper.loadPage(0)
    wrapper.loadPage(4)
    wrapper.loadPage(1.5)

    await internals.pendingOperation

    expect(getPage).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalledWith('error', expect.anything())
  })

  it('loads a valid page and emits page-loaded', async () => {
    const { canvas, annotation } = createDom()
    const emit = vi.fn()
    const wrapper = new PDFJSWrapper(canvas, annotation, emit)
    const internals = asInternals(wrapper)

    const page = {
      pageNumber: 2,
      rotate: 0,
      getViewport: () => ({ width: 100, height: 200, clone: () => ({}) }),
      render: () => ({
        promise: Promise.resolve(),
        cancel: () => undefined,
      }),
      getAnnotations: async () => [],
    }

    const getPage = vi.fn(async () => page)
    internals.pdfDoc = {
      numPages: 3,
      getPage,
    }

    // Unit scope: only verify loadPage routing, not full render pipeline.
    internals.renderPage = vi.fn()

    wrapper.loadPage(2)
    await internals.pendingOperation

    expect(getPage).toHaveBeenCalledWith(2)
    expect(emit).toHaveBeenCalledWith('page-loaded', 2)
    expect(internals.renderPage).toHaveBeenCalled()
  })
})
