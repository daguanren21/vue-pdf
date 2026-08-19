# @daguanren21/vue-pdf

## 5.0.1

### Patch Changes

- 0af21b8: Fix Vite consumer builds so the bundled PDF.js worker is emitted as a production asset instead of resolving to a missing SPA fallback URL. Add a consumer-build regression test that verifies the application bundle references the emitted worker.
