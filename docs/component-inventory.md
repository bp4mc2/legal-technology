# Componenteninventaris

## Dashboardcomponenten

| Component | Type | Rol |
|---|---|---|
| `NavBar` | Navigatie | Hoofdnavigatie in de applicatie |
| `LegalTechnologyList` | Display / interactie | Lijst- en kaartweergave van juridische technologieën |
| `LegalTechnologyForm` | Formulier | Toevoegen en bewerken van technologieën |
| `LegalTechnologyDetailPage` | Detailweergave | Detailpagina per technologie |
| `StatisticsPanel` | Dashboard / inzicht | Totalen, recente items en statusoverzicht |
| `EnumerationsFilter` | Filter | Filteren op ontologie-enumeraties |
| `AssistantPanel` | Interactie / assistent | Natuurlijke taalinterface NL/EN |
| `DefinitionsPanel` | Beheer | Beheer van SKOS-definities |
| `OrganisatiesPanel` | Beheer | Beheer van herbruikbare organisaties |
| `StickyNotesPanel` | Beheer / annotatie | Sticky notes en koppelingen |
| `ColorLegend` | Hulpcomponent | Uitleg bij kleurcodering |
| `LegalTechnologyByTasktype` | Display | Groepering per taaktype |

## API-componenten

| Component | Type | Rol |
|---|---|---|
| `routes/app.py` | Entry point | Flask-app, blueprintregistratie en root-endpoints |
| `routes/legal_technology.py` | REST route | CRUD, export, enumeraties en taaktypen |
| `routes/definition.py` | REST route | CRUD voor SKOS-definities |
| `routes/organisation.py` | REST route | CRUD voor organisaties |
| `routes/assistant.py` | REST route | NL/EN assistentendpoints |
| `services/graphdb_service.py` | Business service | SPARQL, export en synchronisatie |
| `services/terms_service.py` | Business service | Definities en termen |
| `services/organisation_service.py` | Business service | Organisatiebeheer |
| `services/assistant_service.py` | Business service | Intentherkenning en responsevorming |
| `models/*.py` | Schema's | Marshmallow-validatie |

## CLI-componenten

| Component | Type | Rol |
|---|---|---|
| `cli.py` | Entry point | Click-commando's |
| `graphdb_utils.py` | Hulpmodule | GraphDB-configuratie en lage-level operaties |

## Herbruikbare elementen

- Dashboardcomponenten zijn grotendeels herbruikbaar en route-agnostisch.
- API-services bevatten de eigenlijke businesslogica.
- De ontologie en enumeraties vormen de semantische basis voor meerdere schermen en endpoints.
