---
project_name: 'wendbare wetsuitvoering'
user_name: 'Erwin Straver'
date: '2026-05-22'
sections_completed: ['discover', 'language_rules', 'framework_rules', 'testing_rules', 'quality_style_rules', 'workflow_rules', 'anti_pattern_rules']
status: 'completed'
scan_level: 'exhaustive'
repository_type: 'monorepo'
parts: ['apps/api', 'apps/dashboard', 'apps/cli']
---

# Projectcontext voor AI-agents

_Dit bestand bevat kritieke regels en patronen die AI-agents moeten volgen bij implementatie in dit project. Focus op niet-obvious details die fouten voorkomen._

---

## Technology Stack & versies

- Python API: Flask `>=3.0.2,<4.0.0`, flask-smorest `0.44.0`, Werkzeug `>=3.0.1,<4.0.0`
- Python CLI: Click `8.3.2`
- Frontend: React `18.2.0`, React Router `6.23.0`, Vite `^7.0.0`, TypeScript `^5.0.0`, Vitest `^4.1.2`
- Data/kennislaag: GraphDB (`http://localhost:7200`, repository `legal_technologies`), RDF/Turtle ontologie
- Documentatie/build: ReSpec `^37.1.0`, Playwright `^1.60.0`

## Kritieke implementatieregels

### Language-specifieke regels

- In `apps/dashboard` gebruik je voor HTTP-verkeer uitsluitend `apiFetch`/`apiFetchText` uit `src/utils/api.ts`; directe `fetch` in componenten is alleen toegestaan nadat de gedeelde helper is uitgebreid met gelijkwaardig foutcontract.
- Behoud in dashboard-API-calls hetzelfde foutcontract: `response.ok`-controle en statusgebaseerde foutmelding; verander dit niet ad hoc per component.
- Gebruik defensieve TypeScript-patronen voor optionele API-velden vóór renderen of mappen (guards, optionele chaining, null-checks).
- In `apps/api` blijft laagscheiding strikt: `routes` (transport), `services` (domein/SPARQL), `models` (schema’s). Verplaats geen domeinlogica naar routes.
- Elke nieuwe of gewijzigde endpoint in `apps/api/routes` krijgt een passend Marshmallow contract in `apps/api/models` en blueprint-registratie in `routes/app.py`.
- Houd API-foutgedrag consistent binnen endpointfamilies (bijv. legal technologies, definitions, organisations): voorspelbare HTTP-statussen en consistente foutboodschappen.
- SPARQL/GraphDB-querylogica hoort in service/clientlagen; routes mogen geen query-opbouw bevatten.
- Ontologie/GraphDB is leidend voor semantiek en enum-betekenis; voeg geen UI-only semantiek toe die niet in het model voorkomt.
- Wijzig je backendgedrag (route/service/schema), dan update je pytest in `apps/tests` op hetzelfde veranderoppervlak.
- Wijzig je frontendgedrag (componentinteractie/API-pad), dan update je Vitest-tests in `apps/dashboard` voor diezelfde gebruikersflow.
- Wijzig je semantische kernvelden (`gebruiksstatus`, `licentievorm`, `geschikt_voor_taak`, `ondersteuning_voor`), dan voeg je regressietests toe voor zowel validatie als serialisatie.

### Framework-specifieke regels

- Beheer dashboardroutering centraal in `apps/dashboard/src/main.tsx`; elke nieuwe user-facing route vereist een expliciete navigatiebeslissing (in `NavBar` of bewust uitgesloten met reden).
- Routewijzigingen zijn pas compleet na controle op: bestaande links, detailnavigatie en minimaal één regressietest op de gewijzigde routeflow.
- Organiseer Flask-endpoints per domein-blueprintbestand en registreer blueprints uitsluitend in `apps/api/routes/app.py`.
- Endpointwijzigingen zijn pas compleet wanneer drie controles slagen: schema-contract (`flask-smorest`), blueprintregistratie en testdekking op het gewijzigde endpointpad.
- Behoud de backendketen `route -> service -> graphdb_client/service`; directe SPARQL/infrastructuurcalls buiten service/clientlaag zijn niet toegestaan.
- Houd foutgedrag consistent binnen endpointfamilies (statuscodegebruik en foutboodschapstructuur voor vergelijkbare fouten).
- In frontendcode blijft `/api` het leidende pad voor backendverkeer; devgedrag loopt via Vite-proxy, zonder hardcoded omgevingsspecifieke backend-URL’s in componenten.
- Voor assistent-endpoints blijft payloadvorm (`query`, `language` met `nl|en`) leidend; contractuitbreiding vereist expliciete schemawijziging.
- CLI-commando’s blijven orchestrationlaag; domeinregels en transformatielogica blijven in gedeelde service- of utilitylagen.
- Framework-level wijzigingen vereisen regressietests op het geraakte vlak:
  - routering: route-overgang/zichtbaarheid
  - API-contract: request/response-validatie
  - proxy/padwijziging: frontend-naar-API integratiepad

