# Travelling Backend Agent Instruction

travelling is a NestJS GraphQL monorepo migrated from a real-estate platform into a travel platform.

## Read First

Before changing code, read the current AI handoff docs. The files under `docs/ai` are the canonical source of truth; similarly named files directly under `docs` are navigation pointers only.

- `docs/ai/BACKEND_MIGRATION.md`
- `docs/ai/DECISIONS.md`
- `docs/ai/COMPLETED_TASKS.md`
- `docs/ai/NEXT_STEPS.md`

Use those files as the source of truth for AI Agent related migration history, accepted decisions, remaining work and validation status.

## Project Shape

- Backend apps are `travelling-api` and `travelling-batch`.
- Keep the existing NestJS resolver/service/module pattern based on MVC and DI.
- Keep DTOs, enums, schemas under `apps/travelling-api/src/libs`.
- Keep shared modules reusable: auth, member, like, view, comment, follow, board article, socket.

## Domain Rules

- Use Travelling/product terminology for the main catalog entity.

- Do not reintroduce property or real-estate fields.

- Keep `MemberType.USER`, `MemberType.AGENT` and `MemberType.ADMIN` unchanged.

- Product ownership continues to use `MemberType.AGENT` unless a later migration explicitly changes it.

- The GraphQL catalog is a breaking product-only contract. Do not add deprecated Property aliases.

- Product enum values are:

  - `productType`:
    `HOTEL`,
    `TOUR`,
    `ACTIVITY`,
    `TRANSPORT`,
    `RESTAURANT`

  - `productCategory`:
    `ADVENTURE`,
    `CULTURE`,
    `FOOD`,
    `NATURE`,
    `RELAXATION`,
    `FAMILY`

  - `productRegion`:
    `SEOUL`,
    `BUSAN`,
    `JEJU`,
    `INCHEON`,
    `DAEGU`,
    `OTHER`

  - `productStatus`:
    `ACTIVE`,
    `INACTIVE`,
    `SOLD_OUT`,
    `DELETE`

  - `productBookingType`:
    `INSTANT`,
    `REQUEST`

  - `productPriceUnit`:
    `PER_PERSON`,
    `PER_NIGHT`,
    `PER_BOOKING`

## Workflow

1. Analyze before editing.
2. Keep changes small and consistent with existing project patterns.
3. Do not remove working logic unless it is replaced safely.
4. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
5. Add or update focused tests when behavior changes.

## Validation

Use these checks for backend work:

```bash
npx tsc -p apps/travelling-api/tsconfig.app.json --noEmit
npx tsc -p apps/travelling-batch/tsconfig.app.json --noEmit
npx run build
```

`npm run lint` runs ESLint with `--fix`, so use it only when file rewriting is acceptable!
