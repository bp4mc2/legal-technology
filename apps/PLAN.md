# Dashboard Execution Plan (apps/dashboard)

Last updated: 2026-06-02
Primary baseline: apps/docs/dashboard-design-spec.md

## Current status snapshot

Completed foundations:
- Three-surface shell is in place: topbar, left rail navigation, right context rail.
- Route scaffold is aligned with spec route mapping (including aliases + catch-all redirect).
- Dedicated Overzicht and Sticky Notes views are implemented.
- Alle technologieen (`/legaltechnologies`) now renders taken-gegroepeerde content.
- Taakgroepen and Filters for Alle technologieen are now hosted in the right context rail.
- Compare selection is wired end-to-end baseline:
  - shared selection state,
  - selection route,
  - compare route,
  - sticky compare tray in the main surface.
- Phase 1 baseline UI tests are in place for compare flow:
  - selection add/remove/reset,
  - sticky compare tray visibility states,
  - compare minimum-selection gating.

Still pending in core UX:
- Right rail context behavior is not yet explicitly specified per menu item (context matrix missing).
- Taken -> Producten still shares generic relation-context behavior and needs dedicated functionality.
- Compare surface lacks advanced diff behavior and decision support cues.

## Product brief update context: 
see `apps/brief.md` for detailed context on scope changes, new change signals, and updated phased

## Project context
wendbare wetsuitvoering is a project to build a semantically rich dashboard for legal technologies, backed by a GraphDB triplestore and a Flask API. The project is structured into three main components:
- Command Line Interface (CLI) for data management and ontology evolution.
- REST API for data access, manipulation, and governance workflows.
- Frontend dashboard for visualizing and interacting with legal technology data.

see `apps/project-context.md` for more details on project background, goals, and architecture.

## Updated phased plan

Companion specification:
- apps/docs/right-rail-context-spec.md (context requirements per selected menu item and right-rail behavior)

## Phase 1: Compare Flow Hardening (completed)
Goal: make compare selection and compare matrix production-ready.

Completed outcomes:
- Selection state persists across refresh (localStorage strategy).
- Compare constraints and UX guards are in place:
  - max 4 selected,
  - clear disabled/enabled states,
  - explicit empty-state guidance.
- Compare matrix behavior is hardened:
  - consistent field ordering,
  - missing-value normalization,
  - visible diff highlighting,
  - type-aware diff logic (case-insensitive and version-aware comparison rules).
- Baseline tests cover:
  - selection add/remove/reset,
  - sticky tray visibility,
  - compare route minimum-selection behavior.

Exit criteria:
- Compare flow works from list -> selection -> compare with no state desync.
- Tests cover critical compare interactions and pass.

## Phase 2: Context-Aware Right Rail (completed)
Goal: bind right rail content to selected technology context (not only route).

Completed outcomes:
- `ActiveTechnologyContext` provider tracks the last-clicked technology across the app.
- Clicking Details on any technology row sets the active technology.
- Right rail header and cards update to show technology-specific content (Documentatie, Opmerkingen, Governance) when an active technology is set on technology-section routes.
- Resilient empty states: when no technology is active, route-level generic cards are shown instead.
- Deep links from rail cards to detail page, Definities, Opmerkingen, Voorstellen, and Auditlog.

## Phase 3: Governance Views Implementation (completed)
Goal: replace governance placeholders with usable operational views.

Delivered outcomes:
- Governance ontology and SHACL baseline is available in `model/governance.ttl`.
- Governance backend is implemented with named-graph scoped services (`https://data.bp4mc2.org/id/ltg/governance`) for proposals, comments, escalations, and auditlog.
- API routes and schemas are active under `/api/governance/*` with role-gated policy checks and status transition validation.
- Header-based identity seam is centralized for role + actor resolution (`X-User-Role`, `X-Actor-Id`) and wired into governance mutations/audit trail.
- Proposals/Comments/Auditlog dashboard pages are API-backed and use server-returned permissions to enable/disable role-gated actions.

Exit criteria:
- `/governance/proposals`, `/governance/comments`, `/governance/audit-log` are functional and API-backed.
- Governance model artifacts and API/domain logic are aligned.
- Server-side authorization checks gate all governance actions.

## Phase 3b: Governance Context Scoping (completed)
Goal: ensure governance views operate in selected-technology context when the right context rail has an active technology.

Delivered outcomes:
- Governance comments and auditlog endpoints support optional `entityId` context filtering through schema, route, and service flow.
- Sticky Notes governance view reuses `technologyUri` filtering and is wired to the active technology context using canonical URI.
- Comments and Auditlog pages request scoped data when an active technology is present and gracefully fall back to global lists when context is cleared.
- Scoped-state UX copy is visible on comments, sticky notes, and auditlog views so users can see context-limited mode.
- Backend tests cover forwarding and handling of `entityId` filters for governance comments/auditlog.
- Frontend tests cover scoped request behavior for comments, sticky notes, and auditlog.
- Quality gates passed for this phase:
  - Dashboard: `npm run test -- --run`, `npm run build`, `npm run lint`.
  - API touched scope: `pytest tests/test_api.py tests/test_api_health.py tests/test_api_definitions.py tests/test_documentation_service.py`.

