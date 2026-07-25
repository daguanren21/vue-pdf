import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}))

import {
  __resetWorkerForTests,
  ensureWorker,
  resolveBundledWorkerSrc,
  setWorkerSrc,
} from '../src/worker'
import { GlobalWorkerOptions } from 'pdfjs-dist'

describe('worker', () => {
  beforeEach(() => {
    __resetWorkerForTests()
  })

  it('resolveBundledWorkerSrc points at local pdf.worker.min.mjs', () => {
    const src = resolveBundledWorkerSrc()
    expect(src).toMatch(/pdf\.worker\.min\.mjs$/)
    expect(src).not.toMatch(/unpkg\.com/)
  })

  it('ensureWorker uses bundled worker by default', () => {
    ensureWorker()
    expect(GlobalWorkerOptions.workerSrc).toMatch(/pdf\.worker\.min\.mjs$/)
    expect(GlobalWorkerOptions.workerSrc).not.toMatch(/unpkg\.com/)
  })

  it('setWorkerSrc wins over ensureWorker', () => {
    setWorkerSrc('/override.mjs')
    ensureWorker()
    expect(GlobalWorkerOptions.workerSrc).toBe('/override.mjs')
  })

  it('ensureWorker is idempotent once configured', () => {
    setWorkerSrc('/first.mjs')
    ensureWorker()
    setWorkerSrc('/second.mjs')
    // already configured flag is true; ensureWorker no-ops, but setWorkerSrc updates.
    expect(GlobalWorkerOptions.workerSrc).toBe('/second.mjs')
  })
})
