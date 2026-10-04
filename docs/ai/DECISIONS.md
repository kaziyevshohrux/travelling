# Migration Decisions

## Accepted Decisions

| Decision | Rationale |
| --- | --- |
| Make a hard product-only GraphQL cutover. | The approved release is intentionally breaking and must not retain stale catalog aliases. |
| Keep `MemberType.USER`, `AGENT`, and `ADMIN`. | Role compatibility is required; product ownership remains with agents. |
| Use the six enums documented in `AGENTS.md`. | This makes `productRegion` canonical and excludes unapproved category values. |
| Start with an empty `products` collection. | Legacy real-estate records do not have trustworthy product equivalents. |
| Archive legacy records instead of transforming them. | Avoids fabricated product categories, booking rules, prices, and details. |
| Default currency to `KRW`. | Creation remains concise while persistence and output always have a currency. |
| Keep `productDetails` flexible. | Product-type-specific nested validation is deferred; the current contract still requires an object. |
| Make `DELETE` terminal. | Owner counters can be decremented exactly once and physical removal remains controlled. |
| Include the target group in like/view uniqueness. | Identical ObjectIds in different target domains must not collide. |
| Preserve batch schedules and rank formulas. | The domain rename should not change existing ranking behavior. |
| Do not run the auto-fixing lint script. | It would rewrite unrelated files and obscure the migration diff. |

## Rejected Alternatives

- Deprecated catalog aliases or a dual GraphQL contract
- Converting legacy real-estate documents using fallback product values
- Using `productLocation` instead of `productRegion`
- Adding `NIGHTLIFE` or `SHOPPING` outside the approved enum contract
- Allowing updates after logical deletion
