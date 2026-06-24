---
description: "Use when implementing dashboard or dashboard-next UI. Defines dashboard-design-spec.md as the primary baseline, sets precedence with other UI instructions, and requires spec drift handling."
name: "Dashboard Spec Authority"
applyTo: "apps/{dashboard,dashboard-next}/src/**/*.{ts,tsx,css}"
---
# Dashboard Spec Authority

Use this instruction for all dashboard UI work.

## Primary Baseline
- [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md) is the primary product and UI baseline.

## Instruction Precedence
Apply these sources in order:
1. [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md)
2. [tailwind-ui-guardrails.instructions.md](tailwind-ui-guardrails.instructions.md)
3. [tailwind-component-patterns.instructions.md](tailwind-component-patterns.instructions.md)
4. Local implementation convenience choices

If two rules conflict, follow the higher-priority source.

## Required Spec-Compliance Workflow
Before editing:
- Identify the relevant spec sections for the task (for example layout, dedicated views, route mapping, technology card, right rail, governance).

During implementation:
- Keep behavior aligned with route mapping, dedicated views, governance cues, and right-rail context rules.
- If an implementation shortcut conflicts with the spec, do not apply the shortcut.

Before finishing:
- Provide a short spec compliance note in the task summary with:
  - Spec sections checked
  - Compliance status: compliant, partial, or not applicable
  - Any intentional deviations

## Spec Drift Protocol
- If code and spec conflict, prefer the spec unless the user explicitly requests deviation.
- If the user requests deviation, implement the request and flag: spec update required.
- If the spec is ambiguous, ask one targeted clarification question before broad UI changes.

## Route Conformance Rule
- For route changes in dashboard UI, keep [../../apps/docs/dashboard-design-spec.md](../../apps/docs/dashboard-design-spec.md) route mapping aligned in the same task.
- If planned routes are implemented, update or remove the matching gap-list entries.

## PR Note Template
Use this compact format in PR notes for UI tasks:

```md
### Spec compliance
- Sections checked: <layout/route mapping/technology card/right rail/governance/...>
- Status: <compliant|partial|not applicable>
- Deviations: <none or short description>
- Spec updates required: <none or link/path to update>
```
