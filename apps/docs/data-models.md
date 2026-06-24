# Datamodellen

## Kernmodel

De applicatie modelleert juridische technologieën als RDF-gedreven resources met genormaliseerde velden voor:

- naam en beschrijving
- gebruiksstatus en licentievorm
- geboden functionaliteit
- beoogde gebruikers
- ondersteuning per beschouwingsniveau en modelsoort
- taakinvulling
- bronverwijzing en documentatie
- optionele relatie- en organisatiekoppelingen

## Belangrijkste modellen

### LegalTechnology

Bron:
- `apps/api/models/legal_technology.py`

Kenmerkende onderdelen:
- `id`, `iri`, `naam`, `omschrijving`
- `subtype`, `versienummer`, `versiedatum`, `versiebeschrijving`
- `gebruiksstatus`, `licentievorm`, `normstatus`
- `geboden_functionaliteit`, `beoogde_gebruikers`
- `ondersteuning_voor`, `geschikt_voor_taak`
- `documentatie`, `bronverwijzing`, `relaties`
- `beheerder`, `leverancier`, `type_technologie`

### Definition

Bron:
- `apps/api/models/definition.py`

Gebruik:
- SKOS-definities met label, definitie, scope note en relationele context.

### Organisation

Bron:
- `apps/api/models/organisation.py`

Gebruik:
- Herbruikbare organisatie-resource met IRI, naam en contactinformatie.

### Enumeration

Bron:
- `apps/api/models/enumeration.py`

Gebruik:
- Genormaliseerde lijsten voor functionaliteiten, technologietypen, taaktypen, normstatussen, gebruiksstatussen en licentievormen.

## Opslaglaag

- De semantische data ligt in GraphDB.
- Ontologie en termen worden apart beheerd in RDF/Turtle.
- De CLI en API gebruiken dezelfde bron van waarheid.

## Validatieregels

- Verplichte kernvelden zijn o.a. `naam`, `omschrijving`, `gebruiksstatus`, `licentievorm` en minimaal één taakinvulling.
- Ondersteuning en taakinvulling moeten intern consistent zijn.
- Boolean-achtige of enumeratievelden worden via de ontologie en schema's geconstrueerd.
