# Juridische Technologie

## Projectbeschrijving

Dit project realiseert een geïntegreerd platform voor het beheren, verrijken en analyseren van juridische technologie. Het platform gebruikt RDF-ontologie als bron van waarheid en combineert drie onderdelen:

1. Een CLI voor import/export en beheer van grafen in GraphDB.
2. Een REST API voor beheer van juridische technologieen, organisaties en SKOS-definities.
3. Een React-dashboard voor interactie, filtering, statistiek en een natural-language assistent.

De kern van het project is de koppeling tussen:

- `ontology/legal technology.ttl` voor juridische technologieen en enumeraties.
- `ontology/terms.ttl` voor SKOS-termen en definities.

Hierdoor blijft semantiek expliciet, herbruikbaar en uitbreidbaar.

## Doelstellingen

- Inzicht bieden in verschillende soorten juridische technologie (zoals Methode, Standaard en Tool).
- Juridische technologieen consistent beschrijven via ontologie-gedreven validatie en enumeraties.
- Definities volgens SKOS beheren in een aparte (named) graph.
- Bewerken en zoeken toegankelijk maken via zowel klassieke UI als natuurlijke taal (NL/EN).
- Data centraal beheren in GraphDB met duidelijke import/export-processen.

## Hoofdcomponenten

### 1. CLI (`cli/`)

Python Click CLI met GraphDB-functies:

- `load`: laad een Turtle-bestand naar GraphDB (optioneel in een specifieke named graph).
- `extract`: exporteer data uit GraphDB naar een `.ttl` bestand.
- `clear`: leeg de repository na expliciete bevestiging.

De CLI leest configuratie uit `config/graphdb.ini` en ondersteunt standaard:

- Host: `http://localhost:7200`
- Repository: `legal_technologies`

### 2. API (`api/`)

Flask + flask-smorest API met OpenAPI 3-documentatie via `/api/docs`.

Belangrijkste endpointgroepen:

- Health en basisinformatie:
	- `GET /api/health`
	- `GET /`
- Juridische technologieen:
	- `GET /api/legaltechnologies`
	- `GET /api/legaltechnologies/search?q=...`
	- `POST /api/legaltechnologies`
	- `GET|PUT|DELETE /api/legaltechnologies/<id>`
	- `GET /api/legaltechnologies/<id>/export.ttl`
	- `GET /api/legaltechnologies/<id>/export.md`
	- `GET /api/legaltechnologies/enumerations`
	- `GET /api/legaltechnologies/enumerations/<enum_name>`
	- `GET /api/legaltechnologies/stats`
- Definities (SKOS):
	- `GET|POST /api/definitions`
	- `GET|PUT|DELETE /api/definitions/<id>`
- Organisaties (herbruikbare resources):
	- `GET|POST /api/organisations`
	- `GET|PUT|DELETE /api/organisations/<iri>`
	- `GET /api/organisations/<iri>/export.ttl`
- Assistent:
	- `GET /api/assistant/status`
	- `POST /api/assistant/ask`
- Overkoepelende statistieken:
	- `GET /api/stats`

### 3. Dashboard (`dashboard/`)

React + TypeScript (Vite) frontend met onder andere:

- Overzichtspagina met statistieken en kaarten van juridische technologieen.
- Lijstweergave en bewerkflow voor juridische technologieen.
- Definitiescherm voor SKOS-definities.
- Organisatiescherm voor beheer van `lto:Organisatie` resources.
- Enumeratie-filterpaneel.
- Assistentpaneel voor natuurlijke taal (Nederlands/Engels).

Routing in de UI omvat o.a.:

- `/`
- `/legaltechnologies`
- `/organisations`
- `/assistant`
- `/enumerations`
- `/definitions`

## Technologiestack

- Python (CLI + API)
- Click `8.1.0` (CLI)
- Flask `>=3.0.2` en flask-smorest `0.44.0` (API)
- React `18.2.0`, Vite en TypeScript (Dashboard)
- GraphDB `10.8.0`
- pytest `7.2.0` en Vitest

## Repositorystructuur

- `api/`: routes, services en models voor de REST-laag
- `cli/`: command-line tooling voor GraphDB-operaties
- `dashboard/`: frontend applicatie
- `ontology/`: RDF/Turtle ontologiebestanden
- `config/`: instellingen voor GraphDB en assistent
- `tests/`: geautomatiseerde tests voor backend en CLI
- `data/`: raw en cachedata
- `core/`, `utils/`, `init/`, `logs/`: ondersteunende modules/scripts

## Installatie

### Vereisten

- Python 3.10+
- Node.js 18+
- GraphDB draaiend op geconfigureerde host/repository

### Python virtuele omgeving (.venv)

Maak eerst een virtuele omgeving aan in de projectroot:

```bash
python -m venv .venv
```

## Windows & macOS setup (directory symlink)

In deze repository verwijst `apps/ontology` **logisch** naar de gedeelde map `/model`.  
Dit wordt gerealiseerd via een **symbolic link (symlink)**.

> ⚠️ **Belangrijk:** gebruik **altijd `git clone`**.  
> Het downloaden van een ZIP vanuit GitHub ondersteunt geen symlinks.

---

### 🪟 Windows

Op Windows vereist het aanmaken en correct gebruiken van symlinks een kleine eenmalige setup.

#### Vereisten
- Windows 10 / 11
- **Developer Mode ingeschakeld**

**Developer Mode inschakelen**  
`Settings → Privacy & Security → For developers → Developer Mode`

---

#### Symlink aanmaken (PowerShell)

Open **PowerShell** en ga naar de root van de repository:

```powershell
New-Item -ItemType SymbolicLink `
  -Path apps\ontology `
  -Target .\model

Activeer daarna de omgeving:

```powershell
.venv\Scripts\Activate.ps1
```

Alternatieven per platform:

```cmd
.venv\Scripts\activate.bat
```

```bash
source .venv/bin/activate
```

### Backend en CLI dependencies

Installeer dependencies in je virtuele omgeving:

```bash
pip install -r api/requirements.txt
pip install -r cli/requirements.txt
```

### Dashboard dependencies

```bash
cd dashboard
npm install
```

## Applicatie starten

### API

Start de API via de Flask-app in `api/routes/app.py`.

```bash
python -m api.routes.app
```

Documentatie is beschikbaar op:

- `http://localhost:5000/api/docs`

### Dashboard

```bash
cd dashboard
npm run dev
```

### CLI

Voorbeelden:

```bash
python -m cli.commands.cli load --file "ontology/legal technology.ttl"
python -m cli.commands.cli extract --out export.ttl
python -m cli.commands.cli clear
```

## Testen

### Python tests

```bash
pytest
```

### Dashboard tests

```bash
cd dashboard
npm test
```

## Architectuur

Een uitgebreide beschrijving van de gelaagdheid, componenten en datastromen staat in `ARCHITECTURE.md`.
