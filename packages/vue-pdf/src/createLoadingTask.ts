import { getDocument } from 'pdfjs-dist'
import type {
  DocumentInitParameters,
  OnProgressParameters,
  PDFDocumentLoadingTask,
} from 'pdfjs-dist/types/src/display/api'
import { ensureWorker, setWorkerSrc } from './worker'

export type PdfSrc =
  | string
  | Uint8Array
  | ArrayBuffer
  | DocumentInitParameters
  | PDFDocumentLoadingTask

export interface CreateLoadingTaskOptions {
  onPassword?: PDFDocumentLoadingTask['onPassword']
  onProgress?: (status: OnProgressParameters) => void
  withCredentials?: boolean
  /** Override pdf.js worker src for this task (also configures GlobalWorkerOptions). */
  workerSrc?: string
}

const LOADING_TASK_MARK = '__PDFDocumentLoadingTask'

type LoadingTaskMarked = PDFDocumentLoadingTask & {
  __PDFDocumentLoadingTask?: boolean
  destroyed?: boolean
}

type LegacySource = DocumentInitParameters & {
  CMapReaderFactory?: unknown
}

export function isPDFDocumentLoadingTask(obj: unknown): obj is PDFDocumentLoadingTask {
  return typeof obj === 'object'
    && obj !== null
    && (obj as LoadingTaskMarked).__PDFDocumentLoadingTask === true
}

export function createLoadingTask(
  src: Exclude<PdfSrc, PDFDocumentLoadingTask>,
  options: CreateLoadingTaskOptions = {},
): PDFDocumentLoadingTask {
  if (options.workerSrc)
    setWorkerSrc(options.workerSrc)
  else
    ensureWorker()

  let source: LegacySource

  if (typeof src === 'string') {
    source = { url: src }
  }
  else if (src instanceof Uint8Array) {
    source = { data: src }
  }
  else if (src instanceof ArrayBuffer) {
    source = { data: new Uint8Array(src) }
  }
  else if (typeof src === 'object' && src !== null) {
    source = { ...(src as DocumentInitParameters) }
  }
  else {
    throw new TypeError('invalid src type')
  }

  // Legacy onsite API: { url, CMapReaderFactory }.
  // pdfjs 4+ uses cMapUrl/cMapPacked. Keep a custom factory only if it is a
  // callable that pdfjs understands; otherwise drop it so getDocument does not
  // choke, and rely on optional cMapUrl already on the source object.
  if ('CMapReaderFactory' in source && source.CMapReaderFactory) {
    // pdfjs no longer accepts CMapReaderFactory on DocumentInitParameters.
    // If the app also passed cMapUrl, that path is kept. ASCII PDFs work without cmaps.
    delete source.CMapReaderFactory
  }

  if (options.withCredentials)
    source.withCredentials = options.withCredentials

  const loadingTask = getDocument(source) as LoadingTaskMarked
  loadingTask.__PDFDocumentLoadingTask = true

  if (options.onPassword)
    loadingTask.onPassword = options.onPassword

  if (options.onProgress)
    loadingTask.onProgress = options.onProgress

  return loadingTask
}
