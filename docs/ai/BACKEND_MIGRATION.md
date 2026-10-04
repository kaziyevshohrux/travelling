# Backend Migration: Nestar to Travelling

## Original Project Summary

| Area | Nestar State |
| --- | --- |
| Platform identity | Nestar |
| Backend framework | NestJS monorepo with GraphQL |
| Main apps | `nestar-api`, `nestar-batch` |
| Domain origin | Real-estate marketplace platform |
| Core domain module | `Property` listings managed by `Agent` members |
| Persistence | MongoDB with Mongoose schemas and existing collections |

Nestar was structured as a NestJS GraphQL monorepo with a primary API app and a scheduled/batch app. The domain model still reflects a real-estate platform: `Property`, `Agent`, property locations, property rooms, beds, square area, rent, barter, and sold/deleted lifecycle states.

## New Project Summary

| Area | Travelling State |
| --- | --- |
| Platform identity | Travelling |
| Backend framework | NestJS monorepo with GraphQL |
| Main apps | `travelling-api`, `travelling-batch` |
| Intended product direction | Petshop platform |
| Current domain state | Real-estate domain logic intentionally preserved |
| Migration layer completed | Safe project/app identity rename |

Travelling is now the visible backend identity. The repository has been renamed at the project/app level, but the business domain remains compatible with the existing Nestar backend API and data model.

## Backend Migration Goal

The current migration goal is a safe identity rename layer:

- Rename visible project, app, deployment, and runtime labels from Nestar to Travelling.
- Keep all business logic unchanged.
- Keep GraphQL API names unchanged.
- Keep MongoDB collection and schema behavior unchanged.
- Defer petshop-specific domain conversion, such as `Property` to `Product`, to a later planned migration.

## Naming Changes Completed

| Old Name | New Name | Notes |
| --- | --- | --- |
| `apps/nestar-api` | `apps/travelling-api` | API app folder renamed. |
| `apps/nestar-batch` | `apps/travelling-batch` | Batch app folder renamed. |
| Nest project `nestar-api` | `travelling-api` | Updated in `nest-cli.json`. |
| Nest project `nestar-batch` | `travelling-batch` | Updated in `nest-cli.json`. |
| Package name `nestar` | `travelling` | Updated in `package.json` and `package-lock.json`. |
| Docker service/container names `nestar-*` | `travelling-*` | Updated in `docker-compose.yml`. |
| Working directory `/usr/src/nestar` | `/usr/src/travelling` | Docker-only project path label. |
| Runtime welcome label `Nestar` | `Travelling` | Updated API and batch welcome strings. |
| Dist paths `dist/apps/nestar-*` | `dist/apps/travelling-*` | Updated app tsconfigs and package scripts. |
| Absolute imports `apps/nestar-api/...` | `apps/travelling-api/...` | Updated path references required by folder rename. |

## Module Changes

No business modules were converted to petshop domain logic in this phase.

| Module Area | Current Status |
| --- | --- |
| Auth | Unchanged behavior and guards. |
| Member | Unchanged member model and `MemberType` values. |
| Agent | Still represented by `MemberType.AGENT`. |
| Property | Still the central listing domain. |
| Board article | Unchanged community/article behavior. |
| Comment | Unchanged comment behavior and target groups. |
| Like | Unchanged like behavior and target groups. |
| View | Unchanged view tracking behavior and target groups. |
| Follow | Unchanged follower/following behavior. |
| Socket | Unchanged websocket module. |
| Batch | Unchanged rank formulas for top properties and agents. |

## GraphQL Changes

No public GraphQL domain names were changed.

| GraphQL Surface | Status |
| --- | --- |
| Object types | `Property`, `Properties`, `Member`, `Members`, etc. remain unchanged. |
| Inputs | `PropertyInput`, `PropertyUpdate`, `PropertiesInquiry`, `AgentPropertiesInquiry` remain unchanged. |
| Queries | `getProperties`, `getProperty`, `getAgentProperties`, `getAgents`, etc. remain unchanged. |
| Mutations | `createProperty`, `updateProperty`, `likeTargetProperty`, etc. remain unchanged. |
| Enums | `PropertyType`, `PropertyStatus`, `PropertyLocation`, `MemberType.AGENT` remain unchanged. |

This preserves compatibility for any existing frontend or clients that call the current GraphQL API.

## MongoDB Collection and Schema Changes

MongoDB collections and Mongoose schemas were intentionally not renamed.

| Data Layer Item | Status |
| --- | --- |
| Mongoose model `Property` | Unchanged. |
| Collection `properties` | Unchanged. |
| Collection `members` | Unchanged. |
| Collection `likes` | Unchanged. |
| Collection `views` | Unchanged. |
| Collection `comments` | Unchanged. |
| Collection `follows` | Unchanged. |
| Schema fields such as `propertyTitle`, `propertyPrice`, `propertyRooms` | Unchanged. |
| `.env` Mongo database label | Changed from `/Nestar` to `/Travelling` as an environment/project label. |

## Compatibility Notes

- Backend clients should keep using existing GraphQL operations until a future API migration is approved.
- Frontend UI can start showing Travelling/petshop terminology while mapping to the existing `Property` GraphQL fields internally.
- Existing database collections remain compatible with the previous Nestar schema.
- A future `Property` to `Product` migration should be planned separately because it affects API contracts, DTOs, Mongoose models, batch jobs, frontend queries, and data migration.
