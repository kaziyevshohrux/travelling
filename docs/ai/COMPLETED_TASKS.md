# Completed Tasks

## Product Backend Cutover

Completed on October 5, 2026:

- Replaced the legacy catalog module, resolver, service, DTOs, enums, and Mongoose schema with product equivalents.
- Added the approved six product enums, non-negative float pricing, `KRW` defaulting, booking and price units, flexible JSON details, product indexes, and product-only filters/sorts.
- Enforced agent ownership through existing guards and preserved all member role values.
- Added terminal logical deletion, one-time owner counter decrement, and deleted-only physical admin removal.
- Renamed `memberProperties` to `memberProducts`.
- Rewired likes, views, comments, notifications, favorites, and visited lookups to `PRODUCT` and `products`.
- Made like/view checks and database indexes group-aware.
- Updated batch model registration, jobs, status checks, product ranking fields, and agent ranking counters.
- Added a dry-run-first, rerun-protected archive migration with destination checks, per-phase counts, verified archive copies, member counter reset, index cutover, and timestamped collection names.
- Updated `AGENTS.md` and the AI handoff documentation.

## Focused Tests

Added coverage for:

- Exact enum values
- Product input validation and JSON object validation
- Mongoose defaults, price constraints, product collection mapping, notification reference, and shared group indexes
- Currency defaulting, ownership counters, terminal deletion, non-terminal status updates, filters, favorites, and visits
- Generated GraphQL product names with no legacy catalog contract
- Migration dry run, destination enforcement, and rerun protection
- Product and agent batch ranking formulas

## Validation Status

| Check | Result |
| --- | --- |
| Focused product migration suites | Passed |
| `npx tsc -p apps/travelling-batch/tsconfig.app.json --noEmit` | Passed |
| Standalone migration TypeScript compile | Passed |
| `npx tsc -p apps/travelling-api/tsconfig.app.json --noEmit` | Product migration is clean; six unrelated pre-existing comment/socket errors remain |
| `npm run build` | Blocked by the same six unrelated pre-existing comment/socket errors |
| Auto-fixing lint | Not run, by instruction |

The unresolved baseline consists of three `CharacterData`/comment return-type errors in `comment.resolver.ts` and three nullable member errors in `socket.gateway.ts`.
## Travelling Frontend Product Migration

Completed on October 6, 2026:

- Restored the deleted Pages Router application shell and preserved the existing Next.js, MUI, SCSS, Apollo, upload, authentication, community, and chat architecture.
- Migrated all active catalog contracts and flows from Property to the product-only backend schema.
- Added listing/provider terminology, product filters and forms, owner status handling, deleted-only admin removal, canonical routes, and permanent compatibility redirects.
- Rebranded the app and rebuilt English, Korean, and Russian locale resources as UTF-8.
- Removed unreferenced legacy Property types and real-estate assets after active-reference audits.
- Corrected `FRONTEND_MIGRATION.md` so it no longer recommends an obsolete compatibility adapter.

### Frontend Validation

- `yarn install --frozen-lockfile --force --non-interactive`: passed (peer-dependency warnings only).
- `yarn tsc --noEmit --incremental false`: passed.
- `yarn build`: passed; 73 static pages generated and canonical routes emitted.
- Live product GraphQL query on port 3007: passed; the current catalog returned no records.
- Authenticated create/edit/status/delete, interactions, uploads, and admin browser smoke tests are pending suitable test credentials and seed data and are tracked in `FRONTEND_UI_DEBT.md`.

## Travel-specific Product Search

Completed on October 7, 2026:

- Extended `ProductsInquiry.search` with location, single type, multiple categories, UTC dates, adults, child ages, and HOTEL-only rooms while retaining all earlier filters.
- Added multiple product categories, separate family suitability, maximum guest suitability, optional child-age restrictions, and minimal dated room/seat inventory evidence.
- Required every HOTEL night or a matching TOUR/ACTIVITY/TRANSFER session/service entry for dated results; browsing without dates remains unchanged.
- Added the preferred `TRANSFER`, `WELLNESS`, and `CITY_EXPLORATION` enum values without silently rewriting compatibility values.
- Added focused validation, category, availability, GraphQL contract, and pagination-total coverage.
- Did not run a data migration or alter Member, auth, Follow, Like, Comment, Article, or booking/payment behavior.

### Travel Search Validation

- Full Jest suite: passed, 8 suites and 26 tests.
- `npx tsc -p apps/travelling-batch/tsconfig.app.json --noEmit`: passed.
- `npx tsc -p apps/travelling-api/tsconfig.app.json --noEmit`: no Product errors; still blocked by the six documented Comment/Socket baseline errors.
- `npm run build`: still blocked by the same six documented Comment/Socket baseline errors.
- Auto-fixing lint: not run, by repository instruction.