### Testingregels

- Backendwijzigingen in `apps/api` of `apps/cli` vereisen pytest-updates in `apps/tests` op hetzelfde gedragsoppervlak (route/service/schema/command).
- Frontendwijzigingen in `apps/dashboard` vereisen Vitest-updates met Testing Library voor de geraakte gebruikersflow of componentinteractie.
- Testbestanden volgen bestaande patronen:
  - backend: `test_*.py`
  - frontend: `*.test.tsx` / `*.test.ts`
- API-tests moeten minimaal statuscode en kern-responsvorm valideren; bij validatiewijzigingen ook foutpaden (4xx) meenemen.
- Wijzigingen aan schema’s (Marshmallow) vereisen regressietests voor serialisatie en validatiegedrag.
- Semantische kernvelden (`gebruiksstatus`, `licentievorm`, `geschikt_voor_taak`, `ondersteuning_voor`) vereisen expliciete regressiedekking.
- Bij routewijzigingen moet minimaal één test de routebereikbaarheid of flow-overgang afdekken.
- Frontendtests draaien in `jsdom`-omgeving (Vite/Vitest-config); nieuwe tests moeten hiermee compatibel blijven.
- Houd tests deterministisch: vermijd verborgen omgevingsafhankelijkheden en maak API-/GraphDB-afhankelijk gedrag expliciet in assertions.
- Een wijziging is niet “af” zonder bijbehorende testaanpassing op het geraakte pad.

### Quality- en styleregels

- Volg de bestaande projectstructuur en laagscheiding; introduceer geen nieuwe abstracties zonder aantoonbare, onderbouwde noodzaak.
- Handhaaf strikte laaggrenzen: geen cross-layer shortcuts en geen directe koppelingen buiten het patroon `route -> service -> data/client`.
- Houd terminologie en veldsemantiek consistent met ontologie en domeinmodel.
- Houd wijzigingen klein en gericht per concern; combineer geen brede refactor met functionele wijziging in hetzelfde wijzigingspakket.
- Werk contract-first bij API-wijzigingen: eerst schema en responsevorm, daarna implementatie en tests.
- Compatibiliteit is standaard: elke brekende API- of schemawijziging moet expliciet, gemotiveerd en impact-beoordeeld zijn vóór merge.
- Houd foutafhandeling uniform:
  - backend: consistente statuscodes en foutstructuur per endpointfamilie
  - frontend: centrale API-foutafhandeling via gedeelde helpers
- Vermijd duplicatie van query-, validatie- en transformatielogica; hergebruik service- en utilitylagen.
- Geen silent degradation: fallbackgedrag dat fouten verbergt is niet toegestaan zonder observability (logging/metrics) en testdekking.
- Pas risicogestuurde kwaliteitsdiepte toe:
  - hoogste diepgang voor semantische kernvelden en API-contractpaden
  - lichtere diepgang alleen voor laag-risico, presentatie-only wijzigingen
- Houd documentatie synchroon bij structurele, contractuele of semantische wijzigingen.
- Definition of Done voor niet-triviale wijzigingen:
  - lint/typecheck/tests groen op geraakte onderdelen
  - regressiedekking bijgewerkt of expliciet gemotiveerde uitzondering
  - impactnotitie aanwezig: doel, geraakte keten/gebruikers, risico-effect
  - compatibiliteitsnotitie aanwezig bij API- of schemawijzigingen

