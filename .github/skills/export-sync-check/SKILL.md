---
name: export-sync-check
description: 'Validate export sync behavior after API or CLI backend changes. Use for named-graph export checks, bundle path verification, endpoint checks, and pytest scope selection for export regressions.'
argument-hint: 'What changed? Example: apps/api/services/graphdb_service.py and apps/cli/commands/cli.py'
---
# Export Sync Check

Reusable workflow for validating export files and export endpoints after backend changes.

## When to Use
- API changes in apps/api that affect legal technology, organisation, GraphDB, or export routes.
- CLI changes in apps/cli that affect GraphDB import/export/sync commands.
- Shared backend changes where export artifacts or sync behavior may regress.

## Expected Outcome
- Confirmed pytest coverage for changed scope.
- Confirmed export endpoint behavior for aggregate and sync routes.
- Confirmed export artifact paths are produced and consistent with contract.
- A short pass/fail report with evidence and follow-up actions.

## Inputs
- Files changed in API and or CLI.
- Local API runtime status.
- Optional known entity IDs for spot checks.

## Procedure

1. Determine change scope from edited files.
- API-only change: paths under apps/api.
- CLI-only change: paths under apps/cli.
- Shared export change: GraphDB client/service, export routes, bundle export logic, or any API plus CLI combination.

2. Run required pytest scope from apps.
- API-only:
  - pytest tests/test_api.py tests/test_api_health.py tests/test_api_definitions.py
- CLI-only:
  - pytest tests/test_cli.py tests/test_cli_graphdb.py
- Shared export or uncertain blast radius:
  - pytest tests/test_api.py tests/test_api_health.py tests/test_api_definitions.py tests/test_cli.py tests/test_cli_graphdb.py tests/test_documentation_service.py

3. Ensure API runtime is available before endpoint checks.
- If API is already running, continue.
- If not running, start API from apps with:
  - .\\.venv\\Scripts\\python.exe -m api.routes.app

4. Validate export endpoints.
- GET /api/legaltechnologies/export/all.ttl
  - Expect HTTP 200.
  - Expect Turtle-like payload (for example @prefix present).
- POST /api/legaltechnologies/export/sync
  - Expect HTTP 200.
  - Expect JSON keys:
    - named_graph_path
    - legal_technology_bundles
    - organisation_bundles

5. Validate export artifact conventions.
- Aggregate export path exists and is non-empty:
  - data/all-legal-technologies.ttl
- Bundle directories exist:
  - data/legal-technology-bundles/
  - data/legal-technology-organisation-bundles/
- If sync reports bundle counts > 0, verify corresponding ttl files exist in the bundle directories.

6. Correlate endpoint result and filesystem result.
- Ensure named_graph_path in sync response matches expected aggregate path.
- Flag mismatch if endpoint reports success but aggregate file is missing or empty.

7. Produce a concise validation report.
- Include:
  - Changed scope classification.
  - Tests executed and result.
  - Endpoint status and key payload checks.
  - File path checks and mismatches.
  - Final verdict: pass, pass with warnings, or fail.

## Decision Rules
- If tests fail: stop and report fail with failing test summary.
- If tests pass but endpoint checks fail: report fail and prioritize API route or service diagnosis.
- If endpoint checks pass but artifacts mismatch: report pass with warnings only when mismatch is explainable and non-blocking; otherwise fail.
- If all checks pass: report pass.

## References
- Runtime and endpoint overview: [apps/README.md](../../../apps/README.md)
- Architecture boundaries: [apps/ARCHITECTURE.md](../../../apps/ARCHITECTURE.md)
- API endpoint contract list: [apps/docs/api-contracts.md](../../../apps/docs/api-contracts.md)
- Dev commands: [apps/docs/development-guide.md](../../../apps/docs/development-guide.md)
- Repo conventions: [AGENTS.md](../../../AGENTS.md)
