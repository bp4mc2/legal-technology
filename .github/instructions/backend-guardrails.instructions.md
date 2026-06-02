---
description: "Use when editing Python backend code in apps/api or apps/cli, including GraphDB access, SPARQL query/update logic, and pytest validation for backend changes."
name: "Backend Guardrails (API and CLI)"
applyTo: "apps/{api,cli}/**/*.py"
---
# Backend Guardrails (apps/api and apps/cli)

Use this instruction for backend changes in API, CLI, and GraphDB integration.

## Canonical References
- Development commands: [../../docs/development-guide.md](../../docs/development-guide.md)
- API boundaries and layering: [../../docs/architecture-api.md](../../docs/architecture-api.md)
- CLI boundaries and responsibilities: [../../docs/architecture-cli.md](../../docs/architecture-cli.md)
- High-level runtime map: [../../apps/README.md](../../apps/README.md)
- If a referenced canonical doc is missing or contradicts the code, prefer the code as source of truth and flag the doc drift in PR notes.

## Python Rules
- Keep route, service, and model responsibilities separated.
- Limit changes to the files directly implementing the requested behavior. Do not refactor unrelated functions. If a change requires editing more than 3 files, list them in PR notes before proceeding.
- Reuse existing normalization and identifier helpers instead of adding parallel logic.
- If no suitable helper exists, add a new helper in the appropriate shared module (for example apps/api/services/graphdb_client.py or apps/cli/commands/graphdb_utils.py) rather than duplicating logic inline. Add a short docstring for the new helper.
- Use timezone-safe and ISO-safe date handling for API fields that persist as xsd:date.
- Do not hardcode GraphDB host or repository values; read through config helpers.

## GraphDB and SPARQL Rules
- Keep GraphDB HTTP calls centralized in:
  - apps/api/services/graphdb_client.py
  - apps/cli/commands/graphdb_utils.py
- In API routes, delegate SPARQL and GraphDB behavior to services; avoid requests calls in route files.
- For named-graph reads/writes, keep graph selection explicit in SPARQL GRAPH clauses.
- Do not rely on default graph URI request parameters for query behavior; query text must define graph scope.
- Escape these characters in dynamic SPARQL literals: backslash (\\), double quote (\"), newline (\n), carriage return (\r), and tab (\t). Prefer using an existing helper such as escape_sparql_literal() rather than inline escaping.
- Prefer small helper functions for recurring SPARQL fragments and mappings.

## Query and Contract Conventions
- Preserve existing Dutch domain naming and ontology vocabulary alignment.
- Keep API response field naming stable unless a contract change is explicitly requested.
- When a contract change is explicitly requested, preserve old field names alongside new ones for at least one release and mark deprecated fields in response schema docs.
- If behavior change affects query assets, update matching files in queries/ and keep query intent clear.
- For export behavior, preserve aggregate and bundle destinations:
  - data/all-legal-technologies.ttl
  - data/legal-technology-bundles/
  - data/legal-technology-organisation-bundles/

## Required Test Scope (Pytest)
Run tests from the apps directory.

- Compute the required test set by unioning all matching conditions below.
- If apps/api changed, include:
  - pytest tests/test_api.py tests/test_api_health.py tests/test_api_definitions.py
- If apps/cli changed, include:
  - pytest tests/test_cli.py tests/test_cli_graphdb.py
- If both apps/api and apps/cli changed, run both sets above.
- If any shared export-sensitive path changed, additionally include:
  - pytest tests/test_documentation_service.py
- Shared export-sensitive paths include:
  - apps/api/services/graphdb_client.py
  - apps/cli/commands/graphdb_utils.py
  - apps/api/services/bundle_export_service.py
  - apps/api/services/graphdb_service.py
  - apps/api/routes/legal_technology.py
  - apps/api/routes/organisation.py

If uncertain about blast radius, run this fallback command from the apps directory:
- pytest

## Completion Checklist
- Updated code follows route/service/model split.
- GraphDB configuration still resolves via config helpers.
- SPARQL graph scope and literal escaping are explicit.
- Required pytest scope for touched backend area is executed.
- If tests cannot be executed locally (for example GraphDB unreachable), explicitly state which tests were skipped and why in PR notes.
- Any API contract changes are reflected in docs or explicitly called out in PR notes.
