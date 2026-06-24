---
title: "PRD - Wendbare Wetsuitvoering"
status: draft
created: 2026-05-22
updated: 2026-05-22
intent: create
---

# Product Requirements Document: Wendbare Wetsuitvoering

## Context

Draft initialized from updated internal-alignment brief.

Stakes calibration: internal alignment.

## Problem and Objectives

### Problem

Users need to choose the right legal technology and collaborate around that choice, but current capabilities are fragmented across dashboard and documentation and governance controls are not yet explicit enough for regulated changes.

### Objectives

1. Make the dashboard and documentation the primary joint workspace for selecting appropriate legal technologies.
2. Make commenting on technologies and related documentation easy for users.
3. Enforce regulated change behavior for create, update, delete, and edit actions on tasks and technologies.
4. Support proposals as a controlled path for change requests.
5. Ensure no data is overwritten without explicit consent.

## Scope

### In Scope

1. Relation modeling and visibility for task-product input/output with technology contribution via task.
2. Dashboard-next layout update must preserve old-dashboard workspace interaction patterns while implementing Tailwind-based layout structure for technology selection, relation navigation, collaboration, and in-dashboard documentation.
3. Fact-find capability exposed as dashboard function.
4. Documentation availability in dashboard alongside separate documentation artifacts.
5. Comment handling flow for technologies/documents.
6. Security and authorization model for regulated actions.
7. Proposal workflow for controlled modifications.

### Out of Scope (Current Stakes: Internal Alignment)

1. Public launch messaging and external market positioning.
2. Final implementation design details of auth provider and infrastructure transport.

## Functional Requirements

### FR Group A: Technology Selection Experience

- FR-001: Users can discover and compare relevant legal technologies using dashboard and documentation context.
- FR-002: Users can create and view comments on technologies and related documentation from the dashboard.

### FR Group B: Governance and Regulated Change

- FR-003: The system must distinguish between proposal actions and approved mutation actions.
- FR-004: Users can submit proposals for new or changed tasks and technologies.
- FR-005: Proposal-only enforcement must be configurable by entity status.
- FR-006: Only authorized users can approve or reject proposals and execute regulated mutations.
- FR-007: Direct create, edit, delete, and modify actions on protected entities are blocked for non-authorized roles.
- FR-008: Role model for v1 must include Viewer, Proposer, Moderator, and Admin.
- FR-017: Safe default for proposal-only enforcement is status-based protection for `In Review`, `Accepted`, `Published`, `Active`, `Deprecated`, and `Archived` entities.
- FR-018: If an entity status is unknown or unmapped, the system must fail safe and treat the entity as proposal-only.
- FR-019: Direct mutations on `Draft` and `Proposed` entities are allowed only for Moderator and Admin roles and remain fully audited.

### FR Group C: Relation-Centric Modeling

- FR-009: The system records task-product relations with explicit input and output semantics.
- FR-010: For a product, users can see which tasks and technologies contribute through task links.

### FR Group D: Documentation and Comment Workflow

- FR-011: Documentation is available inside dashboard in a dedicated workspace area with explicit source separation (generated build documentation versus legal-technology documentation), while remaining available as standalone artifacts.
- FR-012: Comment lifecycle status model for v1 is fixed to New, In Review, Accepted, Rejected, and Resolved.
- FR-013: Authorized users can handle and transition comment status according to role permissions.
- FR-016: Initial in-dashboard documentation set is sourced from the generated technology documentation pipeline in `tools/generate_respec.py` and its output artifacts under `build/docs/` (with publish artifacts under `dist/`).

### FR Group E: Fact-Find in Dashboard

- FR-014: Users can invoke fact-find capability from dashboard context.
- FR-015: Fact-find results can be linked to technologies, tasks, and documents as evidence.

## Non-Functional Requirements

1. Data Integrity and Consent
- NFR-001: Overwrite policy is role-based immediate overwrite with mandatory audit trail.
- NFR-002: All overwrite operations must record actor, timestamp, target entity, previous value, new value, and action reason.

2. Security
- NFR-003: All regulated operations enforce authentication and authorization checks.

3. Auditability
- NFR-004: Proposal decisions and comment handling actions are auditable.

4. Usability
- NFR-005: Commenting and technology-selection flows are simple enough for non-technical users.

## Risks and Dependencies

1. Risk: Governance controls are underspecified.
- Impact: unauthorized changes to tasks/technologies.

2. Risk: Relation model ambiguity (task-product I/O semantics not exact).
- Impact: misleading traceability of technology contribution.

3. Risk: Comment flow unclear between free collaboration and regulated handling.
- Impact: operational friction or compliance gaps.

Dependencies:
- Updated brief in `_bmad-output/planning-artifacts/briefs/brief-wendbare wetsuitvoering-2026-05-22/brief.md`.
- Existing ontology + API + dashboard architecture.
- Existing documentation generation pipeline in `tools/generate_respec.py` and generated files in `build/docs/` and `dist/`.

## Open Questions

1. Resolved: Proposal-only baseline is confirmed as defined in FR-017, FR-018, and FR-019 for implementation start.