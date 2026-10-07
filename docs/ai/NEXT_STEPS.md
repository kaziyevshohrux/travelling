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
