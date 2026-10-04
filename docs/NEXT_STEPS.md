# Next Steps for October 5, 2026

## Priority 1: Backend cleanup and security

1. Fix the Comment DTO/type collision and nullable WebSocket payload types without changing runtime behavior.
2. Prevent privilege escalation: signup must force `USER`; self-service updates must reject `memberType` and `memberStatus`.
3. Validate required configuration, reduce JWT claims, and check current member status for privileged mutations.
4. Harden uploads against path traversal, missing directories, MIME spoofing, and unsafe public filenames.
5. Stop accepting/logging WebSocket credentials in query strings; define guest behavior.

Acceptance: build/typecheck pass; tests prevent role/status assignment; tokens are not logged; uploads cannot escape approved directories.

## Priority 2: Testing and tooling

1. Install/configure ESLint flat-config dependencies and split `lint:check` from `lint:fix`.
2. Resolve Jest compatibility with `uuid@14` or use a test-compatible UUID implementation.
3. Correct Supertest imports/types in API and batch e2e tests.
4. Add auth unit tests and isolated API/batch smoke e2e tests.
5. Add root `typecheck` and CI-safe aggregate validation scripts.

Acceptance: clean install, build, typecheck, read-only lint, unit, API e2e, and batch e2e all pass in CI.

## Priority 3: Frontend migration

1. Confirm product requirements/designs for tours, departures, booking, operators, and admin.
2. Approve additive `Tour`, `Departure`, and `Booking` GraphQL contracts.
3. Create `apps/travelling-web` with Next.js App Router after workspace/API decisions are approved.
4. Generate typed GraphQL operations and implement the public shell/auth baseline.
5. Build catalog/detail pages against additive Tour APIs; do not rename Property operations in place.

Acceptance: frontend builds independently, uses generated types, has no hard-coded aliases, and relies on server authorization.

## Priority 4: Documentation

1. Add an ADR when Tour/Departure/Booking schemas are approved.
2. Document environment-variable names and safe examples without credentials.
3. Replace the Nest starter README with project-specific setup, commands, and architecture.
4. Keep completed/proposed labels current.
5. Record rollback procedures before data or index changes.

Acceptance: a new engineer can install, run, validate, and understand the compatibility boundary without historical chat.
