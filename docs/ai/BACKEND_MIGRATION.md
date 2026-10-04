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

The six product enums are:

- `ProductType`: `HOTEL`, `TOUR`, `ACTIVITY`, `TRANSPORT`, `RESTAURANT`
- `ProductCategory`: `ADVENTURE`, `CULTURE`, `FOOD`, `NATURE`, `RELAXATION`, `FAMILY`
- `ProductStatus`: `ACTIVE`, `INACTIVE`, `SOLD_OUT`, `DELETE`
- `ProductRegion`: `SEOUL`, `BUSAN`, `JEJU`, `INCHEON`, `DAEGU`, `OTHER`
- `ProductBookingType`: `INSTANT`, `REQUEST`
- `ProductPriceUnit`: `PER_PERSON`, `PER_NIGHT`, `PER_BOOKING`

`productPrice` is a non-negative GraphQL `Float`. `productCurrency` defaults to `KRW`. `productDetails` is an optional JSON object backed by Mongoose `Mixed`.

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
