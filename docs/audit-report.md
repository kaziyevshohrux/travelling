# Travelling Backend and Frontend Audit Report

Audit date: October 6, 2026

## Scope and evidence

Read-only audit of `travelling-api`, `travelling-batch`, GraphQL DTOs/resolvers, Mongoose schemas, enums, migration scripts, and tests. This report is the only authorized write.

No frontend, generated client operations, i18n resources, or seed-data tree exists in this repository, so frontend requests and UI copy could not be verified. `MemberType.AGENT` and accepted names such as `getAgentProducts` are retained by contract, not accidental Property leftovers.

No live application field named property, sqm, rooms, beds, rent, sale, or buy was found. Property references are limited to the historical archive migration and negative contract tests.

Validation:

- API TypeScript: failed with three Comment/CharacterData errors and three socket nullability errors.
- Batch TypeScript: passed.
- Focused Product suites: 4 passed, 10 tests passed.
- Read-only ESLint: blocked because `typescript-eslint` is not installed.

## Member

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/libs/dto/member/member.input.ts:25` | Signup accepts `memberType`; callers can request AGENT or ADMIN and the service persists it. | High | Remove the field and force USER; use an admin-only promotion flow. |
| `apps/travelling-api/src/libs/dto/member/member.update.ts:13` | Self-service and admin share a DTO, allowing members to change role/status. Password updates are also stored without hashing. | High | Split DTOs and add a verified, hashed password-change flow. |
| `apps/travelling-api/src/libs/dto/member/member.ts:22` | Phone is exposed by public member/agent/follow/owner GraphQL results. | Med | Use public/private projections or field authorization. |
| `apps/travelling-api/src/components/member/member.service.ts:164` | Agent sort always becomes descending because both numeric Direction values are truthy. | Med | Use `input.direction ?? Direction.DESC` directly and test ASC/DESC. |
| `apps/travelling-api/src/libs/dto/member/member.input.ts:75` | `AgentInquiry.search` is nullable in GraphQL but required and destructured by the service. | Med | Make it non-null or default it safely. |
| `apps/travelling-api/src/components/member/member.service.ts:231` | Dynamic counters allow arbitrary keys/negative values and can drift after partial failures. | Med | Restrict keys and transact or reconcile counter changes. |
| `apps/travelling-api/src/schemas/Member.model.ts:9` | Agent/member directory filters and sorts lack compound indexes. | Low | Add query-plan-backed type/status/sort indexes. |
| `apps/travelling-api/src/components/member/member.resolver.ts:86` | Agent wording remains public. It is accepted technically but is UI terminology debt. | Low | Keep the enum/API for compatibility; display Host/Local Guide contextually. |

## Product / Trip

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/libs/dto/product/product.input.ts:16` | INSTANT/REQUEST booking is exposed without check-in/out, travel dates, availability, capacity, inventory, booking operations, or booking state. | High | Define an approved availability/booking domain before presenting products as bookable. |
| `apps/travelling-api/src/components/product/product.service.ts:139` | `periodsRange` filters record `createdAt`, not travel/availability dates. | High | Rename it as creation-date filtering or add explicit travel dates later. |
| `apps/travelling-api/src/components/product/product.service.ts:35` | Product create/delete and `memberProducts` changes are separate writes; partial failures drift counters. | High | Use transactions or idempotent reconciliation. |
| `apps/travelling-api/src/components/product/product.service.ts:241` | Physical removal leaves likes, views, comments, and notifications orphaned. | Med | Define transactional cascade/archive behavior or retain filtered tombstones. |
| `apps/travelling-api/src/libs/dto/product/product.input.ts:75` | Price/date ranges do not enforce start <= end; dates lack validity/business checks. | Med | Add cross-field validators and boundary tests. |
| `apps/travelling-api/src/libs/dto/product/product.input.ts:40` | Money uses Float/number, risking rounding; currency accepts any three uppercase letters. | Med | Use integer minor units/decimal and validate supported currencies. |
| `apps/travelling-api/src/components/product/product.service.ts:140` | Raw regex search and uncapped page limits permit expensive requests. | Med | Escape/index search and cap limits. |
| `apps/travelling-api/src/components/product/product.service.ts:118` | Owner unwind can drop rows after totals are counted, so list and metadata can disagree. | Med | Apply owner rules before both facets or preserve null owners. |
| `apps/travelling-api/src/schemas/Product.model.ts:36` | Existing indexes do not support price range/sort or title search well. | Low | Add indexes based on measured query plans. |
| `apps/travelling-api/src/libs/dto/product/product.input.ts:57` | Images may be an empty array and are not validated as approved asset URLs. | Low | Require appropriate cardinality and normalized upload paths. |

Approved listing transitions are coherent: ACTIVE, INACTIVE, and SOLD_OUT can interoperate; DELETE is terminal. There is no BOOKED status because there is no booking lifecycle.


