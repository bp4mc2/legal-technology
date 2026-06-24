---
description: "Use when writing or updating frontend tests in apps/dashboard with Vitest and Testing Library, especially query selection, async assertions, and flake prevention."
name: "Frontend Test Conventions (Dashboard)"
applyTo:
  - "apps/dashboard/src/**/*.{test,spec}.{ts,tsx}"
  - "apps/dashboard/vite.config.ts"
---
# Frontend Test Conventions (apps/dashboard)

Use this instruction for dashboard test creation and maintenance.

## Canonical References
- Dashboard scripts and dependencies: [apps/dashboard/package.json](apps/dashboard/package.json)
- Dashboard dev and test commands: [apps/docs/development-guide.md](apps/docs/development-guide.md)
- Current Vitest config: [apps/dashboard/vite.config.ts](apps/dashboard/vite.config.ts)

## Testing Stack Expectations
- Test runner: Vitest.
- DOM environment: jsdom.
- UI testing library: @testing-library/react.
- Keep tests user-centric: assert behavior and visible outcomes, not implementation details.

## Query Style (Preferred)
Use Testing Library queries from most to least user-representative.

1. getByRole or findByRole with accessible name.
2. getByLabelText for form controls.
3. getByPlaceholderText for explicit input placeholder behavior.
4. getByText only when role or label based queries are not appropriate.

To avoid flaky or broad tests:
- Do not use broad getByText for strings that can appear in multiple places.
- Scope repeated content with within(container) and role-based selectors.
- Use getAllBy... when duplicates are intentional and assert count explicitly.

## Async and Interaction Rules
- Use findBy... or waitFor for async UI changes.
- Keep one main assertion per user-visible behavior; avoid overcoupled assertion chains.
- Prefer deterministic inputs and explicit setup per test.
- Avoid timing-based waits and arbitrary delays.

## Isolation and Determinism
- Mock network boundaries (fetch or API client) at the edge of the component under test.
- Reset mocks between tests.
- Keep tests independent: no reliance on test execution order.
- Keep fixtures minimal and local to the test file unless broadly reused.

## Assertions
- Prefer semantic assertions (what the user can see or do).
- Assert key text with stable selectors and accessible names.
- Avoid asserting incidental markup structure unless structure is the requirement.

## Windows and Vitest Stability
- If Vitest worker processes are unstable or timeout on Windows, set test.pool to threads in [apps/dashboard/vite.config.ts](apps/dashboard/vite.config.ts).
- If jest-dom matchers are added, initialize with a guarded global extension pattern to avoid duplicate/worker initialization issues.

## Required Validation Before Finishing
Run from apps/dashboard:
- npm run test -- --run

When test-related config changes are made, also run:
- npm run build
