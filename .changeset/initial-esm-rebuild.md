---
"@daguanren21/vue-pdf": major
"@daguanren21/vue-resize-sensor": minor
---

Community ESM rebuild of Franck Freiburger's vue-pdf / vue-resize-sensor for Vue 2.7.

- Publish under scoped names (`@daguanren21/vue-pdf`, `@daguanren21/vue-resize-sensor`) because unscoped `vue2-pdf` is already taken on npm
- Drop webpack `worker-loader` / `raw-loader`; ship local `pdf.worker.min.mjs` via `import.meta.url` (no CDN default)
- Target modern ESM builds with Vite library mode, TypeScript types, vitest coverage, and pnpm + changesets monorepo packaging
- Keep the classic component API (`createLoadingTask`, `src` / `page` / `rotate`, existing events) for migration from vue-pdf@4