## Board Article

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/components/board-article/board-article.service.ts:30` | Article writes and member counters are not transactional. | Med | Transact or reconcile counters. |
| `apps/travelling-api/src/components/board-article/board-article.service.ts:226` | Physical deletion leaves likes, views, and comments. | Med | Define shared-target cleanup/tombstone behavior. |
| `apps/travelling-api/src/components/board-article/board-article.service.ts:105` | Raw regex search, uncapped pagination, and no supporting search/list index. | Med | Escape/index search, cap limits, and add measured indexes. |
| `apps/travelling-api/src/components/board-article/board-article.service.ts:120` | Owner unwind can make list totals disagree. | Med | Use identical filtering for list and count. |
| `apps/travelling-api/src/components/board-article/board-article.resolver.ts:15` | Unused Comment and Mongoose Schema imports are dead code. | Low | Remove after lint is restored. |

No real-estate wording was found; the model can serve travel community posts.

## Comment

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/components/comment/comment.service.ts:20` | The project Comment DTO is not imported; TypeScript resolves the DOM Comment type and compilation fails. | High | Import the DTO explicitly. |
| `apps/travelling-api/src/libs/dto/comment/comment.ts:13` | A stray identifier creates an unintended required TypeScript field. | High | Remove it and add compile/schema regression coverage. |
| `apps/travelling-api/src/components/comment/comment.resolver.ts:56` | Admin removal declares `Comments` but returns one `Comment`. | High | Change the GraphQL return decorator and test the generated schema. |
| `apps/travelling-api/src/components/comment/comment.service.ts:84` | Queries omit `commentGroup`; matching ObjectIds across domains can mix comments. | High | Require group and match/index group + ref + status + createdAt. |
| `apps/travelling-api/src/components/comment/comment.service.ts:26` | Insert occurs before target validation; counter failure leaves an orphan comment. | High | Validate the target and transact insert/counter increment. |
| `apps/travelling-api/src/components/comment/comment.service.ts:65` | Logical/admin deletion never decrements target comment counters. | High | Centralize terminal deletion and decrement exactly once. |
| `apps/travelling-api/src/schemas/Comment.model.ts:4` | No index supports the actual list query. | Med | Add the group/ref/status/date compound index. |

No real-estate wording was found.

## Like

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/components/like/like.service.ts:16` | Read-then-create/delete toggle races; concurrent unlikes can decrement counters twice. | High | Use an atomic/idempotent toggle and transactional or derived counts. |
| `apps/travelling-api/src/components/like/like.service.ts:42` | Favorites return inactive, sold-out, and deleted products without a visibility rule. | Med | Filter explicitly and decide sold-out visibility. |
| `apps/travelling-api/src/schemas/Like.model.ts:26` | Unique index is group-aware but not ordered for member/group/recent pagination. | Med | Retain it and add `{ memberId, likeGroup, updatedAt: -1 }`. |
| `apps/travelling-api/src/components/like/like.service.ts:48` | Orphan likes are silently dropped rather than cleaned. | Low | Cascade/archive or reconcile orphans. |

## View

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/components/view/view.service.ts:16` | Check-then-create races can surface duplicate-key errors during reads. | Med | Use atomic upsert and increment only on insertion. |
| `apps/travelling-api/src/components/view/view.service.ts:26` | Visited results include inactive/deleted products. | Med | Filter by allowed visibility statuses. |
| `apps/travelling-api/src/components/view/view.service.ts:30` | Repeats do not update time, so “visited” is first-view order, not recent history. | Med | Separate unique counting from last-viewed tracking. |
| `apps/travelling-api/src/schemas/View.model.ts:26` | No efficient member/group/recent-history index. | Med | Add `{ memberId, viewGroup, updatedAt: -1 }`. |
| `apps/travelling-api/src/components/view/view.resolver.ts:3` | Empty resolver and unused member-enum imports are dead code. | Low | Remove or implement a documented direct View API. |


## Follow

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/components/follow/follow.service.ts:26` | Follow record and two counters are three writes; partial failures drift counts. | High | Use a transaction or derived/reconciled counts. |
| `apps/travelling-api/src/components/follow/follow.service.ts:23` | Blocked targets can be followed and list lookups do not filter blocked/deleted profiles. | Med | Define and enforce active-profile visibility. |
| `apps/travelling-api/src/schemas/Follow.model.ts:18` | Index does not efficiently serve both list directions sorted by time. | Med | Add follower/date and following/date indexes. |
| `apps/travelling-api/src/components/follow/follow.resolver.ts:34` | Anonymous queries pass null into non-null service/lookup signatures. | Low | Type optional auth explicitly and define anonymous flags. |
| `apps/travelling-api/src/libs/dto/follow/follow.input.ts:17` | Pagination has no maximum limit. | Low | Apply the shared cap. |

## Notice

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/schemas/Notice.model.ts:4` | Notice has only schema/enums; it is not module-registered and has no DTO, service, resolver, permissions, or usable API. | Med | Implement an admin/public Notice module or formally retire the dead schema. |
| `apps/travelling-api/src/libs/enums/notice.enum.ts:3` | GraphQL enums are registered without any reachable operation. | Low | Register only with an implemented contract. |
| `apps/travelling-api/src/schemas/Notice.model.ts:4` | No active/category/date index exists. | Low | Add it when the module is implemented. |