## AGENT Product Management Frontend

Completed on October 8, 2026:

- Reworked the private AGENT catalogue into a responsive Product dashboard with supported status filters, sorting, pagination, owner actions, and real loading, empty, error, and retry states.
- Replaced the legacy addProperty presentation with Add travel offer and Edit travel offer flows while retaining `propertyId` route compatibility.
- Added backend-aligned Product categories, family and guest policies, child-age limits, type-specific JSON details, image preservation/removal, and HOTEL/TOUR/ACTIVITY/TRANSFER availability editing.
- Kept Product creation/update separate from availability persistence and added an explicit retry path when the second mutation fails, preventing duplicate Product creation.
- Preserved AGENT authorization, owner-scoped GraphQL operations, Apollo integration, configured upload endpoints, and public-profile published-only cards.
- Removed the mobile My Page and My Menu placeholders and added responsive desktop, tablet, and mobile layouts with keyboard focus and reduced-motion support.

### AGENT Frontend Validation

- `yarn tsc --noEmit --incremental false`: passed.
- `yarn build`: passed; 73 static pages generated.
- `yarn lint`: blocked because the repository has no ESLint configuration and `next lint` opens the interactive setup prompt; no configuration was created.
- `git diff --check`: passed (line-ending conversion warnings only).
- Browser automation: unavailable in the current session because no browser provider was exposed.
- Authenticated create/edit/status/delete, upload, and availability mutations were not submitted against live data because no test credentials or authorized demo-data creation were provided.

## Product API Audit, Availability, and Quotes

Completed on October 7, 2026:

- Audited every Product GraphQL operation, aggregation, shared Product reference, ownership boundary, public visibility rule, and batch statistic; recorded the impact map in `PRODUCT_API_AUDIT.md`.
- Added owner-scoped `updateProductAvailability` and public `getProductPriceQuote` operations.
- Added declared room/seat capacity, slot ends, blocked inventory, duplicate prevention, and complete-document validation for create/owner update/admin update/type changes.
- Kept configured inventory distinct from guest suitability and documented the absence of booking-backed balances.
- Applied ACTIVE visibility before favorites/visited pagination and totals, and made ADMIN category filtering understand both category representations.
- Preserved existing Member roles, `memberId` ownership, Product operation names, auth guards, shared groups, and batch rank formulas.

### Audit Implementation Validation

- Full Jest suite: passed, 9 suites and 33 tests.
- Focused Product/related suites: passed, 4 suites and 22 tests.
- `npx tsc -p apps/travelling-batch/tsconfig.app.json --noEmit`: passed.
- `npx tsc -p apps/travelling-api/tsconfig.app.json --noEmit`: no Product/availability/quote errors; blocked only by the same six documented Comment/Socket baseline errors.
- `npm run build`: blocked only by the same six documented Comment/Socket baseline errors.
- `git diff --check`: passed.
- Auto-fixing lint: not run, by repository instruction.

## Follow and Current-profile API Audit

Completed on October 8, 2026:

- Audited the actual Follow and Member GraphQL operations, DTOs, schemas, aggregations, counters, interaction lookups, ADMIN boundaries, and the accessible `travelling-next` consumers; recorded the impact map in `FOLLOW_PROFILE_API_AUDIT.md`.
- Corrected follower/following join direction, moved eligible-member filtering before pagination/counting, added deterministic `_id` tie-break sorting, and retained set-based authenticated-viewer state.
- Added query indexes while retaining the existing unique follow-pair index, self-follow prevention, and conditional unfollow behavior.
- Made follow creation/deletion and both denormalized member counter updates transactional, with non-negative decrements.
- Added safe authenticated `getMyProfile`, tightened the existing `updateMember` operation to a self-service allowlist, and added current-password-verified `changeMyPassword`.
- Updated `MyMenu`, `MyProfile`, frontend GraphQL documents, and TypeScript types without creating a separate menu API.
- Did not run a database migration, index synchronization, duplicate cleanup, or counter rewrite.

### Follow/Profile Validation

- Full Jest suite: passed, 12 suites and 47 tests.
- Focused Follow/Profile suites: passed, 3 suites and 14 tests.
- Frontend `yarn tsc --noEmit`: passed.
- Frontend `yarn build`: passed.
- `npx tsc -p apps/travelling-batch/tsconfig.app.json --noEmit`: passed.
- `npx tsc -p apps/travelling-api/tsconfig.app.json --noEmit`: changed code is clean; blocked only by the six documented Comment/Socket baseline errors.
- `npm run build`: blocked only by those same six unrelated baseline errors.
- Auto-fixing lint: not run, by repository instruction.
