# Backend Migration: Nestar to Travelling

## Status

The repository has completed a naming-only migration from **Nestar** to **Travelling**. It has not yet completed the proposed conversion from a real-estate platform into a travel-tour marketplace.

## Original project summary

Nestar was an npm-managed NestJS monorepo with two applications:

- `apps/nestar-api`: NestJS 10 code-first GraphQL API backed by MongoDB/Mongoose.
- `apps/nestar-batch`: scheduled property and agent ranking jobs.

Its domain covers members, properties, agents, likes/favorites, views, follows, comments, board articles, uploads, WebSocket chat, and admin moderation.

## New project summary

Travelling retains the same runtime architecture and business behavior:

- `apps/travelling-api`: renamed API application.
- `apps/travelling-batch`: renamed scheduled-job application.
- Root npm package: `travelling`.
- Nest project keys: `travelling-api` and `travelling-batch`.

No Next.js frontend or shared workspace package exists as of October 4, 2026.

## Backend migration goal

The completed goal was to remove visible Nestar project branding without changing behavior. The proposed next goal is to add travel-tour marketplace capabilities alongside legacy contracts until consumers migrate.

## Naming changes

| Area | Before | Current |
| --- | --- | --- |
| Root package | `nestar` | `travelling` |
| API app | `apps/nestar-api` / `nestar-api` | `apps/travelling-api` / `travelling-api` |
| Batch app | `apps/nestar-batch` / `nestar-batch` | `apps/travelling-batch` / `travelling-batch` |
| API output | `dist/apps/nestar-api` | `dist/apps/travelling-api` |
| Batch output | `dist/apps/nestar-batch` | `dist/apps/travelling-batch` |
| API greeting | `Nestar API is running!` | `Travelling API is running!` |
| Batch greeting | `Welcome to Nestar BATCH Server!` | `Welcome to Travelling BATCH Server!` |

Cross-app imports, start scripts, e2e paths, TypeScript output paths, and test descriptions follow the renamed directories. The obsolete test reference `NestarBatchModule` now uses the production `BatchModule`.

## Module changes

The branding refactor did not change module behavior.

| Module | Current responsibility | Proposed travel reuse |
| --- | --- | --- |
| Auth | bcrypt, JWT, required/optional/role guards | Reuse after security hardening |
| Member | accounts, profiles, USER/AGENT/ADMIN, counters | Present AGENT as Operator, then migrate safely |
| Property | CRUD, search, owner/admin flows | Keep legacy; add separate Tour module |
| Like/View | favorites and unique visits | Generalize for Tour target groups |
| Follow | follower/following relationships | Reuse for operators |
| Comment | member/property/article comments | Extend to tour comments/reviews |
| Board article | community content and moderation | Reuse for guides/news |
| Upload | authenticated local image uploads | Reuse after path/content hardening |
| WebSocket | in-memory guest/member chat | Optional reuse after auth review |
| Batch | property/agent ranks | Later calculate tour/operator ranks |

Notice and notification schemas exist but lack complete service/resolver modules.

## GraphQL changes

### Completed

None. Queries, mutations, object/input types, enums, fields, and `/graphql` remain unchanged.

### Proposed

Add `Tour`, `Departure`, and `Booking` contracts alongside Property operations. Deprecate Property contracts only after the frontend uses Tour APIs; remove them only in an approved breaking release.

## MongoDB collection and schema changes

### Completed

None. Existing model and collection names remain unchanged, including `members`, `properties`, `likes`, `views`, `follows`, `comments`, `boardArticles`, `notices`, and `notifications`. No documents were rewritten or deleted.

### Proposed

Create new collections for tours, departures, and bookings. Do not reinterpret `properties` documents as tours. Add target group to generic like/view unique indexes when Tour support is introduced.

## Compatibility notes

- Existing GraphQL, REST, uploads, WebSocket, port, environment-variable, schema, and collection contracts remain stable.
- Deployment automation must use the renamed app and output paths.
- Regenerate `dist/`; do not migrate generated output manually.
- Run Property and Tour APIs in parallel until frontend usage confirms cutover safety.

## Known baseline failures

- `npm run build`: three `Comment`/`CharacterData` mismatches and three nullable WebSocket member errors.
- Typecheck: the same errors plus API e2e Supertest typing and batch e2e Supertest import errors.
- ESLint: cannot load the uninstalled `typescript-eslint` meta-package.
- Unit tests: no matching specifications.
- API e2e: Jest/CommonJS cannot parse ESM-only `uuid@14`.

The rename introduced no additional build or path-resolution diagnostics.
