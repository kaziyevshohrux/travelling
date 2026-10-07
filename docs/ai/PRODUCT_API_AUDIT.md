# Product API Impact Audit

Audited on October 7, 2026 against the repository source. This document covers the Product GraphQL surface, persistence, aggregations, shared references, and batch statistics. No frontend source exists in this workspace; only frontend handoff documents are present.

## GraphQL Operation Impact Map

| Operation | Access and current behavior | Implemented or required change | Compatibility impact | Verification |
| --- | --- | --- | --- | --- |
| `createProduct` | `AGENT`; assigns authenticated `memberId`, creates Product, increments `memberProducts`. | Uses the complete Product validator, initializes `productCategories`, and validates type-specific availability. | Existing inputs without availability remain valid. Invalid mixed room/seat data is rejected. | Service and GraphQL contract tests. |
| `getProduct` | Public with optional auth; returns only `ACTIVE`, records one grouped view per member, returns `meLiked` and owner `memberData`. | Travel restrictions and managed availability are exposed through the Product type. Interaction behavior is unchanged. | Additive output fields only. | GraphQL/schema tests; existing view/like paths audited. |
| `getProductPriceQuote` | New public query. | Checks dates, guests, age restrictions, room rules, and published inventory; calculates only configured base price/unit. | New additive operation. It does not reserve inventory. | Quote accuracy, blocked inventory, and GraphQL tests. |
| `updateProduct` | `AGENT`; Mongo filter restricts update to own non-deleted Product; `DELETE` is terminal and decrements owner count once. | Reads the owned record, merges the patch, validates the resulting complete document, then writes. Type changes with incompatible inventory are rejected without deleting fields. | Valid earlier patches remain valid. Invalid legacy availability must be repaired before changing type/availability. | Ownership, status, type-change, and availability tests. |
| `updateProductAvailability` | New `AGENT` mutation. | Replaces only the authenticated owner's availability after duplicate, interval, capacity, block, and type validation. | New additive operation; existing `updateProduct` remains available. | Ownership and availability validation tests. |
| `getProducts` | Public with optional auth; only `ACTIVE`; supports sorting and a `$facet` whose list is paged while meta count is calculated from the full matched set. | Uses travel location/type/category/date/guest/HOTEL-room filters; blocked entries cannot prove availability. | Old filters remain accepted. Dated/guest searches exclude records without explicit suitability/inventory evidence. | Search validation, every-night inventory, category, and pagination-total tests. |
| `getFavorites` | Authenticated; resolves grouped Product likes through `products`, pages after lookup. | Now filters looked-up Products to `ACTIVE` before facet/count. | Inactive/deleted favorites no longer appear publicly or count toward total. Like rows are retained. | Related lookup test and schema reference test. |
| `getVisited` | Authenticated; resolves grouped Product views through `products`, pages after lookup. | Now filters looked-up Products to `ACTIVE` before facet/count. | Inactive/deleted history no longer appears publicly or counts toward total. View rows are retained. | Related lookup test and schema reference test. |
| `getAgentProducts` | `AGENT`; lists only authenticated owner's Products; defaults to all non-deleted statuses and rejects an explicit `DELETE` query. | Applies the same positive-integer pagination validation; returns the expanded Product travel fields. | Existing behavior and operation name preserved. | Pagination and ownership service coverage; GraphQL contract generation. |
| `likeTargetProduct` | Authenticated; only an `ACTIVE` Product may be toggled; group-aware like uniqueness; adjusts `productLikes`. | No behavioral change required. | Fully compatible. | Shared schema/index and Product service tests. |
| `getAllProductsByAdmin` | `ADMIN`; may list every status and filter/sort/page with owner lookup. | Category filter now searches both `productCategories` and legacy `productCategory`; pagination and price order are validated. | Existing admin filters remain accepted; multi-category records are now visible to category filters. | Service filter/pagination tests and resolver audit. |
| `updateProductByAdmin` | `ADMIN`; updates any non-deleted Product and preserves terminal deletion accounting. | Uses the same complete-document/type-specific validation as owner update. | ADMIN permissions are unchanged; invalid mixed type data is rejected rather than discarded. | ADMIN unrestricted-filter and type-validation tests. |
| `removeProductByAdmin` | `ADMIN`; physically removes only a logically `DELETE` Product. | No change required. | Fully compatible. | Existing Product deletion tests/audit. |

## Persistence, Aggregation, and Shared References

