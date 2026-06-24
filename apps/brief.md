---
title: "Product Brief Update - Wendbare Wetsuitvoering"
status: draft
created: 2026-05-22
updated: 2026-05-22
intent: update
audience: internal-alignment
sources:
  - apps/PLAN.md
  - data/board-notities-alle-groepen.ttl
  - docs/project-overview.md
  - docs/project-parts.json
---

# Product Brief Update: Wendbare Wetsuitvoering

## Executive Summary

Dit document actualiseert de oorspronkelijke faseplanning naar de huidige projectrealiteit. Het project is verschoven van een primair UI/API-uitrolpad naar een bredere, semantisch-gedreven ontwikkelopgave waarin ontologie-evolutie en sticky-note-inzichten direct doorwerken in API, dashboard en dataprocessen.

De kernwijziging is dat functionele oplevering niet meer voldoende is zonder expliciete borging van semantische consistentie en change-impact per module. Daarom wordt de roadmap aangescherpt met een verplichte impactanalyse op ontologiewijzigingen, een expliciete verwerking van sticky-note-input als bronmateriaal, en een gefaseerde uitvoering per module met test-gates.

Daarnaast wordt de scope uitgebreid met productiseerbare capabilities: taak-productrelaties (input/output), dashboard layout-herziening, publish-ready authenticatie/authorisatie, fact-finding van juridische technologieen in het dashboard, en documentatie plus geautoriseerde commentaarafhandeling in dezelfde werkstroom.

Doel voor interne alignment: iedereen werkt vanuit dezelfde scope, dezelfde prioriteiten en dezelfde kwaliteitscriteria, met heldere beslismomenten tussen semantische wijzigingen en productfunctionaliteit.

## What Changed Since The Original Plan

1. Scope drift
- Oorspronkelijke focus: vooral componentintegratie en CRUD-werkstromen in dashboard/API.
- Huidige realiteit: aanvullende wijzigingen door sticky notes en bredere ontologiemutaties.

2. Input landscape changed
- PLAN is niet langer de enige bron.
- Board/sticky-notes zijn nu expliciete input voor backlog, datamodellering en validatie.

3. Risk profile changed
- Hogere kans op regressies door ontologie-impact over meerdere modules.
- Grotere afhankelijkheid tussen semantische laag, API-contracten en dashboardgedrag.

4. Publish and governance requirements added
- Publicatievoorbereiding vereist expliciete authenticatie/authorisatie.
- Documentatie wordt zowel embedded in dashboard als apart artefact beheerd, met geautoriseerde commentaarafhandeling.

## New Change Signals Incorporated

1. Relaties tussen taken en producten
- We modelleren input/output-relaties tussen taken en producten, zodat zichtbaar is welke technologie via welke taak bijdraagt aan welk product.

2. Dashboard layout update
- De hoofdlayout van het dashboard wordt herzien voor betere navigatie tussen technologieen, taken, producten, documentatie en inzichten.

3. Publish readiness
- Voor publicatie wordt security hardening opgenomen met authenticatie, authorisatie en rolgebonden acties.

4. Fact-find as product capability
- De agentfunctionaliteit voor fact-finding van juridische technologieen wordt direct beschikbaar gemaakt in het dashboard.

5. Documentation in-product + standalone
- Documentatie wordt zichtbaar in het dashboard, naast documentatie als los artefact.

6. Comments with authorization
- Gebruikers kunnen commentaar plaatsen op documenten; afhandeling, moderatie en statuswijzigingen gebeuren door geautoriseerde gebruikers.

## Problem Statement

Zonder geactualiseerde brief blijven teams op verschillende aannames werken: sommige op basis van oorspronkelijke planning, andere op basis van nieuwe sticky-note inzichten. Dit veroorzaakt scope-ruis, onduidelijke prioriteitstelling en risico op dubbel werk of semantische inconsistentie.

## Updated Product Direction

We sturen op een "semantics-first, module-by-module" uitvoeringsmodel:

1. Ontologie-impact eerst expliciet maken.
2. Wijzigingen vertalen naar API, dashboard en tests per module.
3. Pas door naar volgende module na groene teststatus.
4. Sticky-note-inzichten structureel opnemen als change-input, niet ad-hoc.
5. Taak-product-technologie relaties expliciet maken in model en UI.
6. Security en document governance als publish-gate behandelen, niet als nabehandeling.

## Users And Internal Stakeholders

Primaire interne gebruikers:
- Product/analist: bewaakt scope en prioriteit.
- API-ontwikkelaars: borgen semantische vertaling naar endpoints en contracten.
- Dashboard-ontwikkelaars: implementeren UX/CRUD/filtering op actuele semantiek.
- Data/ontologie-beheerders: leveren en valideren ontologiewijzigingen.
- QA: bewaakt regressie, contractconformiteit en end-to-end gedrag.

## Success Criteria (Internal Alignment)

1. Alignment
- Teamleden kunnen de actuele volgorde en rationale reproduceren.
- Geen conflicterende interpretaties van "wat nu eerst" tussen API en dashboard.

