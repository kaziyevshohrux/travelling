---
name: product-logic
description: Review Travelling product API consistency across GraphQL operations, DTOs, schemas, enums, filters, and remaining legacy terminology.
---

# Travelling Product API Review

Use this skill for review-only passes or pre-edit analysis of the product API.

## Review Checklist

- Confirm GraphQL operation names use product terminology:
  - `createProduct`
  - `getProduct`
  - `updateProduct`
  - `getProducts`
  - `getAgentProducts`
  - `likeTargetProduct`
  - the related admin operations
- Confirm shared operations such as `getFavorites` and `getVisited` return product data.
- Confirm DTOs, schemas, and enums agree on product fields and nullability.
- Confirm filters use the approved travel fields: product type, category, region, booking type, price, text search, and product status where applicable.
- Confirm enum values match `AGENTS.md` exactly and no deprecated Property aliases are exposed.
- Report real findings with paths and behavior impact.
