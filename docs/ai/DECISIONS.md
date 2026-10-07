# Migration Decisions

## Accepted Decisions

| Decision | Rationale |
| --- | --- |
| Make a hard product-only GraphQL cutover. | The approved release is intentionally breaking and must not retain stale catalog aliases. |
| Keep `MemberType.USER`, `AGENT`, and `ADMIN`. | Role compatibility is required; product ownership remains with agents. |
| Keep existing enum values and add travel-search targets additively. | `TRANSFER`, `WELLNESS`, and `CITY_EXPLORATION` are available without making existing `TRANSPORT`, `RESTAURANT`, `RELAXATION`, or `FAMILY` records unreadable. |
| Start with an empty `products` collection. | Legacy real-estate records do not have trustworthy product equivalents. |
| Archive legacy records instead of transforming them. | Avoids fabricated product categories, booking rules, prices, and details. |
| Default currency to `KRW`. | Creation remains concise while persistence and output always have a currency. |
| Keep `productDetails` flexible. | Product-type-specific descriptive data remains flexible; capacity and searchable inventory are explicit fields. |
| Keep embedded Product availability as a minimal interim boundary. | Date searches require inventory evidence now without introducing payment or a complete booking lifecycle. Inventory mutation/concurrency remains future booking work. |
| Treat blocked inventory as the state of one unique availability entry. | A single slot/night cannot be simultaneously published and blocked, avoiding precedence ambiguity and duplicate inventory. |
| Quote only the configured base price. | Price-unit multiplication is deterministic; discounts, taxes, fees, and FX require explicit future rules. |
| Make `DELETE` terminal. | Owner counters can be decremented exactly once and physical removal remains controlled. |
| Include the target group in like/view uniqueness. | Identical ObjectIds in different target domains must not collide. |
| Preserve batch schedules and rank formulas. | The domain rename should not change existing ranking behavior. |
| Do not run the auto-fixing lint script. | It would rewrite unrelated files and obscure the migration diff. |

## Rejected Alternatives

- Deprecated catalog aliases or a dual GraphQL contract
- Converting legacy real-estate documents using fallback product values
- Replacing stored `productRegion` with `productLocation`; the new search-only location string resolves against region/address instead
- Adding `NIGHTLIFE` or `SHOPPING` outside the approved enum contract
- Allowing updates after logical deletion
