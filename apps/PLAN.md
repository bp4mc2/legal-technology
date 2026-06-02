# Dashboard Execution Plan (apps/dashboard)

Last updated: 2026-06-01
Primary baseline: docs/dashboard-design-spec.md

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
- Governance and relation deep views are still placeholders.
- Compare surface lacks advanced diff behavior and decision support cues.

## Updated phased plan

Companion specification:
- docs/right-rail-context-spec.md (context requirements per selected menu item and right-rail behavior)

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

Completed outcomes:
- Implemented ProposalsPage: proposal queue with status + entity type filters, search, mock data, role-gated action buttons (visible but disabled: Goedkeuren, Afwijzen, + Voorstel indienen).
- Implemented CommentsPage: global comments list with status filter, search, mock data, escalate-to-proposal action (disabled), resolution tracking.
- Implemented AuditLogPage: chronological audit timeline with action type + entity type filters, search, traceability links to proposals and technology detail.
- All three routes show activeTechnology context banner when a technology is selected.
- All views include cross-navigation links between governance routes (Voorstellen ↔ Opmerkingen ↔ Auditlog).
- All role-gated actions (approve/reject proposals, add comments, change status, escalate) are visible but disabled pending role integration.

Exit criteria:
- /governance/proposals, /governance/comments, /governance/audit-log are functional (not placeholders).

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

## Phase 6: Quality Gate and Spec Drift Control
Goal: keep implementation and spec synchronized while reducing regressions.

Work items:
- Add targeted Vitest + RTL scenarios for newly implemented flows.
- Keep docs/dashboard-design-spec.md route mapping + gap list up to date per phase.
- Run dashboard quality gate per change set:
  - npm run test -- --run
  - npm run build
  - npm run lint

Exit criteria:
- No placeholder mismatch between spec and implementation for completed phases.
- Test/build/lint pass on dashboard for final phase delivery.

## Immediate next sprint (recommended)

1. Align on docs/right-rail-context-spec.md as implementation baseline for route-level context behavior.
2. Start Phase 3 governance implementations (Voorstellen/Opmerkingen/Auditlog) with right-rail context hooks.
3. Start Phase 4 Taken -> Producten refactor using dedicated context contract and cards.
4. Update docs/dashboard-design-spec.md gap list after each milestone to prevent documentation drift.
