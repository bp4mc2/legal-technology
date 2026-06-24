# AGENTS

Agent onboarding for this repository (semantic legal-tech platform).

## Start Here
- Read [apps/README.md](apps/README.md) for runtime and endpoint overview.
- Read [apps/ARCHITECTURE.md](apps/ARCHITECTURE.md) for API/dashboard/GraphDB boundaries.
- Use [apps/docs/development-guide.md](apps/docs/development-guide.md) as the primary dev command reference.

## Project Layout (Most Relevant)
- `apps/api`: Flask API routes/services/models.
- `apps/cli`: Click CLI for GraphDB import/export/sync.
- `apps/dashboard`: React + Vite dashboard.
- `model`: ontology source files.
- `queries`: SPARQL query assets.
- `schemas`: JSON schemas used by analysis workflows.
- `prompts`: project prompt workflows used by custom agents.

## Reliable Local Commands
- API (from `apps`): `.\\.venv\\Scripts\\python.exe -m api.routes.app`
- Dashboard (from `apps/dashboard`): `npm run dev`
- Python tests (from `apps`): `pytest`
- Dashboard tests (from `apps/dashboard`): `npm run test -- --run`
- Dashboard lint (from `apps/dashboard`): `npm run lint`
- Dashboard build (from `apps/dashboard`): `npm run build`

## Data/Export Conventions
- Aggregate export: `data/all-legal-technologies.ttl`
- Bundle exports: `data/legal-technology-bundles/`
- Organisation bundles: `data/legal-technology-organisation-bundles/`
- Export sync API endpoints:
  - `GET /api/legaltechnologies/export/all.ttl`
  - `POST /api/legaltechnologies/export/sync`

## Agent Working Rules For This Repo
- Prefer minimal, targeted edits; do not refactor unrelated modules.
- Keep ontology and schema naming consistent with existing Dutch domain language.
- Link to docs instead of duplicating long architecture/process descriptions.
- Treat `apps/ontology` as a symlinked path to shared ontology sources; avoid replacing it with copied files.
- For API or CLI changes, run `pytest` from `apps`.
- For dashboard changes, run tests/lint/build in `apps/dashboard` before finishing.

## Frontend UI Instructions
- Spec-first baseline: [apps/docs/dashboard-design-spec.md](apps/docs/dashboard-design-spec.md)
  - Use this as the primary source of truth for dashboard layout, dedicated views, and route behavior before applying style and component guardrails.
- Tailwind guardrails: [.github/instructions/tailwind-ui-guardrails.instructions.md](.github/instructions/tailwind-ui-guardrails.instructions.md)
  - Use for Tailwind-first UI implementation rules, accessibility requirements, responsive behavior, and validation steps.
- Tailwind component patterns: [.github/instructions/tailwind-component-patterns.instructions.md](.github/instructions/tailwind-component-patterns.instructions.md)
  - Use for reusable patterns in cards, badges, forms, tabs, compare surfaces, and layout shells for dashboard and dashboard-next.

## Existing Custom Agent
- Legal-tech analysis subagent: [.github/agents/analyze-legal-tech.agent.md](.github/agents/analyze-legal-tech.agent.md)
- Use this when the task is: one legal technology input -> structured analysis + schema-valid JSON output files in `analyses/`.

## Additional References
- [apps/docs/project-overview.md](apps/docs/project-overview.md)
- [apps/docs/component-inventory.md](apps/docs/component-inventory.md)
- [apps/docs/api-contracts.md](apps/docs/api-contracts.md)
- [apps/docs/typologie.md](apps/docs/typologie.md)