- `ProductSchema` uses the `products` collection and keeps `memberId` referencing `Member`. Search indexes cover legacy/new category representations and availability date.
- Product lists sort before a `$facet`; only `list` receives `$skip/$limit`, while `metaCounter` receives `$count`, so totals represent all matched records.
- Owner lookups use the `members` collection. Optional-auth list/detail retains grouped Product like data.
- `LikeGroup.PRODUCT`, `ViewGroup.PRODUCT`, `CommentGroup.PRODUCT`, and `NotificationGroup.PRODUCT` are unchanged. Like/view unique indexes include member, reference, and group.
- Product comments use generic `createComment/getComments/updateComment/removeCommentByAdmin`. Creating a `PRODUCT` comment increments `productComments`. The generic public comment query currently filters by reference id/status but not by group; changing that shared contract was not required for availability/quote and remains a separate compatibility issue.
- `NotificationSchema.productId` references `Product`, but this repository has no Notification resolver, service, or registered module. No runtime notification operation could be changed or verified.
- Favorites and visited lookups now apply `ACTIVE` Product visibility before pagination and total count.
- Batch ranking remains `productLikes * 2 + productViews`; rollback and ranking touch only `ACTIVE` Products. Comment count is intentionally not added because the accepted migration decision preserves the formula.
- `memberProducts` remains the AGENT ownership counter: create increments it and first logical delete decrements it.

## Availability Rules

- `availabilityDate` is the HOTEL UTC-midnight night or the TOUR/ACTIVITY/TRANSFER slot start.
- `availabilityEnd` is required for newly managed TOUR/ACTIVITY/TRANSFER slots and must be later than the start. HOTEL entries cannot contain it.
- HOTEL entries use `capacityRooms` and `remainingRooms`; seat fields are rejected.
- TOUR/ACTIVITY/TRANSFER entries use `capacitySeats` and `remainingSeats`; room fields are rejected.
- `remainingRooms/remainingSeats` cannot exceed declared capacity. Exact duplicate start dates are rejected.
- `isBlocked: true` overrides publication for that entry. A blocked entry cannot advertise a positive remaining amount, and duplicate blocking/published entries for the same start are not permitted.
- Compatibility ProductTypes `TRANSPORT` and `RESTAURANT` cannot receive availability because neither has an approved lossless inventory interpretation.
- Configured remaining inventory is not a booking balance. There is no hold, booking, atomic decrement, payment, or oversell protection.

## Quote Rules

- `PER_PERSON`: configured base price multiplied by `adults + childrenAges.length`; no child discount is inferred.
- `PER_NIGHT`: supported for HOTEL and multiplied by UTC nights and requested rooms.
- `PER_BOOKING`: one configured base-price unit.
- The response currency is the Product currency. No taxes, fees, commissions, discounts, or exchange rates are added.
- The quote requires sufficient non-blocked inventory and guest suitability but does not reserve it or guarantee later availability.

## Frontend Contract Impact

Frontend source was not available to edit. Generated types/documents must add:

- `updateProductAvailability(input: ProductAvailabilityUpdateInput!): Product!`
- `getProductPriceQuote(input: ProductQuoteInput!): ProductPriceQuote!`
- availability fields `availabilityEnd`, `isBlocked`, `capacityRooms`, and `capacitySeats`
- quote output fields `currency`, `priceUnit`, `unitPrice`, `quantity`, `subtotal`, `total`, `inventoryAvailable`, `breakdown`, and `disclaimer`

Existing operation names and legacy search inputs remain unchanged.

## Migration Plan (Not Executed)

1. Back up and count Products before any write.
2. Copy a legacy scalar `productCategory` to `productCategories: [productCategory]` only where the array is absent.
3. For existing availability, set `capacityRooms` or `capacitySeats` from reviewed inventory sources. Using current remaining values as capacity is possible but must be explicitly approved because it loses original-capacity meaning.
4. Add `availabilityEnd` to TOUR/ACTIVITY/TRANSFER entries from real schedule data; do not fabricate durations.
5. Normalize HOTEL inventory keys to UTC midnight and resolve duplicates manually before enabling strict availability updates.
6. Apply enum mappings only after record review: conditional `TRANSPORT -> TRANSFER`, conditional `RELAXATION -> WELLNESS`, and `FAMILY -> productFamilyFriendly` plus a reviewed thematic category. `RESTAURANT` has no automatic ProductType mapping.
7. Build the new indexes in a reviewed deployment window; no index or data migration is run by this implementation.
