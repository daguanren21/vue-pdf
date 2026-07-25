import { describe, expect, it, vi } from 'vitest'
import CMapReaderFactory, { getDefaultCMapOptions } from '../src/CMapReaderFactory'

describe('CMapReaderFactory', () => {
  it('rejects when cMapUrl is missing', async () => {
    const factory = CMapReaderFactory()
    await expect(factory.fetch({ name: 'GBpc-EUC-H' })).rejects.toThrow(/no cMapUrl/i)
  })

  it('fetches packed cmaps from configured url', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4])
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes.buffer,
    })
    vi.stubGlobal('fetch', fetchMock)

    const factory = CMapReaderFactory({ cMapUrl: '/pdfjs/cmaps/' })
    const result = await factory.fetch({ name: 'GBpc-EUC-H' })

    expect(fetchMock).toHaveBeenCalledWith('/pdfjs/cmaps/GBpc-EUC-H.bcmap')
    expect(result.compressionType).toBe(1)
    expect(result.cMapData).toBeInstanceOf(Uint8Array)

    vi.unstubAllGlobals()
  })

  it('getDefaultCMapOptions returns empty without url', () => {
    expect(getDefaultCMapOptions()).toEqual({})
  })

  it('getDefaultCMapOptions returns packed options with url', () => {
    expect(getDefaultCMapOptions('/cmaps/')).toEqual({
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    })
  })
})
