import {
  AnnotationLayer,
  PasswordResponses,
  RenderingCancelledException,
} from 'pdfjs-dist'
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from 'pdfjs-dist/types/src/display/api'
import { PDFLinkService } from 'pdfjs-dist/web/pdf_viewer.mjs'
import type { IPDFLinkService } from 'pdfjs-dist/types/web/interfaces'
import {
  createLoadingTask,
  isPDFDocumentLoadingTask,
  type CreateLoadingTaskOptions,
  type PdfSrc,
} from './createLoadingTask'
import { ensureWorker } from './worker'

type Emit = (event: string, ...args: unknown[]) => void

type LoadingTaskMarked = PDFDocumentLoadingTask & {
  destroyed?: boolean
}

function isInvalidPageRequest(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /invalid page request/i.test(message)
}

export class PDFJSWrapper {
  private pdfDoc: PDFDocumentProxy | null = null
  private pdfPage: PDFPageProxy | null = null
  private pdfRender: RenderTask | null = null
  private canceling = false
  /** Per-instance queue so multi-page views do not share state. */
  private pendingOperation: Promise<unknown> = Promise.resolve()
  /** Bumped on document/page changes to drop stale async results. */
  private generation = 0

  constructor(
    private readonly canvasElt: HTMLCanvasElement,
    private readonly annotationLayerElt: HTMLElement,
    private readonly emitEvent: Emit,
  ) {
    ensureWorker()
    this.canvasElt.getContext('2d')?.save()
    this.annotationLayerElt.style.transformOrigin = '0 0'
  }

  destroy(): void {
    this.generation += 1
    if (this.pdfRender) {
      try {
        this.pdfRender.cancel()
      }
      catch {
        // ignore cancel races
      }
      this.pdfRender = null
    }

    const doc = this.pdfDoc
    this.pdfDoc = null
    this.pdfPage = null

    if (doc === null)
      return

    this.pendingOperation = this.pendingOperation
      .catch(() => undefined)
      .then(() => doc.destroy())
      .catch(() => undefined)
  }

  getResolutionScale(): number {
    return this.canvasElt.offsetWidth / this.canvasElt.width
  }