2. Delivery quality
- Per module: code + tests aangepast, alle relevante tests groen voordat volgende module start.
- Geen open kritieke mismatches tussen ontologie, API-contract en UI-gedrag.

3. Change traceability
- Elke significante sticky-note wijziging is terug te vinden in backlog of decision-log.
- Elke ontologiewijziging heeft zichtbare impactmapping naar minimaal API of dashboard.

## Updated Scope

In scope (nu):
- Ontologie-impactanalyse als verplichte fase 0.
- Doorvertaling naar API en dashboard met test-gates per module.
- Dashboardfundament: lijst, formulier, filters, statistiek, assistent, kleurlegenda.
- API-integraties voor zoeken, CRUD, enumeraties en statistieken.
- UX-verbeteringen, foutafhandeling, loading states, responsiviteit.
- Testuitbreiding en documentatie-update.
- Relaties tussen taak en product (input/output) inclusief traceerbare technologiebijdrage via taak.
- Dashboard layout-herziening over de volledige hoofdnavigatie.
- Integratie van fact-find agent voor juridische technologieen als dashboardfunctie.
- Documentatiepromotie naar dashboard (met separaat documentatie-artefact behouden).
- Commentaarworkflow op documenten met autorisatiegestuurde afhandeling.
- Authenticatie en authorisatie als randvoorwaarde voor publicatie.

Out of scope (voor deze update):
- Grote herontwerpen van de domeinarchitectuur buiten noodzakelijke ontologie-aanpassingen.
- Nieuwe externe kanalen/integraties buiten bestaande API/GraphDB keten.
- Volledige marktanalyse of externe productpositionering (dit is interne alignment-update).

## Delivery Approach (Reframed Phases)

### Fase A - Change Intake & Impact Mapping
- Consolidatie van PLAN + sticky-note input.
- Classificatie: semantiek, functionaliteit, UX, test/doc.
- Impactmatrix per module (api, dashboard, cli waar relevant).
- Datamodeluitbreiding voor taak-product input/output-relaties en technologie-contributiepad.

### Fase B - Semantics To Implementation
- Ontologiewijzigingen vertalen naar API-model, querylogica en contracten.
- Dashboardgedrag synchroniseren met actuele enumeraties/typen.
- API uitbreiden voor taak-productrelaties, document comments en autorisatiecontroles.

### Fase C - Feature Completion Under Guardrails
- Componenten en API-calls completeren volgens prioriteit.
- Test-gates per module, daarna pas sequenced doorgang.
- Dashboardlayout vernieuwen en fact-find agent ontsluiten als primaire gebruikersactie.
- Documentatie-view en commentaarstroom integreren in dashboardervaring.

### Fase D - Reliability & Readiness
- Versterken van foutafhandeling, feedback, toegankelijkheid en responstijden.
- Documentatie en testdekking naar afgesproken minimumniveau.
- Security en publish-readiness valideren: authenticatie, authorisatie, auditability van comment-afhandeling.

## Key Risks And Mitigations

1. Risico: Ontologie verandert sneller dan implementatie.
- Mitigatie: expliciete impactmapping + modulegewijze uitvoering met test-gates.

2. Risico: Sticky-note input blijft impliciet en diffuus.
- Mitigatie: sticky-note extractie in addendum + decision-log-traceability.

3. Risico: Featuredruk verdringt kwaliteitswerk.
- Mitigatie: "groen voor doorstroom" als harde teamafspraak.

4. Risico: Security laat toegevoegd en blokkeert publicatie.
- Mitigatie: authn/authz opnemen als expliciete acceptatiecriteria vanaf fase B.

5. Risico: Nieuwe relationele laag verhoogt modelcomplexiteit en UI-cognitieve last.
- Mitigatie: heldere relationele visualisatie, beperkte MVP-scope en contracttests op relatiepaden.

## Decisions Needed This Week

1. Wat is de minimale relationele kern voor taak-product input/output in v1?
2. Welke rolmatrix gebruiken we voor authenticatie en authorisatie (viewer/editor/moderator/admin)?
3. Welke API-contractwijzigingen zijn breaking en vragen communicatie?
4. Welke delen van de fact-find agent worden direct in dashboard-MVP opgenomen?
5. Wat is het minimale moderation-proces voor documentcommentaar bij publicatie?

## Open Questions

1. Willen we `apps/cli` in deze iteratie actief meenemen of alleen waar noodzakelijk door ontologiewijzigingen?
2. Is er een formele Definition of Done per fase/module die we kunnen hergebruiken?
3. Welke sticky-note clusters krijgen prioriteit bij conflict met bestaande planning?
4. Welke documentsoorten komen in dashboard als eerste (bijv. projectoverzicht, typologie, architectuur)?
5. Welke SLA geldt voor comment-afhandeling door geautoriseerde gebruikers?

## Vision (12-24 months)

Het platform wordt een robuuste, semantisch consistente werkomgeving waarin juridische technologieën niet alleen beheerd, maar ook duurzaam doorontwikkeld worden via een voorspelbare change-keten: ontologie -> API -> dashboard -> tests -> documentatie.
