declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'pdfjs-dist/web/pdf_viewer.mjs' {
  export class PDFLinkService {
    externalLinkEnabled: boolean
    constructor(options?: {
      eventBus?: unknown
      externalLinkTarget?: number
      externalLinkRel?: string
      ignoreDestinationZoom?: boolean
    })
    setDocument(pdfDocument: unknown, baseUrl?: string | null): void
    setViewer(viewer: unknown): void
    setHistory(pdfHistory: unknown): void
    get pagesCount(): number
    get page(): number
    set page(value: number)
    get rotation(): number
    set rotation(value: number)
    get isInPresentationMode(): boolean
    goToDestination(dest: string | unknown[]): Promise<void>
    goToPage(val: number | string): void
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void
    getDestinationHash(dest: string | unknown[]): string
    getAnchorUrl(hash: string): string
    setHash(hash: string): void
    executeNamedAction(action: string): void
    executeSetOCGState(action: unknown): void
  }

  export class SimpleLinkService {
    constructor()
  }
}
