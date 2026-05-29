# Deferred Work

## 2026-05-26

- Source: spec-render-catalog-markdown review (edge-case hunter)
- Item: Handle duplicate section anchors when generated markdown contains repeated section ids/titles (for example duplicate beleidskompas entries), to avoid duplicate DOM ids and ambiguous hash navigation.
- Suggested scope: normalize/suffix duplicate anchors during parse and add regression tests.

- Source: spec-render-catalog-markdown review (edge-case hunter)
- Item: Make section extraction more tolerant to minor format drift in section tags and add fallback tests for zero-sections behavior.
- Suggested scope: harden parser or use a safer structural parser for section boundaries.

## Deferred from: code review of 1-3-in-dashboard-documentation-integration.md (2026-05-26)

- Non-ASCII catalog hash anchor mismatch risk in detail-page deep link (`apps/dashboard-next/src/pages/LegalTechnologyDetailPage.tsx:75`): slug generation for catalog hash may not match backend anchor normalization for accented names.

## Deferred from: code review of 1-4-baseline-role-model-and-access-enforcement.md (2026-05-26)

- **Documentation endpoints authorization scope deferred** [apps/api/routes/legal_technology.py:206–273]: New `/api/legaltechnologies/<id>/documentation` and `/api/legaltechnologies/documentation/catalog` endpoints lack role-based guards. Deferring authorization scope decision (public vs. role-restricted) to future governance story (Epic 3/4) when authorization patterns are refined.

- **Correlation ID generation inconsistency** [apps/api/routes/legal_technology.py:208 + apps/api/services/access_policy.py:57]: Documentation endpoints generate correlation_id locally; policy layer generates independently. Not urgent if endpoints remain public; address in future refactor when authorization is added to documentation endpoints.

## Deferred from: code review of 1-7-persistent-compare-work-surface-and-selection-model.md (2026-05-28)

- Productlijst-request wordt niet geannuleerd bij sluiten van traceability workspace (`apps/dashboard-next/src/App.tsx:704`): kan leiden tot verborgen state-updates en onnodig netwerkverkeer bij snelle open/sluit-interacties.
- Timer-gedreven async testpatroon is gevoelig voor flaky gedrag onder CI-load (`apps/dashboard-next/src/App.test.tsx:719`): test vertrouwt op wall-clock wachten voor fallbackverificatie in plaats van deterministische timersturing.

## Deferred from: code review of spec-dashboard-next-workspace-shell-alignment-2.md (2026-05-29)

- Vergelijkflow moet expliciet losgekoppeld worden van de relationele product-traceability workspace; huidige gedrag gebruikt `Vergelijk selectie` nog als ingang voor traceability i.p.v. aparte vergelijkweergave.
- Comment lifecycle in de context rail moet uitbreiden van `open/resolved` naar het vereiste model `Nieuw -> In behandeling -> Geaccepteerd/Afgewezen -> Opgelost` met role-gated transities.
- Governance rail moet van placeholderniveau naar vereiste datadetail: voorsteltype, indiener, change summary, actor/action/timestamp en link naar volledige auditlog.
- Evidence-links in bijdrageketen vragen veiligheidsverharding: URL-scheme validatie (allowlist) voordat links klikbaar worden gerenderd.
