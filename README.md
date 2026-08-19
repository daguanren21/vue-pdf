# @daguanren21/vue-pdf

Community-maintained **Vue 2.7** PDF viewer, rebuilt as modern **ESM** for Vite / webpack.

> **Not** the official [`vue-pdf`](https://github.com/FranckFreiburger/vue-pdf).  
> Original work by **[Franck Freiburger](https://www.franck-freiburger.com)** — please credit the original author.

## Origins

| Piece | Upstream |
| --- | --- |
| Component API / design | [FranckFreiburger/vue-pdf](https://github.com/FranckFreiburger/vue-pdf) |
| Resize detector | [FranckFreiburger/vue-resize-sensor](https://github.com/FranckFreiburger/vue-resize-sensor) |
| PDF engine | [mozilla/pdf.js](https://github.com/mozilla/pdf.js) (`pdfjs-dist`) |

This repo only modernizes packaging for current toolchains: no `worker-loader` / `raw-loader`, local `pdf.worker.min.mjs`, Vue 2.7 + Vite / webpack 5.

## Packages

| Package | Path |
| --- | --- |
| [`@daguanren21/vue-pdf`](./packages/vue-pdf) | `packages/vue-pdf` |
| [`@daguanren21/vue-resize-sensor`](./packages/vue-resize-sensor) | `packages/vue-resize-sensor` |
| `@daguanren21/vue-pdf-playground` (private) | `apps/playground` |

## Install

```bash
pnpm add @daguanren21/vue-pdf
```

```ts
import pdf, { createLoadingTask, CMapReaderFactory } from '@daguanren21/vue-pdf'
import '@daguanren21/vue-pdf/style.css'
```

```vue
<template>
  <pdf :src="src" :page="page" />
</template>
```

Worker is zero-config (`pdf.worker.min.mjs` next to the ESM entry via `import.meta.url`).

### Loading task (vue-pdf@4 compatible)

```ts
import pdf from '@daguanren21/vue-pdf'
import CMapReaderFactory from '@daguanren21/vue-pdf/src/CMapReaderFactory.js'

const src = pdf.createLoadingTask({
  url: `data:application/pdf;base64,${base64}`,
  CMapReaderFactory,
})

src.promise.then((doc) => {
  numPages = doc.numPages
})
```

CJK PDFs can pass modern pdf.js cmap options:

```ts
createLoadingTask({
  url,
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
})
```

### Optional worker override

```ts
import { setWorkerSrc } from '@daguanren21/vue-pdf'
setWorkerSrc('/static/pdf.worker.min.mjs')
```

## Develop

```bash
pnpm install
pnpm playground   # http://localhost:5173
pnpm build
pnpm typecheck
pnpm test
```

Requires Node `^22.11 || ^24 || >=26`, pnpm `>= 10` (`packageManager`: `pnpm@10.34.5`).

## Migration from `vue-pdf@4`

### Zero-code alias (recommended for onsite / legacy imports)

Keep every `import … from 'vue-pdf'` / `vue-pdf/src/CMapReaderFactory.js` unchanged.  
Only remap the dependency in the consumer package manager.

**pnpm** (`package.json`):

```json
{
  "dependencies": {
    "vue-pdf": "npm:@daguanren21/vue-pdf@^5.0.0"
  }
}
```

**pnpm overrides** (monorepo root, force all workspaces):

```json
{
  "pnpm": {
    "overrides": {
      "vue-pdf": "npm:@daguanren21/vue-pdf@^5.0.0"
    }
  }
}
```

**npm** (`package.json`):

```json
{
  "dependencies": {
    "vue-pdf": "npm:@daguanren21/vue-pdf@^5.0.0"
  },
  "overrides": {
    "vue-pdf": "npm:@daguanren21/vue-pdf@^5.0.0"
  }
}
```

**yarn** (`package.json`):

```json
{
  "dependencies": {
    "vue-pdf": "npm:@daguanren21/vue-pdf@^5.0.0"
  },
  "resolutions": {
    "vue-pdf": "npm:@daguanren21/vue-pdf@^5.0.0"
  }
}
```

Then reinstall and drop old webpack-only glue if present:

- remove `worker-loader` / `raw-loader` special-cases for `vue-pdf` / `pdfjs-dist`
- remove `patch-package` patches that only fixed `worker-loader`
- ensure the app still has Vue `^2.7` (already true for Vue projects)

Subpath imports such as `vue-pdf/src/CMapReaderFactory.js` and `vue-pdf/style.css` keep working under the alias because this package re-exports those entry points.

### Explicit import rename (optional)

| Old | New |
| --- | --- |
| `vue-pdf` | `@daguanren21/vue-pdf` |
| `worker-loader!…` | removed (auto local worker) |
| `vue-pdf/src/CMapReaderFactory.js` | `@daguanren21/vue-pdf/src/CMapReaderFactory.js` |

API kept: `src` / `page` / `rotate`, `createLoadingTask`, events (`num-pages`, `page-loaded`, `progress`, `error`, `password`, `link-clicked`).

## Credits

- **Franck Freiburger** — original [`vue-pdf`](https://github.com/FranckFreiburger/vue-pdf) and [`vue-resize-sensor`](https://github.com/FranckFreiburger/vue-resize-sensor)
- **Mozilla PDF.js** contributors
- **daguanren21** — ESM rebuild packaging / tests / CI

## License

MIT — see [LICENSE](./LICENSE).  
Original copyright remains with Franck Freiburger.
