---
title: 'Render catalog details as markdown'
type: 'feature'
created: '2026-05-26'
baseline_commit: 'c7777b891d2a467eb25a66bcb6bb1d754fc48de3'
status: 'done'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** In the frontend catalog details page, generated documentation from media/legal-technologies.md is currently displayed as plaintext in pre blocks. This makes headings, tables, lists, and links hard to scan and degrades usability.

**Approach:** Replace plaintext rendering with markdown rendering in the catalog details view using a safe React markdown renderer with GFM support, while preserving existing section navigation and search behavior.

## Boundaries & Constraints

**Always:**
- Keep the existing API contract for /api/legaltechnologies/documentation/catalog unchanged.
- Preserve existing catalog page structure: header, sidebar section navigation, search filter, and per-section anchors.
- Render markdown content as styled HTML (headings, paragraphs, lists, tables, links, inline code) for both overview and section bodies.
- Keep current error/loading behavior and existing route path /catalog-details.
- Keep tests deterministic with mocked API responses.

**Ask First:**
- Any content sanitization policy changes beyond current frontend rendering defaults.
- Any change that requires backend content transformation instead of frontend-only rendering.

**Never:**
- Do not remove section parsing logic that powers in-page navigation.
- Do not reintroduce plaintext pre rendering for markdown body fields.
- Do not change legal-technologies.md generator output format in this scope.
- Do not change unrelated discovery/detail workflows.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Render overview markdown | Catalog API returns overview markdown with headings and list content | Overview renders as markdown elements (not raw plaintext block) | N/A |
| Render section markdown | Catalog API returns section body containing markdown tables/lists/links | Section body renders as formatted markdown with table and link semantics | N/A |
| Empty markdown fragment | API returns empty overview or section body | Page renders without crash; empty content area remains stable | Keep existing page layout and no JS errors |
| API error | Catalog API returns non-2xx response | Existing alert panel remains visible with error message | Existing error UI path unchanged |

</frozen-after-approval>

## Code Map

- `apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.tsx` -- Current catalog details UI; currently renders markdown source in pre tags.
- `apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.test.tsx` -- Catalog page tests; needs assertions for rendered markdown behavior.
- `apps/dashboard-next/package.json` -- Frontend dependencies; add markdown renderer packages.
- `apps/dashboard-next/src/App.test.tsx` -- Route-level integration test for catalog details from discovery navigation.

## Tasks & Acceptance

**Execution:**
- [x] `apps/dashboard-next/package.json` -- add react-markdown and remark-gfm dependencies -- enable markdown + GFM rendering (tables, task-like list syntax, link parsing).
- [x] `apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.tsx` -- replace pre-based plaintext output with markdown renderer components for overview and section body -- provide readable formatted documentation.
- [x] `apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.tsx` -- add minimal scoped styling classes for markdown content blocks (headings/table/list/link/code) -- maintain visual consistency with dashboard.
- [x] `apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.test.tsx` -- assert markdown output semantics (for example table rendering and link rendering) instead of plaintext-only assertions -- prevent regressions.
- [x] `apps/dashboard-next/src/App.test.tsx` -- keep catalog route smoke coverage valid with new rendering -- ensure navigation flow still works.

**Acceptance Criteria:**
- Given catalog markdown contains headings, lists, and tables, when the user opens /catalog-details, then content is rendered as markdown HTML semantics and not as raw plaintext blocks.
- Given catalog sections contain markdown links, when rendered, then links are clickable anchors with expected href values.
- Given existing section sidebar search and hash anchors, when markdown rendering is introduced, then filtering and in-page navigation continue to work unchanged.
- Given the catalog API fails, when the page loads, then existing error messaging and alert behavior remain intact.

## Spec Change Log

## Design Notes

Use a renderer-based approach instead of manual markdown parsing to avoid fragile transformations and to correctly support GitHub-flavored markdown tables from generated catalog content. Keep parsing responsibilities split as they are today:
- Current parser keeps structural segmentation (<section id="..."> blocks) for navigation.
- Markdown renderer handles presentation semantics inside each segment.

This preserves the existing page architecture and avoids coupling section extraction with markdown conversion logic.

## Verification

**Commands:**
- `cd apps/dashboard-next && npm run test -- --run src/pages/LegalTechnologyCatalogDetailsPage.test.tsx src/App.test.tsx` -- expected: tests pass including markdown render assertions.
- `cd apps/dashboard-next && npm run lint` -- expected: no lint errors.
- `cd apps/dashboard-next && npm run build` -- expected: successful production build.

## Suggested Review Order

**Markdown Rendering Strategy**

- Introduces GFM renderer while preserving section-parsing and existing layout flow.
  [LegalTechnologyCatalogDetailsPage.tsx:225](../../apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.tsx#L225)

- Ensures links open externally only when truly external, preserving in-page markdown anchors.
  [LegalTechnologyCatalogDetailsPage.tsx:72](../../apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.tsx#L72)

**Rendered Content Styling**

- Adds scoped markdown element styling for headings, lists, tables, and inline code.
  [LegalTechnologyCatalogDetailsPage.tsx:227](../../apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.tsx#L227)

- Applies identical markdown rendering policy to per-technology section bodies.
  [LegalTechnologyCatalogDetailsPage.tsx:261](../../apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.tsx#L261)

**Verification and Support**

- Verifies markdown table rendering, external links, and internal hash-link behavior.
  [LegalTechnologyCatalogDetailsPage.test.tsx:44](../../apps/dashboard-next/src/pages/LegalTechnologyCatalogDetailsPage.test.tsx#L44)

- Confirms discovery-to-catalog route entry remains operational after rendering changes.
  [App.test.tsx:298](../../apps/dashboard-next/src/App.test.tsx#L298)

- Adds markdown rendering dependencies used by the catalog details page.
  [package.json:17](../../apps/dashboard-next/package.json#L17)
