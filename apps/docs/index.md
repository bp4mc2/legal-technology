# Projectdocumentatie-index

## Projectoverzicht

- **Type:** monorepo met drie hoofdonderdelen
- **Primair domein:** juridische technologie, ontologie en semantische catalogus
- **Architectuur:** semantische drie-lagenarchitectuur (dashboard, API, GraphDB) met CLI als operationele laag

## Snelle referentie

### Onderdelen

#### API
- Root: `apps/api`
- Architectuur: Flask + services + models
- Belangrijkste entrypoint: `apps/api/routes/app.py`

#### Dashboard
- Root: `apps/dashboard`
- Architectuur: React + TypeScript + Vite
- Belangrijkste entrypoint: `apps/dashboard/src/main.tsx`

#### CLI
- Root: `apps/cli`
- Architectuur: Click-commandlinehulpmiddel
- Belangrijkste entrypoint: `apps/cli/commands/cli.py`

## Gegenereerde documentatie

- [Projectoverzicht](project-overview.md)
- [Bronstructuur Analyse](source-tree-analysis.md)
- [Ontwikkelgids](development-guide.md)
- [API-contracten](api-contracts.md)
- [Datamodellen](data-models.md)
- [Componenteninventaris](component-inventory.md)
- [Architectuur - API](architecture-api.md)
- [Architectuur - Dashboard](architecture-dashboard.md)
- [Architectuur - CLI](architecture-cli.md)
- [Integratiearchitectuur](integration-architecture.md)
- [Projectonderdelen metadata](project-parts.json)

## Bestaande projectdocumentatie

- [Architectuur](../apps/ARCHITECTURE.md)
- [Faseplanning](../apps/PLAN.md)
- [Typologie](typologie.md)
- [README](../README.md)

## Startpunt voor vervolgwerk

- Gebruik [Projectoverzicht](project-overview.md) voor snel oriëntatie.
- Gebruik [Bronstructuur Analyse](source-tree-analysis.md) voor een codebase-overzicht.
- Gebruik [API-contracten](api-contracts.md) en [Datamodellen](data-models.md) voor implementatieplanning.
