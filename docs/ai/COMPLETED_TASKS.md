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
