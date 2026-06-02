# Dashboard-next redesign spec
*Wendbare Wetsuitvoering · versie 0.1 · 2026-05-27*

---

## Design rationale

The current dashboard uses a flat list with tab navigation and a generic search-and-filter pattern. The redesign addresses three structural problems:

1. **Governance is invisible.** Protected-entity status is not surfaced at card level, so users cannot tell when an action requires a proposal versus a direct edit.
2. **Documentation and comments are separate destinations.** The PRD explicitly requires documentation and comments to be available alongside the technology view; currently they are behind separate navigation.
3. **The compare flow is disconnected.** Selection for comparison happens through a button click but has no persistent working surface in the main view.

The proposed layout is a three-column workspace:

- Left rail: persistent single navigation system with named section groups (Technologies, Governance, Relations).
- Centre: the main working surface (technology list, compare view, task-product relation view, etc.).
- Right rail: a context panel that is always visible and contains documentation, comments, and pending governance items for the currently selected technology.

The workspace also includes dedicated routes for:

- **Overzicht (Statistieken & Overzicht)** as a separate landing/work view.
- **Sticky Notes** as a separate governance work view.

---

## Layout structure

```
┌─ topbar ─────────────────────────────────────────────────────────────┐
│ Brand · Fact-find · role indicator · + Voorstel                     │
└──────────────────────────────────────────────────────────────────────┘
┌─ sidebar (180px) ─┬─ main (flex) ───────────────────┬─ rail (220px) ─┐
│  Technologies     │  search + filter chips          │  Documentatie  │
│  > Overzicht      │  FF-banner (dismissible)        │  Opmerkingen   │
│  > All            │  technology card list           │  Governance    │
│  > Compare        │                                 │                │
│  > Selection      │                                 │                │
│  Governance       │  [compare bar — sticky bottom]  │                │
│  > Proposals      │                                 │                │
│  > Comments       │                                 │                │
│  > Sticky Notes   │                                 │                │
│  > Audit log      │                                 │                │
│  Relations        │                                 │                │
│  > Tasks→Products │                                 │                │
│  > Contribution   │                                 │                │
└───────────────────┴─────────────────────────────────┴────────────────┘
```

---

## Topbar

| Element | Description |
|---|---|
| Brand wordmark | "Wendbare Wetsuitvoering" — serif display, teal dot |
| Primary nav | None. The topbar is brand/actions only; the sidebar is the single navigation hierarchy. |
| Role badge | Shows current user role (Viewer / Proposer / Moderator / Admin) with shield icon |
| Fact-find button | Opens fact-find panel or inline banner in the main column |
| + Voorstel button | Opens the proposal creation flow (always visible, role-gated on submit) |

---

## Left sidebar navigation

### Technologies
- **Overzicht** — dedicated dashboard overview page with Statistieken & Overzicht as primary content (default landing view)
- **Alle technologieën** — full list with search and filter
- **Vergelijken** — compare matrix view for 2–4 selected technologies
- **Selectie** — current compare selection chip tray with shortcut to compare view

### Governance
- **Voorstellen** — list of open proposals, filterable by entity type and status
- **Opmerkingen** — all comments across technologies and documents with status filter
- **Sticky Notes** — dedicated sticky notes work view for cross-technology notes, triage, and follow-up
- **Auditlog** — chronological log of all regulated mutations (read-only for Viewer/Proposer)

### Documentatie
- **Definities** — central documentation and terminology entry point

### Verbanden (relations)
- **Taken → Producten** — task-product relation view showing input/output semantics per product
- **Bijdragekaart** — visual map of which technologies contribute to which products via tasks

---

## Dedicated views

### Overzicht (Statistieken & Overzicht)

Overzicht is a separate route and should not be merged into the generic technologie-lijst view.

- Primary content: Statistieken & Overzicht panels.
- Secondary content: quick links to Alle technologieën, Vergelijken, and Governance queues.
- Fact-find banner is shown in this view by default and can be dismissed.

### Sticky Notes

Sticky Notes is a separate route and should not be merged into Opmerkingen in the right rail.

- Primary content: sticky notes board/list with filters, status handling, and note-level actions.
- Context integration: selecting a technology can pre-filter notes, but the view remains standalone.
- Governance integration: unresolved notes can be promoted to proposal or comment workflows when needed.

---

## Route mapping

The following routes are the exact current implementation in `apps/dashboard/src/main.tsx`.