Exit criteria:
- Selecting a technology in the context rail and opening /governance/comments shows only comments for that technology.
- Selecting a technology in the context rail and opening /governance/stickynotes shows only sticky notes linked/candidate-matching that technology.
- Selecting a technology in the context rail and opening /governance/audit-log shows only audit entries for that technology.
- Clearing selected technology restores global (unscoped) governance lists.
- Dashboard quality gate passes: npm run test -- --run, npm run build, npm run lint.
- API quality gate passes for touched backend: pytest tests/test_api.py tests/test_api_health.py tests/test_api_definitions.py tests/test_documentation_service.py.

## Phase 4: Taken -> Producten Refactor (dedicated)
Goal: replace the current generic relations behavior on /relations/tasks-products with a dedicated task-product workflow and route-specific right-rail context.

Progress note:
- Implementation started: `/relations/tasks-products` now uses a dedicated page component with route-specific selection state and emits `lt-relations-context`.
- AppShell now listens to `lt-relations-context` and renders dedicated Taken -> Producten right-rail cards + route-specific empty state.
- Technology selection is restored for the context-aware rail: list/detail views now set the active technology context.
- Detail-page sections `Op een oogopslag`, `Functionaliteiten`, `Taaktypes`, and Sticky Notes context have been moved into the shared right rail.

Work items:
- Define route-specific context contract for Taken -> Producten (selected taskgroep, taaktype, product, related technologies).
- Implement dedicated main-surface functionality for Taken -> Producten (not shared generic placeholder logic).
- Implement dedicated right-rail cards for this route (Taakcontext, Productimpact, Governance signalering).
- Add drill-through links from Taken -> Producten context to technologie detail, governance queues, and definitions.
- Add resilient empty states when task/product context is missing.

Exit criteria:
- /relations/tasks-products no longer behaves like generic governance/relation placeholder context.
- Right rail on Taken -> Producten shows route-specific cards based on selected task/product context.

## Phase 5: Relations Views Implementation
Goal: complete remaining relation views with data-backed exploration surfaces.

Work items:
- Implement Bijdragekaart baseline visualization view.
- Provide drill-through links to technologies and governance context.

Exit criteria:
- /relations/contribution-map is functional and navigable.

## Phase 6: Documentation Experience Expansion (in progress)
Goal: evolve from definitions-only toward a unified in-dashboard documentation experience that combines curated docs and generated build outputs.

Progress note:
- Implementation started: dashboard navigation now includes `/documentation` with a documentation hub page backed by generated documentation API sections.
- Backend now exposes generated documentation fragments for catalogus, taxonomieen, organisaties, ontologie, and generatieverantwoording via `/api/legaltechnologies/documentation/generated`.

Scope boundary:
- In scope: documentation discoverability, rendering, deep links, and generation-contract alignment for dashboard consumption.
- Out of scope: ontology redesign and broad semantic model restructuring.

Work items:
- Add a Documentation Hub route in the dashboard with sections for Catalogus, Taxonomieen, Organisaties, Ontologie, and Generatieverantwoording.
- Reuse generated output contracts from `tools/generate_respec.py` and section structure in `build/docs/respec/index.html` as source-of-truth for generated docs navigation.
- Align API documentation retrieval contract in `apps/api/services/documentation_service.py` with dashboard needs (stable anchors, source labeling, generation timestamp, deterministic fallback).
- Add contextual deep links from Definities, technology detail, and right-rail context cards to relevant documentation anchors.
- Add resilient UX states: loading, unavailable source, stale generation warning, and actionable guidance for regeneration.
- Keep generated build artifacts read-only in dashboard UX and direct edits to source docs/model paths.

Exit criteria:
- Users can open a documentation hub from the dashboard and navigate generated sections without leaving app context.
- Contextual deep links from technology/governance surfaces land on the correct documentation anchors.
- Missing or stale generated documentation shows actionable fallback guidance instead of hard failures.
- Touched-scope quality gates pass for dashboard and documentation API contract coverage.

## Phase 7: Quality Gate and Spec Drift Control
Goal: keep implementation and spec synchronized while reducing regressions.

Work items:
- Add targeted Vitest + RTL scenarios for newly implemented flows.
- Keep apps/docs/dashboard-design-spec.md route mapping + gap list up to date per phase.
- Run dashboard quality gate per change set:
  - npm run test -- --run
  - npm run build
  - npm run lint

Exit criteria:
- No placeholder mismatch between spec and implementation for completed phases.
- Test/build/lint pass on dashboard for final phase delivery.

## Immediate next sprint (recommended)

1. Align on apps/docs/right-rail-context-spec.md as implementation baseline for route-level context behavior.
2. Start Phase 4 Taken -> Producten refactor using dedicated context contract and right-rail cards.
3. Kick off Phase 6 documentation hub implementation by defining route, section model, and source contracts.
4. Align generated documentation contracts across `tools/generate_respec.py`, `build/docs/respec/index.html`, and `apps/api/services/documentation_service.py`.
5. Update apps/docs/dashboard-design-spec.md gap list after each milestone to prevent documentation drift.
