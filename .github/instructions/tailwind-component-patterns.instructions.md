---
description: "Use when building Tailwind UI components for dashboard and dashboard-next. Defines production-ready component patterns for cards, forms, status badges, tabs, compare surfaces, and layout shells aligned with the dashboard design spec."
name: "Tailwind Component Patterns (Dashboard)"
applyTo: "apps/{dashboard,dashboard-next}/src/**/*.{ts,tsx,css}"
---
# Tailwind Component Patterns (Dashboard)

Use this instruction for component-level UI implementation details when Tailwind is used.

## Canonical References
- [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md)
- [../../apps/docs/development-guide.md](../../apps/docs/development-guide.md)
- [../../apps/ARCHITECTURE.md](../../apps/ARCHITECTURE.md)

## Spec Traceability
Map component work to spec sections explicitly:
- Layout shell -> Layout structure
- Technology card -> Technology card
- Compare bar -> Compare bar
- Right rail tabs -> Right rail - context panel
- Sticky Notes surfaces -> Dedicated views and Route mapping
- Navigation and route-coupled components -> Route mapping

Before finishing a component task, state which mapping rows were used.

## Layout Shell Patterns
- Follow the three-surface layout intent from the design spec:
  - Left navigation rail
  - Main working surface
  - Right context rail
- Prefer Tailwind grid and flex primitives for shell layout.
- Use sticky positioning only for surfaces that are explicitly persistent in the spec, such as compare bars.
- Keep shell spacing and panel rhythm consistent across pages.

## Component Patterns

### Technology Card
- Card structure should include title, short description, status badge, governance indicator, and primary actions.
- Keep action row stable: documentation, comments, compare toggle, and role-gated mutate actions.
- For selected state, use a clear affirmative visual pattern that remains accessible in high contrast mode.
- For protected entities, show a lock or proposal-required indicator without relying on color only.

### Status and Role Badges
- Use one badge primitive with variants for state and role.
- Badge variants must define text, border, and background contrast as a set.
- Keep badge sizes consistent and avoid per-page custom badge sizing.
- Unknown or fallback states must map to a safe default variant.

### Compare Selection Bar
- Implement as a sticky bottom region in the main surface.
- Always show selected items as removable chips.
- Keep the compare call-to-action disabled below minimum selection count.
- Preserve chip wrapping behavior on small screens.

### Right Rail Tabs
- Use a single tabs primitive for Documentatie, Opmerkingen, and Governance.
- Keep tab panel containers consistent in spacing and typography.
- Preserve explicit separation between technologiedocumentatie and mediadocumentatie sections.
- Comment item pattern should include author, status, snippet, and status transition actions.

### Forms and Proposal Flows
- Use label-first form fields with helper text and inline validation messages.
- Required fields must be visually and programmatically indicated.
- Error, warning, and success states must be consistent across form controls.
- Primary and secondary actions should be placed consistently at form end.

### Table and Matrix Surfaces
- For compare and relation surfaces, keep headers sticky when content scrolls.
- Use consistent row density and whitespace for scanability.
- Ensure keyboard navigation and focus visibility for interactive cells.
- Use truncation with tooltip or expand affordance for long values.

## Class Composition Rules
- Prefer predictable utility composition over ad-hoc long one-off class strings.
- Extract repeated patterns into small wrappers or shared primitives when reused 3 or more times.
- Avoid arbitrary values unless required by the design spec.
- Avoid mixing Tailwind with Bootstrap utility classes in the same component.

## Accessibility and Interaction Rules
- Every interactive control must have a visible focus ring.
- Icon-only actions require accessible labels.
- State transitions must be announced or otherwise perceivable for assistive technology users.
- Do not encode critical meaning by color alone; pair with icon or text.

## Responsive Behavior Rules
- Build mobile-first and progressively enhance at md, lg, and xl.
- Keep core actions reachable without horizontal scroll.
- Collapse secondary metadata before primary actions on small screens.
- Ensure right-rail and compare interactions remain usable on narrow layouts.

## Done Criteria
- Components match spec structure and role behavior for the touched area.
- Route-coupled components remain aligned with route mapping and dedicated views in [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md).
- Shared primitives are reused instead of duplicating class patterns.
- Accessibility requirements are met for labels, focus, and status communication.
- Responsive behavior is verified for mobile and desktop.
- Validation commands are run per the UI guardrails instruction or explicitly documented as skipped.
