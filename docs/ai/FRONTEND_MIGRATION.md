# Frontend Migration: Nestar to Travelling

## Current Contract

The backend catalog is product-only. The frontend must call `Product` GraphQL types and operations directly; no `Property` aliases or Property-to-Product adapter layer exists.

Customer-facing terminology is **Listings** and **Providers**. Backend member contracts intentionally retain `MemberType.AGENT`, `getAgents`, `AgentInquiry`, and `AgentProductsInquiry`.

## Implemented Frontend State

Completed on October 6, 2026:

- Restored the Pages Router shell, public assets, and SCSS organization from the revision before `e7bd016`.
- Added the backend's exact product enums, inputs, updates, inquiries, range types, and response models.
- Replaced property GraphQL operations and selections with product-native operations and `productId` arguments.
- Migrated catalog, detail, favorites, visited, owner, provider, and administration flows to products.
- Changed member counters and shared interaction groups to `memberProducts` and `PRODUCT`.
- Preserved Apollo upload/auth/cache/error behavior and kept raw chat WebSocket traffic separate from Apollo HTTP traffic.
- Added canonical `/products`, `/providers`, and `/_admin/products` routes with permanent legacy redirects.
- Added legacy My Page category and `propertyId` normalization only at compatibility boundaries.
- Rebranded metadata, navigation, footer, copy, wordmark, favicon, README, and locale resources to Travelling.
- Removed the inactive Property type layer and unreferenced real-estate-only assets after reference checks.

## Runtime Configuration

```env
REACT_APP_API_URL=http://localhost:3007
REACT_APP_API_GRAPHQL_URL=http://localhost:3007/graphql
REACT_APP_CHAT_WS_URL=ws://localhost:3007
```

The chat URL is for the existing raw WebSocket client. The backend does not expose GraphQL subscriptions, so Apollo uses HTTP/upload links only.

## Compatibility Boundaries

- `/property/:path*` permanently redirects to `/products/:path*`.
- `/agent/:path*` permanently redirects to `/providers/:path*`.
- `/_admin/properties/:path*` permanently redirects to `/_admin/products/:path*`.
- My Page accepts `addProperty` and `myProperties`, then normalizes them to `addProduct` and `myProducts`.
- Listing edit links temporarily accept `propertyId`, then normalize it to `productId`.

Do not reintroduce Property GraphQL documents, adapters, legacy catalog fields, or GraphQL subscription splitting.

## Validation

- `yarn tsc --noEmit --incremental false`: passed.
- `yarn build`: passed; all canonical product/provider/admin pages were generated.
- Live `getProducts` smoke query against `http://localhost:3007/graphql`: passed with the product-only selection set.
- Authenticated mutation and role-based UI smoke tests remain dependent on test accounts and seeded product data; see `FRONTEND_UI_DEBT.md`.
