import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GlobalWorkerOptions } from 'pdfjs-dist'

const getDocument = vi.fn()

vi.mock('pdfjs-dist', () => ({
  getDocument: (...args: unknown[]) => getDocument(...args),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}))

import {
  createLoadingTask,
  isPDFDocumentLoadingTask,
} from '../src/createLoadingTask'
import { __resetWorkerForTests, setWorkerSrc } from '../src/worker'

describe('createLoadingTask', () => {
  beforeEach(() => {
    __resetWorkerForTests()
    getDocument.mockReset()
    getDocument.mockImplementation((source: unknown) => ({
      promise: Promise.resolve({ numPages: 1, source }),
      onPassword: undefined,
      onProgress: undefined,
    }))
  })

  it('marks returned task as PDFDocumentLoadingTask', () => {
    const task = createLoadingTask('https://example.com/a.pdf')
    expect(isPDFDocumentLoadingTask(task)).toBe(true)
    expect(isPDFDocumentLoadingTask({})).toBe(false)
    expect(isPDFDocumentLoadingTask(null)).toBe(false)
  })

  it('accepts string src as url', () => {
    createLoadingTask('https://example.com/a.pdf')
    expect(getDocument).toHaveBeenCalledWith({ url: 'https://example.com/a.pdf' })
  })

  it('accepts Uint8Array src as data', () => {
    const data = new Uint8Array([1, 2, 3])
    createLoadingTask(data)
    expect(getDocument).toHaveBeenCalledWith({ data })
  })

  it('accepts ArrayBuffer src as data', () => {
    const buffer = new Uint8Array([9, 8, 7]).buffer
    createLoadingTask(buffer)
    const firstCall = getDocument.mock.calls[0]
    expect(firstCall).toBeTruthy()
    const arg = firstCall![0]
    expect(arg && typeof arg === 'object' && 'data' in arg).toBe(true)
    if (arg && typeof arg === 'object' && 'data' in arg) {
      const data = arg.data
      expect(data).toBeInstanceOf(Uint8Array)
      expect(Array.from(data as Uint8Array)).toEqual([9, 8, 7])
    }
  })

  it('strips legacy CMapReaderFactory field', () => {
    createLoadingTask({
      url: 'https://example.com/a.pdf',
      CMapReaderFactory: function Fake() {},
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    } as never)

    expect(getDocument).toHaveBeenCalledWith({
      url: 'https://example.com/a.pdf',
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    })
  })

  it('sets withCredentials from options', () => {
    createLoadingTask('https://example.com/a.pdf', { withCredentials: true })
    expect(getDocument).toHaveBeenCalledWith({
      url: 'https://example.com/a.pdf',
      withCredentials: true,
    })
  })

  it('wires onPassword and onProgress callbacks', () => {
    const onPassword = vi.fn()
    const onProgress = vi.fn()
    const task = createLoadingTask('https://example.com/a.pdf', {
      onPassword,
      onProgress,
    })

    expect(task.onPassword).toBe(onPassword)
    expect(task.onProgress).toBe(onProgress)
  })

  it('throws on invalid src type', () => {
    expect(() => createLoadingTask(123 as never)).toThrow(/invalid src type/i)
  })

  it('honors workerSrc option', () => {
    createLoadingTask('https://example.com/a.pdf', {
      workerSrc: '/custom-worker.js',
    })
    expect(GlobalWorkerOptions.workerSrc).toBe('/custom-worker.js')
    expect(getDocument).toHaveBeenCalled()
  })
})

describe('setWorkerSrc', () => {
  beforeEach(() => {
    __resetWorkerForTests()
  })

  it('stores custom worker path', () => {
    setWorkerSrc('/static/pdf.worker.min.mjs')
    expect(GlobalWorkerOptions.workerSrc).toBe('/static/pdf.worker.min.mjs')
  })
})
