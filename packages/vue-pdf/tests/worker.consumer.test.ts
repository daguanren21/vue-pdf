// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { build } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const fixtureRoot = fileURLToPath(new URL('./fixtures/vite-consumer', import.meta.url))

interface AssetOutput {
  type: 'asset'
  fileName: string
  source: string | Uint8Array
}

interface ChunkOutput {
  type: 'chunk'
  fileName: string
  code: string
  isEntry: boolean
}

function collectOutput(result: unknown): unknown[] {
  if (Array.isArray(result))
    return result.flatMap(collectOutput)
  if (result !== null && typeof result === 'object' && 'output' in result && Array.isArray(result.output))
    return result.output
  throw new Error('Expected a completed Vite build result.')
}

function isOutputAsset(value: unknown): value is AssetOutput {
  return value !== null
    && typeof value === 'object'
    && 'type' in value
    && value.type === 'asset'
    && 'fileName' in value
    && typeof value.fileName === 'string'
    && 'source' in value
    && (typeof value.source === 'string' || value.source instanceof Uint8Array)
}

function isOutputChunk(value: unknown): value is ChunkOutput {
  return value !== null
    && typeof value === 'object'
    && 'type' in value
    && value.type === 'chunk'
    && 'fileName' in value
    && typeof value.fileName === 'string'
    && 'code' in value
    && typeof value.code === 'string'
    && 'isEntry' in value
    && typeof value.isEntry === 'boolean'
}

describe('Vite package consumer', () => {
  it('emits the bundled PDF worker and references the emitted asset', async () => {
    const result = await build({
      configFile: false,
      root: fixtureRoot,
      logLevel: 'silent',
      build: {
        write: false,
        rollupOptions: {
          external: [
            'vue',
            '@daguanren21/vue-resize-sensor',
            /^pdfjs-dist(?:\/|$)/,
          ],
        },
      },
    })
    const output = collectOutput(result)
    const worker = output.find(
      (item): item is AssetOutput => isOutputAsset(item) && /pdf\.worker\.min-.*\.mjs$/.test(item.fileName),
    )
    const entry = output.find(
      (item): item is ChunkOutput => isOutputChunk(item) && item.isEntry,
    )

    expect(worker).toBeDefined()
    expect(Buffer.from(worker?.source ?? '').toString('utf8')).toContain('WorkerMessageHandler')
    expect(entry?.code).toContain(worker?.fileName)
  }, 30_000)
})