### Workflowregels

- Elke wijziging start met een wijzigingshypothese: beoogd effect, geraakt domein (frontend/API/CLI/ontologie), grootste regressierisico en risiconiveau (laag/middel/hoog).
- Scope is expliciet en smal: wijzig alleen geraakt oppervlak; nevenwerk alleen als directe blocker, met korte motivatie.
- Kies workflowdiepte op basis van risico:
  - laag: minimale padtests en rationale
  - middel: volledige geraakt-padtests en contractcheck
  - hoog: uitgebreide regressie, expliciete reviewfocus en herstelplan
- Volg vaste uitvoeringsvolgorde per wijziging:
  - contract/semantiek bepalen
  - implementeren in juiste laag
  - testen op geraakt pad
  - documentatie en rationale bijwerken
- Contract en semantiek zijn leidend:
  - API/schema/veld-betekenis vastleggen vóór code-uitwerking
  - ontologie-conforme betekenis behouden bij classificaties en kernvelden
- Hard-stop regel: bij onduidelijk contract of semantische twijfel geen implementatie-doorloop tot keuze en impact zijn verduidelijkt.
- Houd laaggrenzen intact:
  - transport in routes
  - domeinlogica in services
  - infrastructuur/querylogica in data/clientlaag
- Test vroeg en gericht:
  - minimaal één regressietest per geraakt risico
  - contractwijzigingen vereisen positieve en negatieve padcontrole
  - semantische kernvelden vereisen expliciete validatie- en serialisatietests
- Maak omgevingsafhankelijkheid expliciet:
  - GraphDB/proxy/aannames zichtbaar in tests en wijzigingsnotitie
  - geen impliciete afhankelijkheid in gedrag of assertions
- Houd wijzigingssets reviewbaar:
  - één primair doel per wijzigingsset
  - geen verborgen refactors of cleanup buiten scope
- Merge-criteria zijn evidence-based:
  - geraakt pad werkt aantoonbaar (testresultaat)
  - contractconsistentie gecontroleerd
  - documentatie/rationale bijgewerkt waar relevant
  - bij hoog risico: herstel- of rollbackpad benoemd
- Sluit elke wijziging af met een korte beslisnotitie:
  - wat is gewijzigd
  - waarom deze aanpak
  - welk risico is verlaagd
  - wat bewust niet is gedaan

### Anti-patternregels

- Vermijd directe fetch-calls in dashboardcomponenten wanneer gedeelde API-helpers beschikbaar zijn.
- Vermijd domeinlogica in Flask-routes; routes blijven transportlaag.
- Vermijd SPARQL-queryopbouw buiten service/clientlagen.
- Vermijd hardcoded backend-URL’s in frontendcode; gebruik het bestaande api-pad en proxygedrag.
- Vermijd ad-hoc foutafhandeling per endpoint of component; volg uniforme foutcontracten.
- Vermijd wijzigingssets die featurewerk en brede refactor combineren zonder expliciete noodzaak en scopemotivering.
- Vermijd silent degradation: geen fallbackgedrag dat fouten verbergt zonder logging/metrics en testdekking.
- Vermijd semantische drift: wijzig geen kernveld-betekenis zonder ontologie-toets en contractcontrole.
- Vermijd testschuld: geen merge bij gewijzigd gedrag zonder regressietest of expliciet geaccordeerde uitzondering.
- Vermijd config by guess: maak GraphDB/proxy/aannames expliciet in tests en wijzigingsnotities.
- Vermijd duplicatie van validatie-, transformatie- en querylogica; centraliseer in bestaande lagen.
- Vermijd brekende API/schemawijzigingen zonder expliciete compatibiliteitsnotitie en impactduiding.
- Vermijd bypass van centrale compositiepunten (router-registratie, blueprint-registratie, gedeelde API-helper).
- Vermijd tijdelijke hacks zonder afbouwpad en eigenaar.
- Vermijd high-risk wijzigingen zonder herstel- of rollbackstrategie.
- Vermijd changes zonder aantoonbare impactkoppeling: doel, geraakte keten/gebruiker, en verwacht risico-effect moeten benoemd zijn.
