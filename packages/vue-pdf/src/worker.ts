import { GlobalWorkerOptions } from 'pdfjs-dist'

let configured = false

/**
 * Optional override for self-hosted / CSP setups.
 * Normal consumers do NOT need to call this — the package ships the worker
 * next to the ESM build and resolves it via import.meta.url.
 */
export function setWorkerSrc(workerSrc: string): void {
  GlobalWorkerOptions.workerSrc = workerSrc
  configured = true
}

/**
 * Resolve the worker that is published beside this module:
 *   dist/vue-pdf.js
 *   dist/pdf.worker.min.mjs
 *
 * No CDN. Works offline as long as the package files are served together.
 */
export function resolveBundledWorkerSrc(): string {
  // Worker is copied into dist/ at build time; leave URL resolution to runtime.
  return new URL(/* @vite-ignore */ './pdf.worker.min.mjs', import.meta.url).href
}

export function ensureWorker(): void {
  if (configured || typeof window === 'undefined')
    return

  if (GlobalWorkerOptions.workerSrc) {
    configured = true
    return
  }

  GlobalWorkerOptions.workerSrc = resolveBundledWorkerSrc()
  configured = true
}

/** Test-only helper to reset module state between cases. */
export function __resetWorkerForTests(): void {
  configured = false
  GlobalWorkerOptions.workerSrc = ''
}

// Zero-config: configure as soon as the module loads in the browser.
if (typeof window !== 'undefined')
  ensureWorker()
