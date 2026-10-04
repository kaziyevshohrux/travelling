# Architecture Decisions

## Status key

- **Completed**: reflected in the repository.
- **Proposed**: agreed migration direction, not implemented.

## Decision record

| Status | Decision | Why | Risk | Alternative |
| --- | --- | --- | --- | --- |
| Completed | Rename project identifiers without domain changes | Isolates branding work from marketplace risk | Old deployment paths may break | Combined brand/domain rename; rejected as hard to diagnose |
| Completed | Rename app directories and Nest project keys | Keeps source, build, and CLI names consistent | Git may display delete/add before rename detection | Keep old paths; rejected because Nestar remains visible |
| Completed | Preserve APIs, environment keys, schemas, and collections | Maintains consumer and data compatibility | Property terminology remains technical debt | Immediate breaking rename; rejected without a frontend cutover |
| Completed | Preserve unrelated user dependency changes | Avoids overwriting user-owned work | Unrelated dependency stays present | Remove it; rejected as outside scope |
| Proposed | Add a separate `Tour` collection | Tours require itinerary, dates, capacity, currency, and availability | Parallel domains add temporary complexity | Reuse `Property`; rejected as semantically unsafe |
| Proposed | Separate `Departure` and `Booking` domains | Supports atomic capacity and booking lifecycles | More transactional coordination | Embed them in Tour; rejected due to growth/concurrency |
| Proposed | Create `apps/travelling-web` with Next.js App Router | No frontend exists; SSR suits catalog/detail pages | Adds deployment/tooling scope | Pages Router or external repo; not selected |
| Proposed | Run Property and Tour GraphQL APIs in parallel | Enables incremental cutover and rollback | Longer dual-contract maintenance | Hard cutover; rejected without verified consumers |
| Proposed | Defer live payments/refunds/payouts | Establish booking invariants before financial operations | First release cannot charge customers | Full payments in v1; rejected as coupled risk |
| Proposed | Fix authorization before marketplace features | Signup/profile inputs expose role-related fields | Delays feature work | Tours first; rejected because it expands exposure |
| Proposed | Use compact JWT claims and current-status checks | Current 30-day member snapshots can become stale | More reads/token-version logic | Trust full JWT snapshots; rejected for security |
| Proposed | Generalize social targets by group | Reuses likes, views, and comments | Requires indexes and counter reconciliation | Tour-specific social stores; rejected as duplication |
| Proposed | Use Operator in UI before changing stored `AGENT` | Improves terminology without breaking persisted roles | Temporary UI/backend mismatch | Rename enum immediately; rejected due to token/data impact |

## Compatibility policy

1. Additive contracts precede removals.
2. Branding work never renames persisted collections.
3. Breaking GraphQL changes require consumer inventory and deprecation.
4. Data migrations require rollback instructions and before/after counts.
5. Documentation must identify completed versus proposed work.

## Outstanding risks

- Self-service role/status fields must be restricted.
- Denormalized counters can drift without transactions.
- Like/view unique indexes omit target group.
- Upload paths use a client-controlled segment and declared MIME type.
- WebSocket tokens use query strings and are logged.
- Build, lint, unit, and e2e baselines are not green.
- Frontend architecture remains conceptual until source or designs are supplied.
