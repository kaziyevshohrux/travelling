# Migration Decisions

## Architectural Decisions

| Decision | Why It Was Made | Risks | Alternatives |
| --- | --- | --- | --- |
| Perform a safe identity rename before domain conversion. | It reduces migration risk and creates a Travelling-branded backend without changing behavior. | travelling still contains real-estate terminology such as `Property` and `Agent`. | Convert all domain concepts immediately from real estate to petshop. |
| Rename app folders from `nestar-*` to `travelling-*`. | App names are visible project identifiers and should match the new platform identity. | Git may show deletes and untracked files until the rename is staged. | Keep folder names unchanged and only update display text. |
| Rename Nest project keys to `travelling-api` and `travelling-batch`. | Nest build/start commands depend on project keys; project identity should match folder names. | Any external script still calling `nestar-api` or `nestar-batch` will need updating. | Keep old Nest project keys as compatibility aliases. |
| Rename package and deployment labels to Travelling. | `package.json`, Docker service names, container names, and runtime labels are visible project identity surfaces. | Deployment automation that references old names may break until updated. | Delay deployment label rename until infrastructure migration. |
| Preserve GraphQL API names. | Keeping `Property`, `createProperty`, `getProperties`, and `getAgents` avoids breaking existing clients. | Frontend and docs will temporarily have mixed travelling/product UI terms and real-estate backend terms. | Break API compatibility and rename GraphQL to product terminology now. |
| Preserve Mongoose model names and MongoDB collections. | Collection renames require data migration and increase operational risk. | Database still has `properties` and property-prefixed fields. | Add new `products` collection and migrate data. |
| Keep domain logic unchanged. | The user explicitly requested no business logic change during the safe rename layer. | Petshop behavior is not implemented yet. | Implement product catalog, inventory, orders, and seller workflows now. |
| Keep environment variable names unchanged. | `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD`, and `SECRET_TOKEN` are generic enough and changing them adds runtime risk. | Some env names still do not encode Travelling identity. | Rename env variables and update every deployment secret. |
| Change only the Mongo database label in `.env` from `Nestar` to `Travelling`. | The database name is a project/environment label, not a collection/schema contract. | If an existing database with production data is still named `Nestar`, switching the URI target may point to an empty database. | Keep database name `Nestar` until a controlled data migration. |
| Avoid broad `npm run lint` auto-fix. | The project lint script uses `--fix` and would rewrite unrelated source files beyond the requested safe rename. | Existing lint errors remain. | Run auto-fix and accept broad formatting/source churn. |
| Defer `Property` to `Product` migration. | It is a breaking domain/API/data change and should be planned separately. | Temporary terminology mismatch remains. | Add a dual GraphQL compatibility layer or perform a hard rename. |

## Current Validation Decisions

| Check | Decision | Result |
| --- | --- | --- |
| Branding search | Verify no remaining `Nestar`/`nestar` strings outside ignored folders after rename. | Passed during implementation. |
| Typecheck | Run TypeScript checks for both renamed apps. | Passed for `travelling-api` and `travelling-batch`. |
| Build | Run Nest build using renamed project keys. | Passed with `npm run build`. |
| Lint | Run non-mutating ESLint check, not the mutating `npm run lint`. | Failed on existing style and unused-variable issues. |

## Decision Boundaries

The completed migration layer is intentionally not a petshop domain migration. Any future change to GraphQL object names, resolver names, schema fields, Mongo collections, or frontend query documents should be treated as a separate breaking-change plan.
