# Reusable Codex Prompts

These prompts summarize useful user-level requests from this session. They contain no credentials or internal instructions.

## Repository audit

```text
Audit this Travelling monorepo before changes. Inspect apps, packages, versions, package manager, NestJS/GraphQL architecture, MongoDB models, auth/authorization, admin, properties, favorites, follows, comments, articles, and validation commands. Run non-mutating checks, distinguish existing failures from migration regressions, and cite repository-relative paths. Do not modify code.
```

## Baseline repair

```text
Repair only the known baseline failures: Comment/CharacterData typing, nullable WebSocket payloads, ESLint flat-config dependencies, Supertest imports/types, empty unit-test behavior, and Jest compatibility with uuid@14. Do not change business behavior or public APIs. Reproduce first, make minimal fixes, then run build, typecheck, read-only lint, unit, API e2e, and batch e2e tests.
```

## Safe project rename

```text
Rename visible project/app identifiers from OLD_NAME to NEW_NAME. Update package metadata, directories, Nest project keys, scripts, outputs, internal filesystem imports, test labels, and health messages. Preserve GraphQL types/operations, REST routes, WebSocket behavior, environment keys, MongoDB schemas/collections, business logic, and unrelated changes. Run install, build, typecheck, read-only lint, tests, old-name search, and git diff --check.
```

## Tour domain design

```text
Inspect Property, Member, Like, View, Comment, and batch modules. Propose an additive Tour domain with Tour, Departure, and Booking boundaries. Define minimum GraphQL contracts, MongoDB documents/indexes, ownership, availability, capacity, currency, lifecycle, and counters. Do not reinterpret existing property records. Include compatibility, rollback, concurrency, and tests. Plan first.
```

## GraphQL compatibility

```text
Implement additive Tour GraphQL operations while retaining all Property operations unchanged. Keep existing consumers compatible and remove no legacy fields. Add contract tests for legacy and new schemas. Document deprecation, frontend cutover, telemetry, and removal criteria.
```

## Next.js frontend

```text
Create apps/travelling-web as a TypeScript Next.js App Router application. Use generated GraphQL types, server rendering for public catalog/detail routes, client components only for interaction, and API-enforced roles. Implement shell and authentication first. Do not invent backend operations; list missing contracts as blockers. Run build, typecheck, lint, and tests.
```

## Test expansion

```text
Add focused tests for authentication, authorization, optional auth, role boundaries, favorites, follows, comments, articles, Tour search, atomic capacity, idempotent booking, cancellation, and counter consistency. Isolate external MongoDB/payment dependencies. Preserve APIs and report coverage gaps.
```

## Security review

```text
Review the Travelling API for role escalation, JWT content/lifetime, current member-status enforcement, upload traversal/content validation, CORS, GraphQL exposure, WebSocket credentials, rate limiting, ownership checks, and sensitive logging. Cite paths and rank findings. Do not fix until asked.
```

## Migration verification

```text
Verify the migration without modifying source. Inspect git status/diff, search stale identifiers, compare GraphQL and MongoDB contracts, and run build, typecheck, read-only lint, unit, API e2e, and batch e2e. Separate pre-existing failures from regressions and identify persisted-data or public-interface changes.
```

## Prompt checklist

Always specify scope, non-goals, compatibility rules, allowed data changes, validation commands, and expected deliverables.
