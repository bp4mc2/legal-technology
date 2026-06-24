# Right Rail Context Specification

Last updated: 2026-06-01
Scope: apps/dashboard right rail behavior by selected menu item/route.
Primary baseline: apps/docs/dashboard-design-spec.md
Companion plan: apps/PLAN.md

## Purpose

Define exactly which context the right rail needs for each selected menu item, what source provides that context, and what empty-state fallback should be shown when context is missing.

## Context primitives

- routeContext: static route-level context (title/subtitle/default cards).
- activeTechnology: last active technology selected by user interaction.
- compareSelection: compare selection context (ids + metadata).
- tasktypeContext: task group/task type/filter context from Alle technologieen route.
- relationsContext: route-specific context for relation flows (Taken -> Producten, Bijdragekaart).

## Source-of-truth priorities

1. Route-specific context for the active route (if available).
2. activeTechnology (for technology/gov/doc contexts where relevant).
3. routeContext fallback (safe generic cards and links).

## Context matrix by menu item

| Menu item | Route | Required context | Main source | Right rail behavior | Empty-state fallback |
|---|---|---|---|---|---|
| Overzicht | / | routeContext | routeContext | Always show Overview guidance cards (never entity-aware on this route) | Overview guidance cards |
| Alle technologieen | /legaltechnologies | task groups, filters, optional selected taakgroep | tasktypeContext | Show Filters always; show Taakgroep card only when a taakgroep is actively selected | Show Filters-only rail when no taakgroep is selected |
| Vergelijken | /legaltechnologies/compare | compareSelection + optional activeGroup | compareSelection (+ compare page state events) | Show compare guidance, diff interpretation hints, selection shortcuts | Explain minimum 2 selections and link to Selectie |
| Selectie | /legaltechnologies/selection | compareSelection | compareSelection | Show selected count, next actions, compare readiness | Show selection-empty guidance |
| Definities | /definitions | Optional activeTechnology | activeTechnology + routeContext | Show doc links for selected technology and terminology anchors | Generic definities guidance |
| Voorstellen | /governance/proposals | optional activeTechnology + governance filters | governance route context (+ activeTechnology) | Show proposal queue context and selected technology impact links | Generic proposal workflow cards |
| Opmerkingen | /governance/comments | optional activeTechnology + comment filters | governance route context (+ activeTechnology) | Show comment workflow + selected technology references | Generic comments workflow cards |
| Auditlog | /governance/audit-log | optional activeTechnology + timeline filter state | governance route context (+ activeTechnology) | Show audit traceability for selected entity when present | Generic audit guidance cards |
| Sticky Notes | /governance/stickynotes | optional activeTechnology | governance route context (+ activeTechnology) | Show sticky note actions + optional technology scoping | Generic sticky notes guidance |
| Taken -> Producten | /relations/tasks-products | selected taskgroep, selected taaktype, selected product, related technologies | relationsContext (route-specific events/state) | Dedicated cards: Taakcontext, Productimpact, Governance signalering; no generic governance copy | Route-specific empty state prompting task/product selection |
| Bijdragekaart | /relations/contribution-map | selected node/edge/product/technology | relationsContext | Show contribution details and drill-through links | Explain how to select nodes/relations |

## Dedicated requirements for Taken -> Producten

This route must not reuse generic governance/relation card copy.

Required right-rail cards:

1. Taakcontext
- Show selected taakgroep and taaktype.
- Show counts for related products and technologies.
- Link: open selected taaktype section in main surface.

2. Productimpact
- Show selected product (or nearest focus product) and impacted technologies.
- Link: navigate to impacted technology details.

3. Governance signalering
- Show quality warnings (missing mapping, conflicting relations, stale entries).
- Links: Voorstellen, Opmerkingen, Auditlog filtered by selected context.

Required empty state (route-specific):
- Message: selecteer eerst een taaktype of product om context te tonen.
- Actions: spring naar eerste taakgroep, reset filters.

## Event and state contract (implementation guidance)

Current custom events already used:
- lt-tasktype-context
- lt-tasktype-command

Add for relation routes:
- lt-relations-context
- lt-relations-command

Suggested lt-relations-context payload:

```ts
{
  route: 'tasks-products' | 'contribution-map';
  selection: {
    taskGroupLabel?: string;
    taskTypeLabel?: string;
    productId?: string;
    productLabel?: string;
    technologyIds: string[];
  };
  metrics: {
    productCount: number;
    technologyCount: number;
    warningCount: number;
  };
  filters: Record<string, string>;
}
```

## Acceptance criteria

- Right rail content differs by route and context, not only by generic section.
- Overzicht route always renders overview guidance cards and does not switch to activeTechnology cards.
- Alle technologieen renders taakgroep context only when a taakgroep is selected.
- Taken -> Producten uses dedicated right-rail cards and actions.
- Each menu item has defined required context and fallback behavior.
- No misleading generic placeholders when a specific route context is available.

## Test scenarios (minimum)

1. Overzicht: right rail always shows overview guidance cards even when activeTechnology exists.
2. Alle technologieen: without selected taakgroep, rail shows Filters-only behavior.
3. Alle technologieen: selecting a taakgroep shows taakgroep context card and linked actions.
4. Technology selection: right rail switches from generic to entity-aware cards.
5. Taken -> Producten without selection: route-specific empty state appears.
6. Taken -> Producten with selection: Taakcontext/Productimpact/Governance cards populate.
7. Governance routes with activeTechnology: links include correct deep-link targets.
