# Projectoverzicht

## Samenvatting

Dit project is een semantisch gedreven platform voor het beheren, verrijken en analyseren van juridische technologieën. De bron van waarheid ligt in RDF/ontologie en GraphDB, met daaromheen een Flask API, een React-dashboard en een CLI voor operationeel beheer.

## Projecttype

- Type: monorepo met meerdere toepassingsonderdelen
- Hoofdonderdelen:
  - `apps/api`
  - `apps/dashboard`
  - `apps/cli`
- Ondersteunende documentatie- en modellaag:
  - `docs/`, `model/`, `data/`, `schemas/`, `prompts/`, `queries/`

## Doel

- Juridische technologieën consistent beschrijven en ontsluiten.
- SKOS-definities beheren naast de technologiecatalogus.
- Gebruik ondersteunen via klassieke UI en natuurlijke taal.
- Data centraal beheren in GraphDB met import-, export- en synchronisatieprocessen.

## Technologiestack

| Onderdeel | Technologie | Opmerking |
|---|---|---|
| Backend API | Python, Flask, flask-smorest | REST-laag met OpenAPI-documentatie |
| CLI | Python, Click | GraphDB-beheer en import/export |
| Frontend | React 18, TypeScript, Vite | Dashboard met routering en componenten |
| Persistente laag | GraphDB, RDF/Turtle, ontologieën | Semantische opslag en validatie |
| Documentatiepijplijn | ReSpec, Jinja2, Playwright, Node.js | Genereert `dist/` en projectdocs |

## Architectuur in één zin

Een drie-lagenarchitectuur met een semantische datafundering, een servicegerichte API en een taakgericht dashboard.

## Relevante bronbestanden

- [Architectuur](../apps/ARCHITECTURE.md)
- [Phase planning](../apps/PLAN.md)
- [Project README](../README.md)
- [Typologie](typologie.md)
