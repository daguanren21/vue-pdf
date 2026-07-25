# Changesets

1. `pnpm changeset` — describe package changes (`@daguanren21/vue-pdf` / `@daguanren21/vue-resize-sensor`)
2. Merge to `master`
3. CI **Release** workflow opens a **Version Packages** PR
4. Merge the version PR → packages publish via **OIDC Trusted Publishing**

## Auth model

| Where | Auth |
| --- | --- |
| GitHub Actions `release.yml` | **OIDC only** (`id-token: write`). No `NPM_TOKEN`. |
| First-time local bootstrap | `npm login` / local publish once |

Trusted Publisher on npmjs.com for each package:

- Repository: `daguanren21/vue-pdf`
- Workflow: `release.yml`
