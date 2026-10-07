# Travelling Backend Migration

## Current State

Travelling is a NestJS GraphQL monorepo with `travelling-api` and `travelling-batch`. The main catalog is now the `Product` domain. The previous real-estate catalog API is not retained as an alias.

Members remain `USER`, `AGENT`, or `ADMIN`. Product creation and owner updates require `MemberType.AGENT`.

## Product Contract

The product-only GraphQL surface contains `Product`, `Products`, `ProductInput`, `ProductUpdate`, `ProductsInquiry`, `AllProductsInquiry`, and `AgentProductsInquiry`.

Public operations are:

- `createProduct`, `getProduct`, `updateProduct`, `getProducts`, `getAgentProducts`, and `likeTargetProduct`
- `getFavorites` and `getVisited`, both returning `Products`
- `getAllProductsByAdmin`, `updateProductByAdmin`, and `removeProductByAdmin`

The product enums are:

- `ProductType`: `HOTEL`, `TOUR`, `ACTIVITY`, `TRANSFER`, plus compatibility values `TRANSPORT`, `RESTAURANT`
- `ProductCategory`: `ADVENTURE`, `CULTURE`, `FOOD`, `NATURE`, `WELLNESS`, `CITY_EXPLORATION`, plus compatibility values `RELAXATION`, `FAMILY`
- `ProductStatus`: `ACTIVE`, `INACTIVE`, `SOLD_OUT`, `DELETE`
- `ProductRegion`: `SEOUL`, `BUSAN`, `JEJU`, `INCHEON`, `DAEGU`, `OTHER`
- `ProductBookingType`: `INSTANT`, `REQUEST`
- `ProductPriceUnit`: `PER_PERSON`, `PER_NIGHT`, `PER_BOOKING`

`productPrice` is a non-negative GraphQL `Float`. `productCurrency` defaults to `KRW`. `productDetails` is an optional JSON object backed by Mongoose `Mixed`. `productCategories` supports multiple categories while the original required `productCategory` remains readable and searchable. `productFamilyFriendly` is independent from category.

## Travel Product Search

`ProductsInquiry.search` retains the existing list, price, creation-period, text, pagination, and sorting fields and adds `productLocation`, `productType`, `productCategories`, `startDate`, `endDate`, `adults`, `childrenAges`, and HOTEL-only `rooms`.

- `productLocation` is a search-only string matched case-insensitively against `productAddress`; a canonical region name also matches `productRegion`. It is not persisted as a second location field.
- `childrenAges.length` is the children count. Adults, child ages, rooms, paired dates, date order, price order, and positive integer pagination are validated before aggregation.
- `productMaxGuests` proves party-size suitability. Optional `productMinChildAge` and `productMaxChildAge` restrict only products that define them.
- Date/time values are ISO-8601 instants interpreted in UTC. HOTEL inventory dates are UTC-midnight calendar nights; check-in is inclusive and check-out exclusive. TOUR, ACTIVITY, and TRANSFER entries are UTC session/service instants searched in `[startDate, endDate)`.
- HOTEL results require a `productAvailability` entry with enough `remainingRooms` for every requested night. TOUR/ACTIVITY/TRANSFER results require one dated entry in the interval with enough `remainingSeats`. Products without this evidence are not returned by dated searches. Browsing without dates remains available.
- `productPrice` remains a base listing price in its declared `productPriceUnit`; search does not calculate a stay or party total.

The embedded availability array is intentionally incremental. There is no Booking domain, atomic inventory decrement, hold, payment, or oversell protection yet; providers/admins must maintain the snapshots. Consumers must not treat a search response as a reservation.

`updateProductAvailability` lets an AGENT replace availability only on their own Product. Entries support declared room/seat capacity, configured remaining inventory, time-slot end, and blocking. `getProductPriceQuote` returns an availability-checked base-price breakdown using the stored currency and price unit; it is not a reservation. The full operation impact map and migration plan are in `docs/ai/PRODUCT_API_AUDIT.md`.

## Enum and Data Compatibility

No automatic data migration is included. If a later reviewed migration is approved:

- `TRANSPORT` may become `TRANSFER` only for point-to-point transfer services; general transport records are ambiguous.
- `RESTAURANT` has no lossless target ProductType; `FOOD` is a category, not an automatic type replacement.
- `RELAXATION` may become `WELLNESS` only when the product meaning matches.
- `FAMILY` should become `productFamilyFriendly: true` plus one or more thematic categories; the thematic category requires review.
- legacy scalar `productCategory` can be copied into `productCategories` as a one-item array, but the service already searches both representations.

## Persistence and Shared Domains

- Mongoose model: `Product`
- Live collection: `products`
- Ownership counter: `members.memberProducts`
- Shared target group: `PRODUCT` for likes, views, comments, and notifications
- Optional notification reference: `productId` referencing `Product`
- Favorites and visits resolve through `products` as `favoriteProduct` and `visitedProduct`
- Like/view uniqueness includes member, reference, and group
- Batch jobs rank active products and agents using the preserved formulas

`ACTIVE`, `INACTIVE`, and `SOLD_OUT` may transition among one another. `DELETE` is terminal, records `deletedAt`, and decrements `memberProducts` once. Physical admin removal is limited to logically deleted products.

## Data Cutover

Run `npm run migrate:property-to-product` for a read-only dry run. Use `npm run migrate:property-to-product -- --apply` only after a database backup and count review.

Apply mode:

1. Requires `products` to be absent or empty and creates a rerun marker.
2. Archives legacy catalog-targeted likes, views, comments, and notifications with verified counts.
3. Replaces legacy shared uniqueness indexes with group-aware indexes.
4. Archives old member catalog counters, removes the old field, and initializes `memberProducts` to zero.
5. Atomically renames the old catalog collection to a timestamped legacy archive.

Legacy real-estate records are not converted into products.

## Known Unrelated Baseline

The API typecheck and root build still report six pre-existing errors in the comment resolver and socket gateway. Product migration code introduces no additional TypeScript errors. The batch app and standalone migration compile successfully.
