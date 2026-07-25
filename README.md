# @daguanren21/vue-pdf

Community-maintained **Vue 2.7** PDF viewer, rebuilt as modern **ESM** for Vite / webpack.

> **This is not the official `vue-pdf` package, and not the existing unscoped `vue2-pdf` package on npm.**  
> Original work by **[Franck Freiburger](https://www.franck-freiburger.com)** — please credit the original author.

## Origins & attribution

| Piece | Upstream | Notes |
| --- | --- | --- |
| PDF component idea & API | [FranckFreiburger/vue-pdf](https://github.com/FranckFreiburger/vue-pdf) | Original Vue 2 PDF viewer (`createLoadingTask`, page/rotate props, events) |
| Resize detector | [FranckFreiburger/vue-resize-sensor](https://github.com/FranckFreiburger/vue-resize-sensor) | Original resize sensor, re-packaged here as ESM |
| PDF engine | [mozilla/pdf.js](https://github.com/mozilla/pdf.js) via `pdfjs-dist` | Rendering / workers / annotations |

This repository is a **community ESM rebuild** for current toolchains:

- drops `worker-loader` / `raw-loader` / Babel 6 era packaging
- ships a local `pdf.worker.min.mjs` (no CDN default)
- targets **Vue 2.7** + modern bundlers (Vite, webpack 5 / vue-cli)

The original design, component API, and much of the behavior belong to Franck Freiburger.  
This fork only modernizes packaging and dependencies so projects like onsite Vue 2 apps can keep using the same mental model.

## Why scoped names?

| Name | Status |
| --- | --- |
| `vue-pdf` | Original package (Franck) — do not take over |
| `vue2-pdf` | Already occupied on npm by another author |
| **`@daguanren21/vue-pdf`** | This community ESM rebuild |

## Packages

| Package | Path | Description |
| --- | --- | --- |
| [`@daguanren21/vue-pdf`](./packages/vue-pdf) | `packages/vue-pdf` | PDF viewer component + `createLoadingTask` |
| [`@daguanren21/vue-resize-sensor`](./packages/vue-resize-sensor) | `packages/vue-resize-sensor` | Resize detector (ESM packaging of upstream sensor) |
| `@daguanren21/vue-pdf-playground` | `apps/playground` | Local Vue 2.7 smoke-test app (private) |

## Requirements

- Node `>= 20.19` (CI uses Node 24)
- pnpm `>= 10` (repo pinned to `pnpm@10.34.5` via `packageManager`)

## Install

```bash
pnpm add @daguanren21/vue-pdf
# peer
pnpm add vue@^2.7
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

Worker is **zero-config**. The package ships `pdf.worker.min.mjs` next to the ESM entry and resolves it with `import.meta.url` (same origin, no CDN).

### onsite-compatible loading task

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

For CJK PDFs, prefer modern pdf.js options when possible:

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
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install
pnpm playground
```

Open `http://localhost:5173`.

## Build / typecheck / test

```bash
pnpm build
pnpm typecheck
pnpm test
```

## Changesets & release

This monorepo uses [changesets](https://github.com/changesets/changesets).

```bash
# 1) after a meaningful change
pnpm changeset

# 2) version packages + changelogs
pnpm version-packages

# 3) build + publish
pnpm release
```

### First local publish (bootstrap)

```bash
npm login   # as daguanren21
pnpm install
pnpm build
pnpm version-packages
pnpm exec changeset publish
```

### CI publish (OIDC — no `NPM_TOKEN`)

- **CI** (`.github/workflows/ci.yml`): typecheck / test / build
- **Release** (`.github/workflows/release.yml`): Version PR or publish via **npm Trusted Publishing (OIDC)**

After the first local publish, configure Trusted Publisher on npmjs.com for each package:

1. Package → **Settings** → **Trusted Publisher**
2. Provider: **GitHub Actions**
3. Repository: `daguanren21/vue-pdf`
4. Workflow: `release.yml`

## Migration from `vue-pdf@4`

| Old | New |
| --- | --- |
| `vue-pdf` | `@daguanren21/vue-pdf` |
| `worker-loader!pdfjs-dist/...` | removed (auto local worker) |
| `vue-pdf/src/CMapReaderFactory.js` | `@daguanren21/vue-pdf/src/CMapReaderFactory.js` |
| webpack loaders | ESM + `import '@daguanren21/vue-pdf/style.css'` |

API kept: `src` / `page` / `rotate`, `createLoadingTask`, events (`num-pages`, `page-loaded`, `progress`, `error`, `password`, `link-clicked`).

## Credits

- **Franck Freiburger** — original [`vue-pdf`](https://github.com/FranckFreiburger/vue-pdf) and [`vue-resize-sensor`](https://github.com/FranckFreiburger/vue-resize-sensor)
- **Mozilla PDF.js** contributors — rendering engine
- **daguanren21** — community ESM rebuild packaging, Vue 2.7 tooling, tests, CI

## License

MIT — see [LICENSE](./LICENSE).  
Original copyright remains with Franck Freiburger; fork maintainers hold copyright only on subsequent packaging changes.