## Auth

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/components/auth/auth.module.ts:8` | Missing SECRET_TOKEN becomes the literal secret “undefined”. | High | Validate configuration at startup and fail closed. |
| `apps/travelling-api/src/components/auth/auth.service.ts:20` | JWT copies nearly the full member document for 30 days; roles/status become stale. | High | Use minimal short-lived claims plus refresh/session version and current-state checks. |
| `apps/travelling-api/src/components/auth/auth.service.ts:29` | Token payloads and GraphQL bodies/responses are logged, exposing credentials and PII. | High | Remove payload logs and add structured redaction. |
| `apps/travelling-api/src/main.ts:13` | Credentialed CORS accepts any origin. | High | Use an environment-specific allowlist. |
| `apps/travelling-api/src/components/auth/guards/roles.guard.ts:38` | Privileged access trusts only stale JWT role claims. | High | Validate current status/role or a token version. |
| `apps/travelling-api/src/components/auth/guards/auth.guard.ts:22` | Bearer format is not validated and verification failures are not normalized. | Med | Parse defensively and return consistent unauthorized errors. |

## Upload

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/components/member/member.resolver.ts:141` | Client-controlled target is inserted into a filesystem path, enabling traversal. | High | Use a server-side target enum/map and verify the resolved path stays under one root. |
| `apps/travelling-api/src/components/member/member.resolver.ts:149` | Validation trusts declared MIME and preserves the supplied extension without inspecting bytes. | High | Inspect content/signature, normalize extension, and validate dimensions. |
| `apps/travelling-api/src/components/member/member.resolver.ts:169` | Multi-upload swallows failures and returns sparse partial success. | Med | Return structured failures or fail atomically with cleanup. |
| `apps/travelling-api/src/main.ts:15` | Limits allow 50 MB × 10 while the comment says 10 MB, creating disk/CPU abuse risk. | Med | Set documented limits and quotas. |
| `apps/travelling-api/src/components/member/member.resolver.ts:153` | Approved directories are not ensured and failed workflows have no cleanup. | Med | Pre-create only approved roots and add lifecycle cleanup. |
| `apps/travelling-api/src/main.ts:16` | Entire upload root is publicly served without ownership/content policy. | Med | Serve constrained assets with safe headers/CDN policy. |


## Frontend and GraphQL compatibility

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/` | No frontend exists here; actual queries, UI wording, i18n, and nullability assumptions cannot be audited. | Med | Audit the real frontend repository against the generated Product schema. |
| `apps/travelling-api/src/components/comment/comment.resolver.ts:56` | Confirmed Comment return mismatch would generate an incorrect client contract. | High | Fix and snapshot the full generated schema. |
| `apps/travelling-api/src/libs/dto/member/member.input.ts:75` | GraphQL nullability conflicts with runtime requirements. | Med | Align schema, DTO, validation, and defaults. |
| `apps/travelling-api/src/schemas/Notice.model.ts:4` | Persistence exists without a client-accessible contract. | Med | Implement or retire Notice. |

## Batch and cross-cutting

| File | Problem | Severity (High/Med/Low) | Suggested fix |
| --- | --- | --- | --- |
| `apps/travelling-api/src/socket/socket.gateway.ts:59` | Guests are allowed but payload types require Member, causing three compile errors; URL tokens are logged. | High | Make member nullable, move auth out of URLs, and never log tokens. |
| `apps/travelling-batch/src/batch.service.ts:37` | Ranking loads all records and performs one update each, allowing poor scaling/partial batches. | Med | Use bounded bulk writes and idempotent progress metrics. |
| `apps/travelling-batch/src/lib/config.ts:3` | Job value is misspelled `BBATCH_TOP_AGENTS`. | Low | Correct the value without renaming the accepted role. |
| `eslint.config.mjs` | Lint cannot load because `typescript-eslint` is missing. | Med | Install/configure it and add a non-fixing lint command. |

## Prioritized fix list

1. Block signup/update privilege escalation, hash password changes, and check current account role/status.
2. Restore compilation and the GraphQL contract: fix Comment typing/schema and socket nullability; snapshot the full schema.
3. Secure JWT configuration, claims, logs, PII exposure, and CORS.
4. Prevent upload traversal/content spoofing and define limits/cleanup.
5. Make likes, follows, comments, views, and denormalized counters atomic/idempotent; add concurrency tests.
6. Isolate comments by group, validate targets, index queries, and decrement counters exactly once.
7. Decide the booking boundary before advertising real availability, capacity, or instant/request booking behavior.
8. Correct Product date/range/search/pagination/visibility semantics.
9. Add query-plan-backed indexes for catalog, community, comment, social, and member lists.
10. Implement or retire Notice/Notification dead code, then audit the actual frontend and regenerate its Product-only operations.
