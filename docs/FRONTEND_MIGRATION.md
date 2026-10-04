# Frontend Migration Plan

## Current state

No Next.js or React application exists in this repository. This is a **proposed implementation map** inferred from the GraphQL backend and travel-marketplace direction, not a source-verified migration of frontend code.

## Target application

Create `apps/travelling-web` as a TypeScript Next.js App Router application. Use server rendering for public catalog/detail content and client components only for authentication state, interactive filters, favorites, uploads, and checkout.

## Step-by-step plan

1. Convert the root into an npm workspace containing API, batch, and web apps without breaking Nest commands.
2. Add validated web configuration for public site and GraphQL HTTP/WebSocket URLs.
3. Generate GraphQL operation/result types from the backend schema.
4. Build the shared shell: Travelling branding, navigation, footer, errors, loading states, and responsive layout.
5. Implement authentication/session handling against existing signup/login behavior; never expose role/status fields in customer forms.
6. Build public catalog, tour detail, operator, guide, and search screens after additive Tour APIs exist.
7. Connect reusable favorites, follows, profile, articles, and comments.
8. Build operator inventory/departure screens after authorization cleanup.
9. Build booking screens after atomic capacity and booking-state APIs pass backend tests.
10. Build admin routes with API-enforced roles; frontend guards are only a usability layer.
11. Monitor legacy Property usage, then retire legacy UI paths after an approved deprecation window.

## Proposed route mapping

| Conceptual Nestar route | Travelling route | Purpose |
| --- | --- | --- |
| `/` | `/` | Featured tours, destinations, and guides |
| `/properties` | `/tours` | Tour search and filters |
| `/property/[id]` | `/tours/[slug]` | Tour detail, departures, operator, reviews, booking entry |
| `/agents` | `/operators` | Operator directory |
| `/agent/[id]` | `/operators/[id]` | Operator profile and tours |
| `/favorites` | `/account/favorites` | Saved tours |
| `/visited` | `/account/recently-viewed` | Recently viewed tours |
| `/articles` | `/guides` | Travel editorial/community content |
| `/article/[id]` | `/guides/[id]` | Guide detail and comments |
| `/mypage` | `/account/profile` | Customer profile/settings |
| Not present | `/account/bookings` | Booking history/status |
| `/agent/properties` | `/operator/tours` | Operator-owned inventory |
| Not present | `/operator/departures` | Availability, price, and capacity |
| `/admin/properties` | `/admin/tours` | Tour moderation |
| `/admin/members` | `/admin/members` | Member/operator administration |
| `/admin/articles` | `/admin/guides` | Editorial moderation |
| Not present | `/admin/bookings` | Booking oversight |

## Proposed component mapping

| Conceptual Nestar component | Travelling component | Change |
| --- | --- | --- |
| `PropertyCard` | `TourCard` | Show destination, duration, price, rating, availability |
| `PropertyFilter` | `TourSearchFilters` | Use destination, category, dates, duration, party size, price |
| `PropertyGallery` | `TourGallery` | Retain images; add itinerary/meeting context |
| `PropertyDetail` | `TourDetail` | Compose itinerary, inclusions, operator, departures, reviews, CTA |
| `AgentCard` | `OperatorCard` | Show verification, destinations, ratings, and tour count |
| `FavoriteButton` | `FavoriteTourButton` | Retain toggle behavior with Tour target group |
| `CommentList` | `ReviewList` / `CommentList` | Keep article comments; require completed booking for verified reviews |
| `AdminPropertyTable` | `AdminTourTable` | Use tour publishing/moderation lifecycle |

## GraphQL query and mutation rename plan

Legacy operations remain unchanged until Tour consumers are ready.

| Legacy operation | Proposed operation | Compatibility plan |
| --- | --- | --- |
| `getProperties` | `getTours` | Add new query; keep legacy query during cutover |
| `getProperty` | `getTour` | Add slug-aware tour lookup; keep legacy ID query |
| `createProperty` | `createTour` | Add operator-only mutation |
| `updateProperty` | `updateTour` | Preserve ownership enforcement |
| `getAgentProperties` | `getOperatorTours` | UI may say Operator while stored role remains `AGENT` |
| `getFavorites` | `getFavoriteTours` | Reuse Like persistence with Tour group |
| `getVisited` | `getRecentlyViewedTours` | Reuse View persistence with Tour group |
| `likeTargetProperty` | `toggleFavoriteTour` | Use user-facing favorite semantics |
| `getAllPropertiesByAdmin` | `getAllToursByAdmin` | Add admin query |
| `updatePropertyByAdmin` | `updateTourByAdmin` | Add admin mutation |
| `removePropertyByAdmin` | `removeTourByAdmin` | Prefer soft deletion |
| Not present | `getTourDepartures` | New availability query |
| Not present | `createBooking` | New idempotent booking mutation |
| Not present | `getMyBookings` | New customer query |

Generate frontend types from the schema; do not implement string-replacement aliases in UI code.

## UI terminology changes

| Nestar term | Travelling term | Rule |
| --- | --- | --- |
| Property | Tour | New domain, not a database rename |
| Agent | Operator | UI can change before stored-role migration |
| Property location | Destination | Replace Korea-only location assumptions |
| Property type | Tour category | Cultural, adventure, food, wellness, etc. |
| Price | From/per-person price | Always show currency and basis |
| Sold | Unavailable or completed | Depends on departure/tour lifecycle |
| Beds | Capacity/available seats | Departure-level inventory |
| Rooms | Duration/itinerary stops | Do not reuse the rooms field |
| Square area | Remove | Not applicable |
| Rent/barter | Remove | Not applicable |
| Constructed date | Tour/departure dates | Schedule-specific fields |
| Agent properties | Operator tours | Ownership remains |

## Acceptance criteria

- Public routes render without authentication and enrich optional favorite/follow state when signed in.
- Customer, operator, and admin capabilities are enforced by the API.
- Customer inputs cannot submit `memberType` or `memberStatus`.
- Filters map directly to validated GraphQL inputs.
- Booking UI handles sold-out capacity, stale availability, idempotent retry, and server price changes.
- Legacy Property UI can be removed without affecting Tour routes or generated types.
