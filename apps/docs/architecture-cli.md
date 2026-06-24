# Architectuur - CLI

## Rol

De CLI is een operationele beheerlaag naast de API. Zij ondersteunt import, export, synchronisatie en migratie van GraphDB-data zonder webinterface.

## Technologiestack

- Python
- Click
- Requests

## Belangrijkste opdrachten

- `load`: Turtle importeren in GraphDB
- `extract`: data uit GraphDB exporteren
- `download-named-graph`: volledige named graph naar Turtle wegschrijven
- `sync-exports`: lokale bundle-exports bijwerken
- `migrate-blanknodes`: legacy nodes herschrijven naar SHACL-conforme structuren
- `clear`: repository legen met expliciete bevestiging

## Belangrijke bestanden

- `apps/cli/commands/cli.py`
- `apps/cli/commands/graphdb_utils.py`

## Integratie

- Gebruikt dezelfde GraphDB-configuratie als de API.
- Werkt op dezelfde ontologische bron van waarheid als het dashboard en de API.

## Ontwerpobservatie

De CLI is vooral operationeel en scriptmatig; hij is bedoeld voor beheer, synchronisatie en herstel, niet voor eindgebruikersinteractie.
