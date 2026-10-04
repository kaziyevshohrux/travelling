# Frontend Migration Plan: Nestar to Travelling

## Goal

Migrate the Next.js frontend identity and UI terminology to travelling while remaining compatible with the current backend GraphQL API. The backend still exposes real-estate-oriented `Property` and `Agent` APIs, so the frontend should use adapters and UI copy first, then plan backend API renames later.

## Step-by-Step Plan

| Step | Task | Outcome |
| --- | --- | --- |
| 1 | Locate the Next.js frontend repository and confirm its package manager, app router/pages router structure, GraphQL client, and environment files. | Clear migration surface before edits. |
| 2 | Rename visible app branding from Nestar to travelling in metadata, navigation, layout, footer, auth screens, errors, and empty states. | User-facing identity becomes travelling. |
| 3 | Update assets and static files: logo, favicon, manifest, Open Graph metadata, app icons, and any Nestar images. | Browser and share previews use travelling branding. |
| 4 | Add a frontend terminology adapter layer that maps travelling UI concepts to current backend GraphQL fields. | UI can say "product" while GraphQL still sends/receives `Property`. |
| 5 | Rename page titles, component labels, filter labels, and CTA text from real-estate terminology to petshop terminology. | Product experience starts to feel like a petshop. |
| 6 | Keep current GraphQL documents operational and avoid backend-breaking query changes during Phase 1. | Existing backend remains compatible. |
| 7 | Add tests or smoke checks for critical pages: home/catalog, detail page, seller profile, favorites, visited items, auth, upload flow. | Catch copy/adaptor regressions. |
| 8 | Document all frontend aliases so future backend `Property` to `Product` migration can be mechanical. | Reduces future migration confusion. |

## Page and Component Mapping

| Nestar Frontend Concept | travelling UI Concept | Backend Compatibility Notes |
| --- | --- | --- |
| Home/real-estate landing | travelling storefront or catalog entry | Can still query featured `Property` records. |
| Property list page | Product/catalog list page | UI label changes; data source remains `getProperties`. |
| Property detail page | Product detail/listing detail page | UI label changes; data source remains `getProperty`. |
| Create property page | Create product/listing page | UI label changes; mutation remains `createProperty`. |
| My properties | My products/listings | Query remains `getAgentProperties`. |
| Agent profile/list | Seller/vendor profile/list | Query remains `getAgents`; role remains `MemberType.AGENT`. |
| Favorites | Favorites or wishlist | Query remains `getFavorites`; backend returns `Properties`. |
| Visited properties | Recently viewed products | Query remains `getVisited`. |
| Board/community | Community/articles | Behavior can remain unchanged. |
| Comments/likes/views | Reviews/comments, likes, views | Keep current backend behavior until product review model is defined. |

## GraphQL Query and Mutation Rename Plan

### Phase 1: Compatibility First

Do not rename GraphQL operation documents against the backend yet. Use frontend aliases or mapper names.

| Backend Operation | Frontend Alias | Status |
| --- | --- | --- |
| `getProperties` | `getProducts` or `getCatalogItems` | Frontend alias only. |
| `getProperty` | `getProduct` or `getListing` | Frontend alias only. |
| `createProperty` | `createProductListing` | Frontend alias only. |
| `updateProperty` | `updateProductListing` | Frontend alias only. |
| `getAgentProperties` | `getSellerProducts` | Frontend alias only. |
| `likeTargetProperty` | `likeTargetProduct` | Frontend alias only. |
| `getAgents` | `getSellers` | Frontend alias only. |

### Phase 2: Frontend Adapter Layer

Create frontend model mappers without changing backend calls:

| Backend Field | Frontend Model Field |
| --- | --- |
| `propertyTitle` | `productTitle` or `name` |
| `propertyPrice` | `price` |
| `propertyImages` | `images` |
| `propertyDesc` | `description` |
| `propertyLikes` | `likes` |
| `propertyViews` | `views` |
| `propertyComments` | `comments` |
| `memberData` | `seller` |

Fields such as `propertySquare`, `propertyBeds`, `propertyRooms`, `propertyRent`, `propertyBarter`, and `constructedAt` should be hidden or clearly marked for future backend domain cleanup because they do not map cleanly to petshop catalog behavior.

### Phase 3: Backend API Rename Later

Only after backend approval, introduce product-native GraphQL types and operations:

| Current Backend Name | Future Candidate |
| --- | --- |
| `Property` | `Product` or `ProductListing` |
| `Properties` | `Products` |
| `PropertyInput` | `ProductInput` |
| `PropertyUpdate` | `ProductUpdate` |
| `PropertyType` | `ProductCategory` |
| `PropertyStatus` | `ProductStatus` |
| `PropertyLocation` | `ShippingRegion` or remove if not needed |
| `AgentPropertiesInquiry` | `SellerProductsInquiry` |

## UI Terminology Changes

| Current Term | travelling Term | Notes |
| --- | --- | --- |
| Nestar | travelling | Brand rename complete on backend; frontend should match. |
| Property | Product or listing | Prefer "product" for catalog UI, "listing" for seller workflows. |
| Properties | Catalog or products | Use "catalog" for browse pages. |
| Agent | Seller or vendor | Prefer "seller" for customer-facing UI. |
| Property type | Category | Future backend mapping needed. |
| Property location | Region or shipping area | Avoid if not needed in petshop UI. |
| Beds/rooms/square | Remove or replace with product specs | No clean petshop equivalent. |
| Rent/barter | Availability, sale type, or remove | Needs product decision. |
| Constructed at | Listed at, manufactured at, or remove | Needs domain decision. |
| Sold | Sold out or unavailable | Future product status mapping. |

## Compatibility Rules

- Do not change backend GraphQL documents in a way that requires backend schema changes during the frontend Phase 1 migration.
- Prefer frontend aliases, mapper functions, and UI copy changes.
- Keep a migration glossary near GraphQL documents so future backend renames are traceable.
- Treat any real `Property` to `Product` backend rename as a separate breaking-change project.
