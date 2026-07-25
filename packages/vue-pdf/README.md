# @daguanren21/vue-pdf

Community-maintained **Vue 2.7** PDF viewer component.

Based on the original **[vue-pdf](https://github.com/FranckFreiburger/vue-pdf)** by **Franck Freiburger**.  
This package is an **ESM rebuild** for modern bundlers. It is **not** the official `vue-pdf` release, and **not** the unscoped `vue2-pdf` package already on npm.

## Install

```bash
pnpm add @daguanren21/vue-pdf
pnpm add vue@^2.7
```

## Usage

```ts
import pdf, { createLoadingTask } from '@daguanren21/vue-pdf'
import '@daguanren21/vue-pdf/style.css'
```

```vue
<template>
  <pdf :src="src" :page="page" @num-pages="numPages = $event" />
</template>
```

### Loading task

```ts
import pdf from '@daguanren21/vue-pdf'
import CMapReaderFactory from '@daguanren21/vue-pdf/src/CMapReaderFactory.js'

const src = pdf.createLoadingTask({
  url: 'https://example.com/file.pdf',
  CMapReaderFactory,
})
```

### Worker

Zero-config by default (`pdf.worker.min.mjs` via `import.meta.url`).

```ts
import { setWorkerSrc } from '@daguanren21/vue-pdf'
setWorkerSrc('/static/pdf.worker.min.mjs')
```

## Credits

- Original: [Franck Freiburger / vue-pdf](https://github.com/FranckFreiburger/vue-pdf)
- Resize helper: published as [`@daguanren21/vue-resize-sensor`](https://www.npmjs.com/package/@daguanren21/vue-resize-sensor)
- Engine: [pdf.js](https://github.com/mozilla/pdf.js)

## License

MIT
