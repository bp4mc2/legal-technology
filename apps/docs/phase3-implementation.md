## Plan: Phase 3 Governance Backend Completion
Status: Completed on 2026-06-02 (ontology + governance API + authorization seam + dashboard API integration + tests/docs updates).

Deliver full Phase 3 completion by adding a governance + authorization ontology in a new named graph, implementing API routes/services for proposals/comments/audit events, enforcing role-based authorization server-side, and wiring dashboard governance pages from mock data to real API responses. This follows existing route-service-model + access_policy patterns already used in API and sticky notes.

**Steps**
1. Phase A - Contract and ontology baseline
1.1 Define canonical governance domain contract for proposals, comments, audit events, status lifecycles, and role/permission links (depends on none).
1.2 Create new model ontology file under model/ for governance + authorization classes/properties/shapes using board-notities.ttl and juridische technologie.ttl style as template (depends on 1.1).
1.3 Define named graph URI for governance data and document it in API docs and architecture docs (depends on 1.1, parallel with 1.2).
2. Phase B - Backend data layer
2.1 Add governance service module with SPARQL query/update helpers scoped explicitly to the governance graph (depends on 1.2).
2.2 Implement CRUD/workflow functions for:
- proposals list/create/get + approve/reject/withdraw transitions
- comments list/create/update status + escalate to proposal
- audit events append/query with filter support
(depends on 2.1)
2.3 Extend access policy action map with governance and authorization actions (depends on 2.2; parallel with 2.4).
2.4 Add role resolution helper layer that remains header-based for now (X-User-Role / X-Actor-Id), but centralizes future identity integration seam (depends on none, integrates into 2.3).
3. Phase C - API routes and schemas
3.1 Add route blueprint for /api/governance with subpaths for proposals, comments, and audit-log using flask-smorest and marshmallow schemas (depends on 2.2).
3.2 Register governance blueprint in app bootstrap and add endpoint entries to root index and api-contract docs (depends on 3.1).
3.3 Add input/output schema models for governance payloads and status transitions, including validation of allowed transitions and required fields (depends on 3.1).
4. Phase D - Frontend integration
4.1 Replace mock data in governance pages with calls via dashboard api utility to new endpoints (depends on 3.1).
4.2 Keep role-gated UI actions visible and disabled/enabled based on returned permissions while backend remains source of truth for enforcement (depends on 3.3).
4.3 Add loading, empty, and error states per page for API-backed governance data (depends on 4.1).
5. Phase E - Testing and documentation quality gate
5.1 Add/extend pytest coverage for governance endpoints, role-deny cases, correlation-id behavior, and workflow transitions (depends on 3.2).
5.2 Add frontend tests for governance page rendering with API data and key interaction states (depends on 4.3).
5.3 Update docs references and PLAN phase criteria to mark completion only when ontology + API + auth checks + tests pass (depends on 5.1 and 5.2).

**Parallelism and dependencies**
- Can run in parallel: 1.3 with 1.2; 2.3 with 2.4; portions of 5.1 while 4.x is in progress.
- Hard blockers:
- 1.2 blocks backend SPARQL model assumptions.
- 2.2 blocks API route implementation.
- 3.x blocks frontend API switch-over.

**Relevant files**
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/model/board-notities.ttl - ontology and SHACL pattern reference for classes/properties/status collections.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/model/juridische technologie.ttl - domain naming/style reference.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/api/services/access_policy.py - role/action enforcement map and deny response behavior.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/api/services/sticky_notes_service.py - named-graph SPARQL service pattern.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/api/routes/sticky_notes.py - route + schema + policy gate pattern.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/api/routes/app.py - blueprint registration and root endpoint catalog.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/tests/test_api.py - API policy and endpoint test conventions.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/dashboard/src/components/ProposalsPage.tsx - currently mock data, to be API-backed.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/dashboard/src/components/CommentsPage.tsx - currently mock data, to be API-backed.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/dashboard/src/components/AuditLogPage.tsx - currently mock data, to be API-backed.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/dashboard/src/utils/api.ts - frontend API helper reuse.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/docs/api-contracts.md - update governance endpoint contracts.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/docs/architecture-api.md - update governance/auth architecture responsibilities.
- c:/Users/Erwin Straver/projects/wendbare wetsuitvoering/apps/PLAN.md - phase status and exit criteria.

**Verification**
1. Backend tests from apps/: pytest tests/test_api.py tests/test_api_health.py tests/test_api_definitions.py tests/test_documentation_service.py (plus new governance-specific tests if split into new file).
2. Targeted API checks:
- GET/POST/PATCH governance endpoints return schema-valid payloads.
- Role-denied governance actions return 403 with correlation_id and X-Correlation-ID consistency.
- Allowed roles can perform configured transitions; invalid transitions return 400.
3. Dashboard checks from apps/dashboard:
- npm run test -- --run
- npm run build
- npm run lint
4. Manual checks:
- governance routes load with API data and filters
- actions are correctly gated per role headers
- audit timeline updates after proposal/comment actions

**Decisions**
- Use a new named graph for governance + roles data.
- Keep header-based role source in this phase (X-User-Role/X-Actor-Id), with an explicit extension seam for later identity integration.
- Scope target is full production completion for Phase 3, not MVP-only.

**Scope boundaries**
- Included: governance ontology/model/ttl, roles/authorization ontology/model/ttl, governance API, authorization checks for governance actions, frontend integration away from mocks, tests/docs updates.
- Excluded: external identity provider integration, non-governance domain refactors, unrelated dashboard redesign work.

**Further considerations**
1. Decide whether authorization concepts are stored in the same governance graph or split to a separate auth graph; recommendation: start same graph for simpler joins, split later only if governance scale requires it.
2. Define transition matrix early (proposal and comment statuses) to prevent route and UI drift; recommendation: codify matrix in one backend module referenced by both API validation and tests.
3. Confirm audit immutability policy (append-only vs corrective edits); recommendation: append-only events with optional correction event type.