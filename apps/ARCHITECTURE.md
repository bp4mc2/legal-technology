# ARCHITECTURE

## Doel en architectuurprincipe

De architectuur is ontworpen rond een semantische kern (RDF/ontologie) met duidelijke scheiding tussen presentatie, applicatielogica en data-opslag. De applicatie volgt een drie-lagenmodel:

1. Presentatielaag (React-dashboard)
2. API-laag (Flask REST + business services)
3. Data- en kennislaag (GraphDB + ontologieen)

Hiermee zijn semantiek, beheeroperaties en gebruikersinteractie onafhankelijk schaalbaar.

## Gelaagdheid

### 1. Presentatielaag (Dashboard)

Locatie:

- `dashboard/src`

Belangrijkste verantwoordelijkheid:

- Weergave en interactie voor eindgebruikers.
- Invoer, filtering, beheer en visualisatie van juridische technologie-data.
- Integratie met natural-language assistent.

Belangrijkste UI-componenten:

- `LegalTechnologyList` en `LegalTechnologyForm`: tonen en bewerken van juridische technologieen.
- `DefinitionsPanel`: beheer van SKOS-definities.
- `OrganisatiesPanel`: beheer van herbruikbare organisaties.
- `StatisticsPanel`: overzicht van totalen, subtypes en recente items.
- `EnumerationsFilter`: filteren op ontologie-enumeraties.
- `AssistantPanel`: natuurlijke taalinterface (NL/EN).
- `NavBar`: navigatie tussen pagina's.

Routing (React Router):

- `/` (overzicht)
- `/legaltechnologies`
- `/organisations`
- `/assistant`
- `/enumerations`
- `/definitions`

### 2. API-laag (Flask)

Locatie:

- `api/routes`
- `api/services`
- `api/models`

Belangrijkste verantwoordelijkheid:

- Exponeren van REST-endpoints.
- Validatie en serialisatie via schema's.
- Vertaling tussen HTTP-verzoeken en SPARQL-operaties.

Structuur binnen de API:

- `routes/`: endpointdefinities (transportlaag).
- `services/`: businesslogica, mapping, querybouw en data-transformatie.
- `models/`: request/response-schema's en validatieregels.

Belangrijkste endpointdomeinen:

- Health en root-informatie:
	- `GET /api/health`
	- `GET /`
- Juridische technologieen:
	- CRUD + zoek + enumeraties + export (`.ttl`, `.md`) + statistieken
- SKOS-definities:
	- CRUD op `/api/definitions`
- Organisaties:
	- CRUD op `/api/organisations` + turtle-export
- Assistent:
	- status en NL/EN queryverwerking op `/api/assistant/*`
- Globale statistieken:
	- `GET /api/stats`

OpenAPI-documentatie:

- Beschikbaar via `/api/docs` (flask-smorest).

### 3. Data- en kennislaag (GraphDB + ontologie)

Locatie:

- `ontology/legal technology.ttl`
- `ontology/terms.ttl`
- configuratie: `config/graphdb.ini`

Belangrijkste verantwoordelijkheid:

- Persistente opslag van triples.
- Semantische modellering van juridische technologieen, definities en enumeraties.
- Ondersteuning voor SPARQL query/update vanuit services.

Belangrijke ontwerpkeuzes:

- Ontologiegestuurde data-invoer en validatie.
- Aparte modellering van termen/definities (SKOS) naast juridische technologie-informatie.
- Configurabele GraphDB host/repository (standaard lokaal).

## Ondersteunende component: CLI

Locatie:

- `cli/commands/cli.py`
- `cli/commands/graphdb_utils.py`

Rol in de architectuur:

- Operationele tooling naast de API.
- Import/export/opschonen van GraphDB buiten de webinterface.

Beschikbare commando's:

- `load`: importeer Turtle in repository of named graph.
- `extract`: exporteer repository naar Turtle-bestand.
- `clear`: verwijder triples uit repository met expliciete bevestiging.

## Gegevensstroom

### 1. Beheer van juridische technologie

1. Gebruiker bewerkt data in dashboard.
2. Dashboard roept API-endpoint aan (`/api/legaltechnologies...`).
3. Route valideert input en roept service aan.
4. Service vertaalt naar SPARQL en verwerkt GraphDB-respons.
5. API retourneert genormaliseerde JSON naar dashboard.

### 2. Beheer van SKOS-definities

1. Gebruiker werkt in `DefinitionsPanel`.
2. API-routes onder `/api/definitions` verwerken CRUD.
3. `terms_service` synchroniseert met RDF-data in GraphDB.

### 3. Natural-language assistent

1. Gebruiker stuurt NL/EN prompt via dashboard.
2. API endpoint `/api/assistant/ask` verwerkt intent en parameters.
3. Service gebruikt geconfigureerde provider/runtime-instellingen.
4. Gestructureerde respons gaat terug naar UI voor vervolgstappen.

## Kwaliteit en onderhoud

- Testing:
	- Python: `pytest`
	- Dashboard: `vitest`
- Codekwaliteit:
	- Python: PEP8 + type hints + docstrings
	- Frontend: ESLint + Prettier
- Configuratie:
	- Geen aanpassing van `.env` of dotfiles zonder expliciete opdracht
	- GraphDB-instellingen via `config/graphdb.ini`

## Samenvatting

De huidige architectuur combineert:

- Een semantische datafundering (ontologie + GraphDB)
- Een modulaire API met duidelijke scheiding tussen routes/services/models
- Een taakgericht dashboard met beheer, analyse en assistentfunctionaliteit
- Een CLI voor operationeel GraphDB-beheer

Dit maakt het systeem geschikt voor verdere uitbreiding, zoals rijkere reasoning, uitgebreidere validatieregels en aanvullende gebruikersworkflows.

