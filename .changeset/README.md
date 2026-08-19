# Changesets

1. `pnpm changeset` — describe package changes (`@daguanren21/vue-pdf` / `@daguanren21/vue-resize-sensor`)
2. Merge the feature PR (with `.changeset/*.md`) to `master`
3. CI **Release** consumes those changeset files and opens a **Version Packages** PR
4. Merge the version PR → packages publish via **OIDC Trusted Publishing**

Requires Node `^22.11 || ^24 || >=26` (Changesets v3).

## Auth model

| Where | Auth |
| --- | --- |
| GitHub Actions `release.yml` | **OIDC only** (`id-token: write` on the publish job). No `NPM_TOKEN`. |
| First-time local bootstrap | `npm login` / local publish once |

Trusted Publisher on npmjs.com for each package:

- Repository: `daguanren21/vue-pdf`
- Workflow: `release.yml`

Repo setting required for the version PR: **Actions → General → Allow GitHub Actions to create and approve pull requests**.
