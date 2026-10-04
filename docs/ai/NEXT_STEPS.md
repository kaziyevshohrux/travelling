# Next Steps

## Deployment

1. Back up the target MongoDB database.
2. Run `npm run migrate:property-to-product` and review every reported count.
3. Run `npm run migrate:property-to-product -- --apply` once.
4. Confirm the timestamped archives, zeroed `memberProducts`, group-aware shared indexes, and empty `products` collection.
5. Deploy the backend.
6. Run GraphQL smoke tests for product creation, listing, detail, status changes, likes, favorites, visits, comments, notifications, and admin deletion.

## Client Cutover

Update frontend documents and generated types to the product-only GraphQL contract. There are no compatibility aliases for the retired catalog operations.

## Separate Cleanup

- Fix the three pre-existing comment resolver type errors.
- Fix the three pre-existing socket member-nullability errors.
- Re-run API typecheck and `npm run build` after that cleanup.
- Handle broad lint/style cleanup separately; do not mix it into the product migration.
