---
description: "Use when implementing or updating dashboard UI with Tailwind CSS. Enforces Tailwind-first styling, accessibility, responsive behavior, and consistency guardrails for production-ready UI changes."
name: "Tailwind UI Guardrails (Dashboard)"
applyTo: "apps/{dashboard,dashboard-next}/src/**/*.{ts,tsx,css}"
---
# Tailwind UI Guardrails (Dashboard)

Use this instruction when the user asks for Tailwind CSS in dashboard UI work.

## Canonical References
- [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md)
- [../../apps/docs/development-guide.md](../../apps/docs/development-guide.md)
- [../../apps/ARCHITECTURE.md](../../apps/ARCHITECTURE.md)

## Spec Compliance Workflow
- Before editing, identify the relevant sections in [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md) (for example layout structure, dedicated views, route mapping, right rail, technology card, governance).
- During editing, keep behavior aligned with those sections; do not trade off spec behavior for convenience.
- Before finishing, include a short note with checked sections and status: compliant, partial, or not applicable.

## Spec Drift Handling
- If implementation and spec conflict, prefer [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md) unless the user explicitly requests a deviation.
- If a deviation is requested, implement it and flag: spec update required.
- If a spec section is ambiguous, ask one targeted clarification question before broad UI changes.

## Scope and System Boundaries
- Treat Tailwind as the default styling system for new or touched UI in the current task scope.
- Keep styling systems isolated per feature area: do not mix Bootstrap utility classes and Tailwind utility classes in the same component unless explicitly requested.
- Prefer migrating touched component styling to Tailwind within the same change instead of adding more ad-hoc CSS.
- Keep existing global tokens and semantic naming conventions aligned with the dashboard design spec.

## Tailwind-First Rules
- Prefer utility classes directly in JSX over new page-specific CSS files.
- Extract repeated utility combinations into small presentational components when repetition appears 3 or more times.
- Use consistent spacing and sizing scales; avoid arbitrary values unless required by spec.
- Keep class lists readable: group layout, spacing, typography, color, state classes in a stable order.

## Accessibility Guardrails
- Use semantic HTML first (button, nav, main, section, form, label).
- Interactive controls must have accessible names and visible focus states.
- Ensure keyboard usability for dialogs, menus, tabs, and form flows.
- Maintain sufficient color contrast for text, controls, and status indicators.
- Provide clear disabled, loading, success, and error states for interactive flows.

## Responsive and UX Guardrails
- Build mobile-first, then enhance with md, lg, and xl breakpoints.
- Avoid fixed heights that clip content; prefer content-driven layout with safe min and max constraints.
- Keep primary actions consistently placed and visible across breakpoints.
- Use predictable feedback patterns: skeleton or loading placeholder, empty state, error state, and recovery action.

## Performance and Maintainability
- Avoid deeply nested wrapper div structures when semantic containers are sufficient.
- Prefer reusable components over copy-pasted class blocks.
- Keep transitions subtle and purposeful; avoid decorative animation on critical workflows.
- Do not introduce a second design language inside the same screen.

## Required Validation Before Finishing
- Run from apps/dashboard when that app is touched:
  - npm run test -- --run
  - npm run build
- If only apps/dashboard-next is touched, run equivalent tests and build there.
- If validation cannot be run, explicitly state what was skipped and why.

## Completion Checklist
- Tailwind is used as the primary styling approach in touched dashboard UI.
- No unintended Bootstrap and Tailwind class mixing in the same component.
- Dashboard behavior remains aligned with the relevant sections in [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md).
- Accessibility and keyboard behavior are preserved or improved.
- Mobile and desktop layouts are both verified.
- Tests and build are run or explicitly documented as skipped.