  printPage(dpi?: number, pageNumberOnly?: number[]): void {
    if (this.pdfPage === null || this.pdfDoc === null)
      return

    const pdfDoc = this.pdfDoc
    const PRINT_RESOLUTION = dpi === undefined ? 150 : dpi
    const PRINT_UNITS = PRINT_RESOLUTION / 72.0
    const CSS_UNITS = 96.0 / 72.0
    const iframeElt = document.createElement('iframe')

    const removeIframe = () => {
      iframeElt.parentNode?.removeChild(iframeElt)
    }

    new Promise<Window>((resolve) => {
      iframeElt.frameBorder = '0'
      iframeElt.scrolling = 'no'
      iframeElt.width = '0px'
      iframeElt.height = '0px'
      iframeElt.style.cssText = 'position: absolute; top: 0; left: 0'
      iframeElt.onload = function onload() {
        resolve((this as HTMLIFrameElement).contentWindow as Window)
      }
      document.body.appendChild(iframeElt)
    })
      .then(async (win) => {
        win.document.title = ''
        const page = await pdfDoc.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        win.document.head.appendChild(win.document.createElement('style')).textContent =
          `@supports ((size:A4) and (size:1pt 1pt)) {` +
          `@page { margin: 1pt; size: ${(viewport.width * PRINT_UNITS) / CSS_UNITS}pt ${(viewport.height * PRINT_UNITS) / CSS_UNITS}pt; }` +
          `}` +
          `@media print { body { margin: 0 } canvas { page-break-before: avoid; page-break-after: always; page-break-inside: avoid } }` +
          `@media screen { body { margin: 0 } }`
        return win
      })
      .then(async (win) => {
        const allPages: Promise<void>[] = []

        for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; ++pageNumber) {
          if (pageNumberOnly !== undefined && pageNumberOnly.indexOf(pageNumber) === -1)
            continue

          allPages.push(
            pdfDoc.getPage(pageNumber).then(async (page) => {
              const viewport = page.getViewport({ scale: 1 })
              const printCanvasElt = win.document.body.appendChild(win.document.createElement('canvas'))
              printCanvasElt.width = viewport.width * PRINT_UNITS
              printCanvasElt.height = viewport.height * PRINT_UNITS
              const ctx = printCanvasElt.getContext('2d')
              if (!ctx)
                return

              await page.render({
                canvasContext: ctx,
                transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0],
                viewport,
                intent: 'print',
              }).promise
            }),
          )
        }

        try {
          await Promise.all(allPages)
          win.focus()
          // Prefer window.print(); document.execCommand('print') is deprecated.
          win.print()
          removeIframe()
        }
        catch (err) {
          removeIframe()
          this.emitEvent('error', err)
        }
      })
  }

  renderPage(rotate?: number): void {
    if (this.pdfRender !== null) {
      if (this.canceling)
        return
      this.canceling = true
      try {
        this.pdfRender.cancel()
      }
      catch (err) {
        this.emitEvent('error', err)
      }
      return
    }

    if (this.pdfPage === null)
      return

    const pdfPage = this.pdfPage
    const pageRotate = (pdfPage.rotate === undefined ? 0 : pdfPage.rotate) + (rotate === undefined ? 0 : rotate)
    const scale = (this.canvasElt.offsetWidth / pdfPage.getViewport({ scale: 1 }).width) * (window.devicePixelRatio || 1)
    const viewport = pdfPage.getViewport({ scale, rotation: pageRotate })
    const renderGeneration = this.generation

    this.emitEvent('page-size', viewport.width, viewport.height, scale)

    this.canvasElt.width = viewport.width
    this.canvasElt.height = viewport.height

    const ctx = this.canvasElt.getContext('2d')
    if (!ctx)
      return

    this.pdfRender = pdfPage.render({
      canvasContext: ctx,
      viewport,
    })

    this.annotationLayerElt.style.visibility = 'hidden'
    this.clearAnnotations()

    const viewer = {
      scrollPageIntoView: (params: { pageNumber: number }) => {
        this.emitEvent('link-clicked', params.pageNumber)
      },
    }

    const linkService = new PDFLinkService() as unknown as IPDFLinkService
    ;(linkService as unknown as PDFLinkService).setDocument(this.pdfDoc)
    ;(linkService as unknown as PDFLinkService).setViewer(viewer)

    const renderTask = this.pdfRender

    this.pendingOperation = this.pendingOperation
      .catch(() => undefined)
      .then(async () => {
        if (renderGeneration !== this.generation)
          return

        const getAnnotationsOperation = pdfPage
          .getAnnotations({ intent: 'display' })
          .then(async (annotations) => {
            if (renderGeneration !== this.generation)
              return

            const layer = new AnnotationLayer({
              div: this.annotationLayerElt as HTMLDivElement,
              accessibilityManager: null,
              annotationCanvasMap: null,
              annotationEditorUIManager: null,
              page: pdfPage,
              viewport: viewport.clone({ dontFlip: true }),
              structTreeLayer: null,
            })

            await layer.render({
              viewport: viewport.clone({ dontFlip: true }),
              div: this.annotationLayerElt as HTMLDivElement,
              annotations,
              page: pdfPage,
              linkService,
              renderForms: false,
            })
          })

        const pdfRenderOperation = renderTask.promise
          .then(() => {
            if (renderGeneration !== this.generation)
              return
            this.annotationLayerElt.style.visibility = ''
            this.canceling = false
            this.pdfRender = null
          })
          .catch((err: unknown) => {
            this.pdfRender = null
            if (err instanceof RenderingCancelledException) {
              this.canceling = false
              if (renderGeneration === this.generation)
                this.renderPage(rotate)
              return
            }
            if (renderGeneration === this.generation)
              this.emitEvent('error', err)
          })

        return Promise.all([getAnnotationsOperation, pdfRenderOperation])
      })
  }

  forEachPage(pageCallback: (page: PDFPageProxy) => unknown): void {
    if (this.pdfDoc === null)
      return

    const pdfDoc = this.pdfDoc
    const numPages = pdfDoc.numPages

    const next = (pageNum: number) => {
      pdfDoc
        .getPage(pageNum)
        .then(pageCallback)
        .then(() => {
          if (++pageNum <= numPages)
            next(pageNum)
        })
    }

    next(1)
  }

  loadPage(pageNumber: number, rotate?: number): void {
    const page = Number(pageNumber)
    if (!Number.isFinite(page) || !Number.isInteger(page))
      return

    // Document not ready yet; mounted hook will load page on `loaded`.
    if (this.pdfDoc === null)
      return

    if (page < 1 || page > this.pdfDoc.numPages)
      return

    const requestGeneration = ++this.generation
    this.pdfPage = null

    // Cancel in-flight render for the previous page.
    if (this.pdfRender) {
      try {
        this.pdfRender.cancel()
      }
      catch {
        // ignore
      }
      this.pdfRender = null
      this.canceling = false
    }

    const pdfDoc = this.pdfDoc

    this.pendingOperation = this.pendingOperation
      .catch(() => undefined)
      .then(() => {
        if (requestGeneration !== this.generation || this.pdfDoc !== pdfDoc)
          return null
        return pdfDoc.getPage(page)
      })
      .then((pdfPage) => {
        if (!pdfPage || requestGeneration !== this.generation || this.pdfDoc !== pdfDoc)
          return
        this.pdfPage = pdfPage
        this.renderPage(rotate)
        this.emitEvent('page-loaded', pdfPage.pageNumber)
      })
      .catch((err: unknown) => {
        // Stale / out-of-range requests should not surface as hard UI errors.
        if (requestGeneration !== this.generation || isInvalidPageRequest(err))
          return
        this.clearCanvas()
        this.clearAnnotations()
        this.emitEvent('error', err)
      })
  }

  loadDocument(src: PdfSrc | '' | null | undefined): void {
    const requestGeneration = ++this.generation

    if (this.pdfRender) {
      try {
        this.pdfRender.cancel()
      }
      catch {
        // ignore
      }
      this.pdfRender = null
      this.canceling = false
    }

    this.pdfDoc = null
    this.pdfPage = null
    this.emitEvent('num-pages', undefined)

    if (!src) {
      this.canvasElt.removeAttribute('width')
      this.canvasElt.removeAttribute('height')
      this.clearAnnotations()
      return
    }

    this.pendingOperation = this.pendingOperation
      .catch(() => undefined)
      .then(() => {
        if (requestGeneration !== this.generation)
          return

        let loadingTask: PDFDocumentLoadingTask | undefined
        if (isPDFDocumentLoadingTask(src)) {
          const marked = src as LoadingTaskMarked
          if (marked.destroyed) {
            this.emitEvent('error', new Error('loadingTask has been destroyed'))
            return
          }
          loadingTask = src
        }
        else {
          loadingTask = createLoadingTask(src, {
            onPassword: (updatePassword: (password: string) => void, reason: number) => {
              let reasonStr: string | undefined
              switch (reason) {
                case PasswordResponses.NEED_PASSWORD:
                  reasonStr = 'NEED_PASSWORD'
                  break
                case PasswordResponses.INCORRECT_PASSWORD:
                  reasonStr = 'INCORRECT_PASSWORD'
                  break
              }
              this.emitEvent('password', updatePassword, reasonStr)
            },
            onProgress: (status) => {
              const ratio = status.total ? status.loaded / status.total : 0
              this.emitEvent('progress', Math.min(ratio, 1))
            },
          })
        }

        return loadingTask?.promise
      })
      .then((pdf) => {
        if (!pdf || requestGeneration !== this.generation)
          return
        this.pdfDoc = pdf
        this.emitEvent('num-pages', pdf.numPages)
        this.emitEvent('loaded')
      })
      .catch((err: unknown) => {
        if (requestGeneration !== this.generation)
          return
        this.clearCanvas()
        this.clearAnnotations()
        this.emitEvent('error', err)
      })
  }

  private clearCanvas(): void {
    this.canvasElt.getContext('2d')?.clearRect(0, 0, this.canvasElt.width, this.canvasElt.height)
  }

  private clearAnnotations(): void {
    while (this.annotationLayerElt.firstChild)
      this.annotationLayerElt.removeChild(this.annotationLayerElt.firstChild)
  }
}

export { createLoadingTask }
export type { CreateLoadingTaskOptions, PdfSrc }
