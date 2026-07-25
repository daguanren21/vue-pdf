/**
 * Compatibility shim for legacy:
 *   import CMapReaderFactory from '@daguanren21/vue-pdf/src/CMapReaderFactory.js'
 *   createLoadingTask({ url, CMapReaderFactory })
 *
 * pdf.js 4+ prefers cMapUrl + cMapPacked. For Chinese/CJK PDFs, pass
 * cMapUrl yourself pointing at a served cmaps directory, e.g.:
 *   { cMapUrl: '/pdfjs/cmaps/', cMapPacked: true }
 *
 * This factory is only used when callers still pass CMapReaderFactory.
 * It does NOT depend on unpkg/CDN.
 */

export default function CMapReaderFactory(options: { cMapUrl?: string } = {}) {
  // Default empty means "caller must host cmaps" for CJK. ASCII PDFs usually
  // do not need CMaps. Prefer explicit cMapUrl from app config.
  const cMapUrl = options.cMapUrl ?? ''

  return {
    fetch(query: { name: string }) {
      if (!cMapUrl) {
        return Promise.reject(
          new Error(
            `CMap "${query.name}" requested but no cMapUrl configured. ` +
            `Pass cMapUrl in createLoadingTask({ url, cMapUrl: '/pdfjs/cmaps/', cMapPacked: true }).`,
          ),
        )
      }

      return fetch(`${cMapUrl}${query.name}.bcmap`)
        .then((res) => {
          if (!res.ok)
            throw new Error(`Failed to load CMap ${query.name}: ${res.status}`)
          return res.arrayBuffer()
        })
        .then(buffer => ({
          cMapData: new Uint8Array(buffer),
          compressionType: 1,
        }))
    },
  }
}

/**
 * Modern pdfjs options. Leave cMapUrl unset unless the PDF needs CJK fonts.
 * Host cmaps from pdfjs-dist/cmaps yourself when needed.
 */
export function getDefaultCMapOptions(cMapUrl?: string) {
  if (!cMapUrl)
    return {}

  return {
    cMapUrl,
    cMapPacked: true,
  }
}
