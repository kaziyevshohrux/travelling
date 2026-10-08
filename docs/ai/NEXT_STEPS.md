# Next Steps

## Deployment

1. Back up the target MongoDB database.
2. Run `npm run migrate:property-to-product` and review every reported count.
3. Run `npm run migrate:property-to-product -- --apply` once.
4. Confirm the timestamped archives, zeroed `memberProducts`, group-aware shared indexes, and empty `products` collection.
5. Deploy the backend.
6. Run GraphQL smoke tests for product creation, listing, detail, status changes, likes, favorites, visits, comments, notifications, and admin deletion.

## Client Cutover

Regenerate frontend GraphQL types for the additive travel-search fields and enum values. Send ISO-8601 UTC dates, derive child count from `childrenAges`, send `rooms` only with HOTEL, and continue displaying `productPrice` as a base price/unit rather than a calculated trip total. Existing searches remain valid when all new filters are omitted.

## Availability Evolution

1. Introduce a separate booking/hold boundary with atomic seat/room decrements and idempotency before accepting reservations.
2. Decide whether non-transfer transport and restaurant products receive new target types before migrating compatibility enum values.
3. Add explicit taxes, fees, discounts, child pricing, and cancellation rules only after business approval; the current quote intentionally excludes them.

## Separate Cleanup

- Fix the three pre-existing comment resolver type errors.
- Fix the three pre-existing socket member-nullability errors.
- Re-run API typecheck and `npm run build` after that cleanup.
- Handle broad lint/style cleanup separately; do not mix it into the product migration.

## Follow/Profile Deployment

1. Confirm MongoDB transaction support (replica set or sharded cluster) before deploying transactional subscribe/unsubscribe.
2. Back up the database; inspect follow-pair duplicates and dangling member references without deleting data automatically.
3. Review and create the two follow query indexes described in `FOLLOW_PROFILE_API_AUDIT.md` if production disables automatic index creation.
4. Reconcile member follow counters from the follow collection in a reviewed migration, including members whose expected count is zero.
5. Deploy the tightened `updateMember` frontend and backend contracts together, then smoke-test profile edit, password change, follow/unfollow, anonymous lists, and authenticated viewer state.
6. Consider minimizing general JWT claims in a separate authentication-focused change; current profile/menu data no longer depends on those claims.
