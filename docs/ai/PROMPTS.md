# Useful Prompts

## Prompts From This Session

### Analyze the Current Backend

```text
Analyze current Nestar monorepo structure to transform existing NestJS Monorepo Nestar platform into Petshop platform.
```

Use this when starting from an unknown backend state and needing a structural map before planning domain migration.

### Plan a Safe Rename Layer

```text
Safe rename Layer (No Business logic change)
Rename all visible project/app identifiers from Nestar to travelling. Do Not change domain logic. Keep APIs and database collections unchanged. Update package names, environtment labels constants. Run lint and typecheck after refactoring. Please make plan first!
```

Use this when the goal is branding/project identity migration only.

### Implement the Safe Rename Plan

```text
PLEASE IMPLEMENT THIS PLAN:
Rename visible project/app identity from Nestar to travelling without changing business/domain behavior. Keep GraphQL APIs, DTOs, schemas, Mongoose model names, and database collections unchanged.
```

Use this after a decision-complete plan exists and implementation is approved.

### Create Migration Documentation

```text
Create a new folder: docs
Inside it, generate BACKEND_MIGRATION.md, DECISIONS.md, FRONTEND_MIGRATION.md, COMPLETED_TASKS.md, NEXT_STEPS.md, and PROMPTS.md.
Use everything completed and discussed in this Codex session.
Do not change application source code. Only create documentation files.
```

Use this to preserve migration context at the end of a session.

## Reusable Prompts for the Next Codex Session

### Frontend Repository Analysis

```text
Analyze the Next.js frontend repo for the Nestar to travelling migration. Do not edit files yet. Identify routing structure, GraphQL client setup, generated types, branding surfaces, assets, env variables, and every user-facing occurrence of Nestar, property, properties, agent, rent, barter, rooms, beds, square, and real-estate terminology. Produce a decision-complete frontend migration plan.
```

### Frontend Compatibility Implementation

```text
Implement Phase 1 of the travelling frontend migration. Rename visible Nestar branding to travelling and update UI copy from real-estate terminology to petshop terminology where safe. Do not change backend GraphQL operation names or require backend schema changes. Use frontend adapters/aliases for Property to product terminology. Run typecheck/build and summarize any remaining compatibility risks.
```

### GraphQL Compatibility Adapter Planning

```text
Create a GraphQL compatibility adapter plan for travelling frontend. Current backend operations and types remain Property-based: getProperties, getProperty, createProperty, updateProperty, getAgentProperties, getAgents, PropertyInput, PropertyUpdate, and Property. Plan frontend aliases and mapper functions that expose product/seller terminology without changing backend API contracts.
```

### Lint Baseline Cleanup Planning

```text
Analyze the current backend lint baseline after the travelling safe rename. Do not run auto-fix yet. Group lint errors by category: prettier formatting, unused variables, ban-types, prefer-const, and source issues. Propose a low-risk cleanup plan that avoids changing business logic.
```

### Backend Product Domain Migration Planning

```text
Plan the next backend migration phase from real-estate Property domain to petshop Product domain. Include GraphQL type/operation rename strategy, DTO/schema changes, MongoDB collection migration options, compatibility layer choices, frontend impact, batch job updates, and test strategy. Do not implement yet.
```

### Docker and Deployment Validation

```text
Validate the travelling backend deployment configuration after the safe rename. Inspect package scripts, nest-cli.json, docker-compose.yml, env variables, dist paths, and app ports. Run non-mutating checks where possible and produce a deployment readiness report.
```

### Documentation Update Prompt

```text
Update the docs folder after the next migration step. Keep BACKEND_MIGRATION.md, DECISIONS.md, FRONTEND_MIGRATION.md, COMPLETED_TASKS.md, NEXT_STEPS.md, and PROMPTS.md synchronized with the actual repo state. Only edit documentation files.
```
