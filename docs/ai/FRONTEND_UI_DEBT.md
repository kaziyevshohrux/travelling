# Frontend UI Debt

The product contract migration is complete. These follow-up items require runtime fixtures, design review, or broader refactoring and were intentionally kept outside the contract cutover.

- Seed representative products and provide USER, AGENT, and ADMIN test accounts, then execute the authenticated CRUD, upload, interaction, and deleted-only removal acceptance scenarios.
- Complete visual QA at desktop and mobile widths across home, listings, details, providers, My Page, admin, community, customer service, and chat.
- Add automated route, locale, and authenticated catalog smoke coverage when the project adopts a test harness.
- Gradually rename internal component and SCSS identifiers that still contain `Agent`; backend GraphQL/type symbols must remain unchanged.
- Consolidate remaining non-catalog legacy styling and replace suitable generic imagery as design assets become available.
- Refresh Browserslist data and address the existing `react-i18next` static-generation warning in a dependency-maintenance phase.