| View | Route | Notes |
|---|---|---|
| Overzicht (Statistieken & Overzicht) | `/` | Default landing view |
| Alle technologieen | `/legaltechnologies` | Taken-gegroepeerde weergave; taakgroepen + filters staan in de right context rail |
| Vergelijken | `/legaltechnologies/compare` | Implemented with compare matrix for shared selection |
| Selectie | `/legaltechnologies/selection` | Implemented with shared compare selection management |
| Technologie detail | `/legaltechnologies/:id` | Detail view per technology |
| Voorstellen | `/governance/proposals` | Implemented as placeholder view |
| Opmerkingen | `/governance/comments` | Implemented as placeholder view |
| Sticky Notes | `/governance/stickynotes` | Dedicated sticky notes view |
| Auditlog | `/governance/audit-log` | Implemented as placeholder view |
| Taken -> Producten | `/relations/tasks-products` | Current task-product relation route |
| Bijdragekaart | `/relations/contribution-map` | Implemented as placeholder view |
| Organisaties | `/organisations` | Organisations management view |
| Assistent | `/assistant` | Assistant panel view |
| Enumeraties | `/enumerations` | Enumeration filter view |
| Definities | `/definitions` | Definitions management view |
| Legacy alias: Taaktypen | `/tasktypes` | Redirects to `/relations/tasks-products` |
| Legacy alias: Sticky Notes | `/stickynotes` | Redirects to `/governance/stickynotes` |

### Gap list (spec target vs current implementation)

The routes below are described in this redesign spec but are not yet fully implemented (placeholder scaffolds are present in `apps/dashboard/src/main.tsx`).

| Planned view | Planned route | Current status |
|---|---|---|
| Vergelijken | `/legaltechnologies/compare` | Implemented baseline matrix; advanced field-level diff rules still pending |
| Selectie | `/legaltechnologies/selection` | Implemented baseline selection management; bulk curation workflow still pending |
| Voorstellen | `/governance/proposals` | Implemented baseline: status/entity-type filter, role-gated actions (disabled), activeTechnology context |
| Opmerkingen | `/governance/comments` | Implemented baseline: status filter, comment cards, escalate action (disabled), activeTechnology context |
| Auditlog | `/governance/audit-log` | Implemented baseline: action/entity-type filter, timeline view, traceability links |
| Bijdragekaart | `/relations/contribution-map` | Placeholder only; graph view behavior pending |

Fallback and deep-link behavior:

- Unknown routes redirect to `/` via catch-all route.
- If a route requires an active technology context and none is selected, show a guided empty state with a shortcut to `/legaltechnologies`.

### Implementation phase alignment (spec + apps/PLAN.md)

To keep planning language consistent across this spec and `apps/PLAN.md`, implementation status is tracked with the following shared phase names:

| Phase | Shared label | Scope | Current state |
|---|---|---|---|
| 1 | Compare Flow Hardening | Selection persistence, compare UX guards, matrix diff clarity, compare tests | In progress |
| 2 | Context-Aware Right Rail | Selected-technology-driven rail content for Documentatie, Opmerkingen, Governance | In progress (route-level controls in place for `/legaltechnologies`) |
| 3 | Governance Views Implementation | Functional Voorstellen, Opmerkingen, Auditlog surfaces | Not started |
| 4 | Relations Views Implementation | Functional Taken -> Producten and Bijdragekaart surfaces | Not started |
| 5 | Quality Gate and Spec Drift Control | Test/build/lint gates plus route/gap-list synchronization | Ongoing across all phases |

Status vocabulary used in both planning sources:

- `Not started`: no functional implementation started.
- `In progress`: active implementation with partial behavior available.
- `Implemented baseline`: functional first version delivered, advanced behaviors still pending.
- `Completed`: phase exit criteria met.

---

## Technology card

Each technology is rendered as a card in the main column. The card contains:

| Element | Detail |
|---|---|
| Name | 14px medium weight |
| Description | 2–3 line excerpt, muted |
| Status badge | See status model below |
| Protection indicator | "Voorstel vereist" lock badge for any status that is proposal-only |
| Documentation button | Opens documentation in right rail (technology doc tab) |
| Comment counter | Badge with open comment count; click opens comments tab in rail |
| Add to compare | Chip-style toggle; appears on cards not already in selection |
| Direct edit/delete | Only shown for Concept and Proposed status to Moderator/Admin |
| Selection indicator | Teal checkmark + "In vergelijkselectie" text for selected cards |

Cards with proposal-only status show a `lock` icon badge. Cards in `Draft` or `Proposed` status show an inline edit button for Moderator/Admin (no proposal required, but audited).

---

## Status model and protection

| Status | Label (NL) | Proposal required | Direct mutation allowed for |
|---|---|---|---|
| Draft | Concept | No | Moderator, Admin |
| Proposed | Voorgesteld | No | Moderator, Admin |
| In Review | In review | Yes | — |
| Accepted | Geaccepteerd | Yes | — |
| Published | Gepubliceerd | Yes | — |
| Active | In gebruik | Yes | — |
| Deprecated | Verouderd | Yes | — |
| Archived | Gearchiveerd | Yes | — |
| Unknown | (onbekend) | Yes (fail-safe) | — |

