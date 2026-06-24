# Ontwikkelgids

## Vereisten

- Python 3.10+ voor API en CLI.
- Node.js 18+ voor dashboard en documentatiebuild.
- GraphDB beschikbaar op de geconfigureerde host.
- PowerShell op Windows voor scripts en lokale runtime.

## Installatie

### API

```powershell
cd apps\api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### CLI

```powershell
cd apps\cli
pip install -r requirements.txt
```

### Dashboard

```powershell
cd apps\dashboard
npm install
```

## Lokale start

### API

```powershell
cd apps\api
python -m api.routes.app
```

- Swagger/OpenAPI: `/api/docs`
- Healthcheck: `/api/health`

### Dashboard

```powershell
cd apps\dashboard
npm run dev
```

- Vite proxy stuurt `/api` naar `http://localhost:5000`.

### CLI

Voorbeelden:

```powershell
cd apps\cli
python -m cli.commands.cli load --file ..\..\data\some-file.ttl
python -m cli.commands.cli extract --out export.ttl
python -m cli.commands.cli sync-exports
```

## Testen

- Python tests: `pytest`
- Dashboard tests: `vitest`
- Dashboard lint: `npm run lint`
- Dashboard format: `npm run format`

## Build en documentatie

- Root build/documentatiegeneratie: `npm run build` en de scripts in `tools/`
- ReSpec-documentatie wordt via GitHub Actions gebouwd en gepubliceerd naar GitHub Pages.

## Configuratie

- GraphDB-configuratie: `apps/config/graphdb.ini`
- Aanpassing van `.env` of dotfiles gebeurt alleen expliciet.
- Dashboard API-proxy staat in `apps/dashboard/vite.config.ts`.
