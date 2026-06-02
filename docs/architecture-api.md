# Architectuur - API

## Rol

De API-laag is de service- en transportlaag tussen UI/CLI en GraphDB. Zij vertaalt HTTP-verzoeken naar semantische opslagoperaties en normaliseert de respons.

## Technologiestack

- Python
- Flask
- flask-smorest
- Marshmallow
- Requests

## Architectuurpatroon

- REST-georiënteerde service layer
- Duidelijke scheiding tussen routes, services en models
- SPARQL-gedreven data-operaties

## Belangrijkste onderdelen

- `routes/`: endpointdefinities en request/responsecontracten
- `services/`: businesslogica, querybouw, export en synchronisatie
- `models/`: schema-validatie en serialisatie

## Kernverantwoordelijkheden

- Juridische technologieën CRUD'en, zoeken, exporteren en synchroniseren.
- SKOS-definities en organisaties beheren.
- Assistentvragen verwerken.
- Statistieken leveren.

## Belangrijke entrypoint

- `apps/api/routes/app.py`

## Integratie

- Stuurt data naar en haalt data op uit GraphDB.
- Wordt aangeroepen door het dashboard via `/api/*`.
- Wordt ook via de CLI gebruikt voor beheeroperaties.

## Ontwerpobservatie

De API is semantisch rijker dan een standaard CRUD-backend: de responsevorm is afgeleid van ontologie, enumeraties en bundle exports.
