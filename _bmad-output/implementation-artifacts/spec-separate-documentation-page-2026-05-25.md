---
title: 'Separate Documentation Detail Page with Legacy Parity'
type: 'feature'
created: '2026-05-25'
status: 'done'
baseline_commit: '4c8dce606baea52704d8bd84bd27c8010957caab'
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Documentation is currently embedded inside the discovery workspace in dashboard-next, but the requested behavior is a separate page that feels like the legacy LegalTechnologyDetailPage experience. This limits focus and does not match expected navigation and presentation.

**Approach:** Move documentation rendering to a dedicated route-level page in dashboard-next and make result-card actions navigate to that page. Use legacy-inspired detail-page structure and sectioning while keeping the current Tailwind styling direction and existing API integrations.

## Boundaries & Constraints

**Always:**
- Provide a dedicated documentation page route per legal technology (not an in-page section in discovery).
- Keep the discovery/compare workflow available on the home workspace and preserve existing compare behavior.
- Preserve both documentation sources: media-based documentation and legal-technology-field documentation.
- Keep behavior robust for missing documentation, including source and correlation information where available.
- Align UX with legacy detail-page patterns: clear back navigation, page header context, sectioned content.

**Ask First:**
- Any API contract changes beyond existing endpoints.
- Any change that removes currently tested compare constraints (2..4) or discovery filters.
- Any requirement to migrate this page to a different URL schema than /legaltechnologies/:id.

**Never:**
- Keep documentation as a primary in-page tab/section on the discovery route.
- Introduce a second visual system that conflicts with Tailwind-first direction.
- Break existing documentation fallback behavior or remove correlation/source visibility.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| OPEN_DETAIL_FROM_RESULT | User clicks View documentation for a technology in discovery list | App navigates to dedicated detail page for that technology and loads documentation contexts there | If fetch fails, show non-crashing error state with recover action and source/correlation metadata when available |
| OPEN_DETAIL_DIRECT_URL | User opens /legaltechnologies/:id directly | Page resolves technology metadata + documentation using existing API, renders detail layout | If id is invalid or endpoint fails, show clear error panel and back navigation |
| TOGGLE_DOC_SOURCE | User switches between media and legal-technology documentation views on detail page | Page updates active documentation pane without losing selected technology context | If one source is missing, render fallback message while keeping the other source available |
| RETURN_TO_DISCOVERY | User uses back action from detail page | User returns to discovery workspace without route errors | If browser history is unavailable, route to workspace root |

</frozen-after-approval>

## Code Map

- `apps/dashboard-next/src/App.tsx` -- current discovery workspace and embedded documentation rendering; source of route split and navigation trigger updates.
- `apps/dashboard-next/src/App.test.tsx` -- existing behavior tests that must be adapted from embedded docs section to route-based detail behavior.
- `apps/dashboard-next/src/utils/api.ts` -- API error shape (message/source/correlation) used by detail page fallbacks.
- `apps/dashboard/src/components/LegalTechnologyDetailPage.tsx` -- legacy reference for header/back-link/sectioned detail structure to mirror functionally.

## Tasks & Acceptance

**Execution:**
- [x] `apps/dashboard-next/src/App.tsx` -- split routing so discovery and detail are separate pages; replace in-page documentation open action with route navigation -- enforce dedicated documentation page architecture.
- [x] `apps/dashboard-next/src/pages/LegalTechnologyDetailPage.tsx` -- add Tailwind-based detail page inspired by legacy structure with back navigation, metadata header, and sectioned documentation views -- meet requested old-page parity while keeping current stack.
- [x] `apps/dashboard-next/src/App.test.tsx` -- update/add tests for route navigation to detail page, direct-route rendering, and preserved fallback behavior -- protect against regressions from page split.
- [x] `apps/dashboard-next/src/pages/LegalTechnologyDetailPage.test.tsx` -- add focused edge-case tests for documentation source toggling and failed fetch paths -- cover matrix scenarios explicitly.

**Acceptance Criteria:**
- Given a visible technology card in discovery, when View documentation is clicked, then the app navigates to a dedicated detail route and does not rely on an embedded documentation section in the discovery page.
- Given the detail route is opened, when documentation data is available, then the page renders a legacy-inspired detail layout with clear page header, back action, and sectioned documentation content.
- Given one or more documentation fetches fail, when the detail page renders, then fallback UI remains usable and includes source/correlation metadata when supplied by API.
- Given the user returns from the detail page, when back is triggered, then discovery remains reachable and functional.

## Spec Change Log

## Design Notes

The detail page should prioritize information hierarchy similarly to the legacy page:
1. Back link + page header context first.
2. Core identity/status metadata near the top.
3. Documentation content in explicit sections with resilient empty/error states.

Keep Tailwind classes semantic and composable. Prefer a small set of reusable section wrappers over deeply nested ad-hoc blocks.

## Verification

**Commands:**
- `npm run test -- --run src/App.test.tsx` -- expected: updated route/navigation tests pass.
- `npm run test -- --run src/pages/LegalTechnologyDetailPage.test.tsx` -- expected: detail-page edge-case tests pass.
- `npm run lint` -- expected: no new lint errors.
- `npm run build` -- expected: production build succeeds.

## Suggested Review Order

**Routing and entry flow**

- Discovery action now exits workspace into dedicated detail route.
	[`App.tsx:337`](../../apps/dashboard-next/src/App.tsx#L337)

- Route map formalizes split between discovery and detail concerns.
	[`App.tsx:386`](../../apps/dashboard-next/src/App.tsx#L386)

**Detail-page data lifecycle**

- Detail page entry and route param handling define page-level context.
	[`LegalTechnologyDetailPage.tsx:38`](../../apps/dashboard-next/src/pages/LegalTechnologyDetailPage.tsx#L38)

- Media documentation fetch centralizes fallback mapping and correlation handling.
	[`LegalTechnologyDetailPage.tsx:88`](../../apps/dashboard-next/src/pages/LegalTechnologyDetailPage.tsx#L88)

- Back navigation chooses history return first, then safe root fallback.
	[`LegalTechnologyDetailPage.tsx:148`](../../apps/dashboard-next/src/pages/LegalTechnologyDetailPage.tsx#L148)

**Detail-page UI parity**

- Tablist separates media and legal-technology documentation views.
	[`LegalTechnologyDetailPage.tsx:219`](../../apps/dashboard-next/src/pages/LegalTechnologyDetailPage.tsx#L219)

- Error state exposes source and correlation for operational debugging.
	[`LegalTechnologyDetailPage.tsx:116`](../../apps/dashboard-next/src/pages/LegalTechnologyDetailPage.tsx#L116)

**Regression coverage**

- App-level test proves card action navigates to dedicated detail route.
	[`App.test.tsx:261`](../../apps/dashboard-next/src/App.test.tsx#L261)

- App-level test validates direct URL route rendering path.
	[`App.test.tsx:274`](../../apps/dashboard-next/src/App.test.tsx#L274)

- Detail test verifies tab switching and dual-source rendering behavior.
	[`LegalTechnologyDetailPage.test.tsx:23`](../../apps/dashboard-next/src/pages/LegalTechnologyDetailPage.test.tsx#L23)

- Detail test validates documentation-failure fallback metadata rendering.
	[`LegalTechnologyDetailPage.test.tsx:72`](../../apps/dashboard-next/src/pages/LegalTechnologyDetailPage.test.tsx#L72)
