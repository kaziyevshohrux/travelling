# Next Steps

Tasks are listed for Tuesday, May 12, 2026, in priority order.

## Backend Cleanup

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Stage the folder rename cleanly in git and confirm Git recognizes `apps/nestar-*` to `apps/travelling-*` as renames. | Keep review diff readable. |
| 2 | Re-run branding sweep after staging. | Confirm no unintended Nestar labels remain in tracked files. |
| 3 | Update README and deploy instructions to describe travelling app names, scripts, Docker services, and local ports. | Align developer docs with renamed backend. |
| 4 | Decide whether to convert absolute `apps/travelling-api/...` imports to relative or tsconfig alias imports. | Reduce future app-folder rename friction. |
| 5 | Plan lint baseline cleanup separately from migration work. | Avoid mixing style churn with migration diffs. |
| 6 | Decide when to migrate real-estate domain concepts such as `Property`, `Agent`, rooms, beds, square, rent, barter, and constructed date. | Prepare for actual petshop domain conversion. |

## Frontend Migration

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Locate and inspect the Next.js frontend repository. | Identify routes, GraphQL client, generated types, and branding surfaces. |
| 2 | Replace visible Nestar branding with travelling in layout, metadata, navigation, auth pages, footer, and empty/error states. | Align UI identity with backend identity. |
| 3 | Add product terminology adapters around existing `Property` GraphQL data. | Let the UI say "product" without backend API changes. |
| 4 | Map property listing pages to product/catalog pages and agent pages to seller/vendor pages. | Establish petshop UX direction. |
| 5 | Keep existing GraphQL operation documents compatible with backend in Phase 1. | Avoid breaking client/server integration. |
| 6 | Inventory real-estate UI fields that should be hidden or replaced. | Prepare for future product schema work. |

## Testing

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Re-run `npx tsc -p apps/travelling-api/tsconfig.app.json --noEmit`. | Confirm API app remains type-safe. |
| 2 | Re-run `npx tsc -p apps/travelling-batch/tsconfig.app.json --noEmit`. | Confirm batch app remains type-safe. |
| 3 | Re-run `npm run build`. | Confirm renamed Nest project config still builds. |
| 4 | Run API smoke tests against GraphQL playground or a local client. | Confirm runtime behavior after rename. |
| 5 | Test Docker Compose service names and startup commands. | Confirm deployment labels work outside local Node execution. |
| 6 | Create a separate lint cleanup branch or task. | Address existing 68 lint errors without polluting migration diff. |

## Documentation

| Priority | Task | Purpose |
| --- | --- | --- |
| 1 | Keep these `docs/` files updated after frontend migration starts. | Preserve a single migration record. |
| 2 | Add README sections for travelling setup, scripts, Docker services, and validation commands. | Improve onboarding. |
| 3 | Add a GraphQL compatibility matrix once frontend queries are inspected. | Track old backend names and new UI aliases. |
| 4 | Create a future backend domain migration plan for `Property` to `Product`. | Prepare for breaking API/data work. |
| 5 | Record final architectural decisions after product catalog scope is chosen. | Avoid rediscovering tradeoffs later. |
