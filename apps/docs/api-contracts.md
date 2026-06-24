# API-contracten

## Overzicht

De API is een Flask REST-laag met OpenAPI-documentatie via `/api/docs`. De endpoints zijn onderverdeeld in juridische technologieën, definities, organisaties, assistent en statistieken.

## Belangrijkste endpoints

### Gezondheid en basisinformatie

- `GET /`
- `GET /api/health`
- `GET /api/stats`

### Juridische technologieën

- `GET /api/legaltechnologies`
- `GET /api/legaltechnologies/search?q=...`
- `POST /api/legaltechnologies`
- `GET /api/legaltechnologies/<id>`
- `PUT /api/legaltechnologies/<id>`
- `DELETE /api/legaltechnologies/<id>`
- `GET /api/legaltechnologies/<id>/export.ttl`
- `GET /api/legaltechnologies/<id>/export.md`
- `GET /api/legaltechnologies/export/all.ttl`
- `POST /api/legaltechnologies/export/sync`
- `GET /api/legaltechnologies/enumerations`
- `GET /api/legaltechnologies/enumerations/<enum_name>`
- `GET /api/legaltechnologies/tasktypes`

### Definities

- `GET /api/definitions`
- `POST /api/definitions`
- `GET /api/definitions/<id>`
- `PUT /api/definitions/<id>`
- `DELETE /api/definitions/<id>`

### Organisaties

- `GET /api/organisations`
- `POST /api/organisations`
- `GET /api/organisations/<iri>`
- `PUT /api/organisations/<iri>`
- `DELETE /api/organisations/<iri>`
- `GET /api/organisations/<iri>/export.ttl`

### Assistent

- `GET /api/assistant/status`
- `POST /api/assistant/ask`

### Sticky notes

- `GET /api/stickynotes`

### Governance

- `GET /api/governance/permissions`
- `GET /api/governance/proposals`
- `POST /api/governance/proposals`
- `PATCH /api/governance/proposals/<proposal_id>/status`
- `GET /api/governance/comments` (optioneel: `status`, `entityId`, `q`)
- `POST /api/governance/comments`
- `PATCH /api/governance/comments/<comment_id>/status`
- `POST /api/governance/comments/<comment_id>/escalate`
- `GET /api/governance/audit-log` (optioneel: `action`, `entityType`, `entityId`, `q`)

Governance data-opslag:

- Named graph: `https://data.bp4mc2.org/id/ltg/governance`
- Domeinontologie: `model/governance.ttl`

Header-gebaseerde identiteit en autorisatie:

- `X-User-Role`: bepaalt policy-evaluatie (`Viewer`, `Proposer`, `Moderator`, `Admin`).
- `X-Actor-Id`: actor-identiteit voor audit trail en governance mutaties.
- Bij denied acties retourneert de API `403` met zowel `correlation_id` in body als `X-Correlation-ID` header.

## Validatie

- Marshmallow schemas valideren requests en responses.
- De legal-technology schemas gebruiken genormaliseerde velden voor beschrijving, status, licentievorm, ondersteuning en taakinvulling.

## Belangrijke schema's

- `apps/api/models/legal_technology.py`
- `apps/api/models/definition.py`
- `apps/api/models/organisation.py`
- `apps/api/models/enumeration.py`
- `apps/api/routes/assistant.py`

## Opmerkingen

- De API is gekoppeld aan GraphDB via services in `apps/api/services`.
- Exporten naar Turtle en Markdown zijn expliciet onderdeel van het contract.
- De root `/` retourneert een informatieve overzichtsrespons.
- Governance data gebruikt een aparte named graph voor voorstellen, opmerkingen, audit events en rol/permissieconcepten.