All mutations — including those allowed for Moderator and Admin on Draft/Proposed — are written to the audit log with actor, timestamp, target entity, previous value, new value, and action reason.

---

## Compare bar (sticky bottom of main column)

A persistent bar at the bottom of the main column shows:

- Current selection chips (technology names with ×-remove button)
- Slot placeholder chip: "+ Voeg toe (max 4)" (dashed border, muted)
- "Vergelijk selectie →" button (disabled when fewer than 2 selected)

The compare bar is always visible when at least one technology is selected.

---

## Right rail — context panel

The rail has three tabs: **Documentatie**, **Opmerkingen**, **Governance**. The active technology (hovered or last clicked in the main column) determines the context shown.

### Documentatie tab

Two explicitly separated sections:

**Technologiedocumentatie** — sourced from `tools/generate_respec.py` output under `media/`. Each item shows filename, source label ("ReSpec gegenereerd"), and opens inline in the rail or as standalone artifact.

**Mediadocumentatie** — other media artifacts (diagrams, schemas, images) linked to the technology. Source label shown per item.

The source separation is a hard UI requirement (FR-011, FR-016). Do not merge the two groups visually.

### Opmerkingen tab

Lists comments on the selected technology and its documentation. Each comment shows:

- Author name
- Comment status badge: Nieuw · In behandeling · Geaccepteerd · Afgewezen · Opgelost
- Comment body (truncated to ~60 chars with expand)
- Status transition buttons for Moderator/Admin

New comment input at the bottom of the tab, available to all roles (FR-002).

Comment lifecycle: New → In Review → Accepted or Rejected → Resolved. Transitions are role-gated (FR-013).

### Governance tab

Shows pending proposals and recent audit entries for the selected technology.

**Pending proposal card** — displays:
- Proposal type (create / edit / delete / status change)
- Proposed change summary
- Submitter name
- Approve and Reject buttons (Moderator/Admin only)

**Audit entries** — last 5 entries with actor, action, and timestamp. Link to full audit log.

---

## Fact-find

A dismissible info banner appears below the main header when the Overzicht is active. It summarises that fact-find is available and offers a "Starten" button.

Fact-find results open as a panel (replace main column content or open in a modal-style surface). Results can be linked to technologies, tasks, and documents as evidence (FR-015). Each result item has a "Koppel als bewijs" action.

---

## Proposal workflow

Triggered via "+ Voorstel" in the topbar or via inline "Stel voor" buttons on protected entities.

The proposal creation form collects:
- Target entity (pre-filled when triggered from a card)
- Action type (create / edit / delete / status change)
- Proposed value(s) / new status
- Motivation text (required)

On submission, the proposal enters the pending queue visible in the Governance tab of the rail and in Governance > Voorstellen in the sidebar.

Approval or rejection by Moderator/Admin is recorded in the audit log with reason.

---

## Role model summary

| Role | View | Comment | Propose | Approve/Reject | Direct mutate (Draft/Proposed) | Admin |
|---|---|---|---|---|---|---|
| Viewer | ✓ | — | — | — | — | — |
| Proposer | ✓ | ✓ | ✓ | — | — | — |
| Moderator | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Key design decisions vs current dashboard

| Current | Redesign | Reason |
|---|---|---|
| Flat card list, no governance cues | Lock badge + protection label per card | FR-003, FR-007: governance must be visible before acting |
| Tabs for Overzicht / Juridische technologieën / Catalogusdetails | Three-column workspace with sidebar, main, rail | PRD requires documentation and comments alongside the technology view |
| "Select at least 2 technologies" error in page header | Persistent compare bar at bottom of main column | Compare state is always visible without occupying the header area |
| "View documentation" opens separate view | Documentation opens in right rail with explicit source separation | FR-011, FR-016 |
| No governance indicators on cards | Proposal-required badge, role badge in topbar | FR-005, FR-008 |
| No comment count on cards | Comment counter badge per card | FR-002 |
| Fact-find absent | Fact-find banner + result linking | FR-014, FR-015 |
| Overzicht not separated from list workflows | Dedicated Overzicht route for Statistieken & Overzicht | Improves orientation and preserves dashboard landing intent |
| Sticky Notes hidden in generic comment flows | Dedicated Sticky Notes route under Governance | Makes note triage and follow-up a first-class workflow |

---

## Open implementation notes

1. Phase 2 detail pending: decide right rail activation model (click vs hover). Recommendation: click updates context; hover only previews.
2. Phase 1 detail pending: enrich compare matrix with explicit field-level diff highlighting and normalization rules.
3. Phase 4 detail pending: Bijdragekaart requires a focused design pass after relation data contracts stabilize (FR-009, FR-010).
