# Integratiearchitectuur

## Overzicht

De oplossing bestaat uit drie samenwerkende onderdelen:

1. Dashboard
2. API
3. GraphDB + ontologie

De CLI ondersteunt beheeroperaties naast deze keten.

## Gegevensstroom

### Dashboard → API

- De UI vraagt lijsten, details, filters en assistentacties op via `/api/*`.
- De Vite-devserver proxy stuurt deze calls tijdens ontwikkeling door naar de Flask API.

### API → GraphDB

- Services bouwen SPARQL-queries en update-operaties.
- GraphDB levert de semantische data, enumeraties en exportbare bundles.

### CLI → GraphDB

- Import/export en synchronisatie worden buiten de webinterface uitgevoerd.
- De CLI en API delen dezelfde configuratie voor host en repository.

## Belangrijkste integratiepunten

- `/api/legaltechnologies` voor technologiebeheer
- `/api/definitions` voor SKOS-definities
- `/api/organisations` voor herbruikbare organisaties
- `/api/assistant/*` voor natuurlijke taalverwerking
- GraphDB named graph exports voor documentgeneratie

## Architectuurkenmerk

De integratie is semantisch gestuurd: data, classificaties en validatie komen uit de ontologie, niet uit losse UI-regels of ad-hoc JSON.
