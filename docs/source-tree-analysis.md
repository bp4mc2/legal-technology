# Bronstructuur Analyse

## Hoofdboom

```text
wendbare wetsuitvoering/
├── apps/
│   ├── api/                 # Flask REST API en business services
│   ├── cli/                 # Click CLI voor GraphDB-beheer
│   ├── dashboard/           # React + TypeScript front-end
│   ├── config/              # GraphDB-configuratie
│   ├── tests/               # Python API/CLI tests
│   ├── ARCHITECTURE.md      # Systeemarchitectuur
│   └── PLAN.md              # Gefaseerde implementatieplanning
├── docs/                    # Analyse- en projectdocumentatie
├── model/                   # Ontologie en semantische kern
├── data/                    # Geëxporteerde en samengestelde Turtle-data
├── prompts/                 # Herbruikbare analyseprompts
├── queries/                 # SPARQL-queries voor analyse en export
├── schemas/                 # JSON-schema's voor legal tech output
├── tools/                   # Build- en generatiehulpmiddelen
├── templates/                # Jinja2-templates voor documentgeneratie
├── media/                   # Gebouwde documentatie en visualisaties
├── analyses/                # Per-technologie analyses in md/json
├── exports/                 # Gescopete exports en werkdocumenten
├── .github/                 # CI/workflow-definities
└── _bmad/                   # BMad-configuratie en workflowondersteuning
```

## Kritieke directories

- `apps/api`: transportlaag, services en modelvalidatie.
- `apps/dashboard`: gebruikersinteractie, zoeken, bewerken en filtering.
- `apps/cli`: operationele scripts voor import, export en synchronisatie.
- `model`: semantische basis en conceptuele ontologie.
- `data`: bundels en aggregaten met juridische technologiegegevens.
- `docs`: project- en analysekader.
- `queries`: herbruikbare SPARQL-query's voor rapportage en inspectie.
- `schemas`: JSON-schema's voor de technologie-output.
- `tools`: document- en respec-generatie.

## Entry points

- API: `apps/api/routes/app.py`
- Dashboard: `apps/dashboard/src/main.tsx`
- CLI: `apps/cli/commands/cli.py`
- Documentatiegenerator: `tools/generate_respec.py`
- Build pipeline: `build.sh` en `.github/workflows/build.yml`

## Observaties

- De repository is niet alleen een applicatie, maar ook een documentatie- en ontologieproject.
- De `apps/`-map bevat de uitvoerende onderdelen.
- De `docs/`-, `model/`- en `data/`-lagen vormen samen de kennis- en documentatiebasis.
