# Architectuur - Dashboard

## Rol

Het dashboard is de interactielaag voor eindgebruikers. Het ondersteunt overzicht, zoeken, filteren, bewerken, analyseren en natuurlijke taalinteractie.

## Technologiestack

- React 18
- TypeScript
- Vite
- React Router
- Bootstrap
- Vitest en Testing Library

## Architectuurpatroon

- Component-gedreven single-page application
- Route-gebaseerde pagina's met herbruikbare UI-componenten
- API-clientlaag in `src/utils`

## Belangrijkste onderdelen

- `main.tsx`: applicatie-opbouw en routering
- `components/`: schermen, panelen en herbruikbare UI
- `styles/`: globale styling
- `utils/`: API-hulpfuncties en ondersteunende logica

## Kerngebruik

- Overzicht van juridische technologieën.
- Toevoegen en wijzigen via formulieren.
- Filteren op enumeraties en taaktypen.
- Assistentvragen in NL/EN.
- Sticky notes en organisatiebeheer.

## Belangrijke entrypoint

- `apps/dashboard/src/main.tsx`

## Integratie

- Roept de Flask API aan via `/api`.
- Gebruikt navigatie naar overzicht, technologieën, taaktypen, definities, organisaties, enumeraties, assistent en sticky notes.

## Ontwerpobservatie

De UI is functioneel rijk en sterk gekoppeld aan het semantische model in de backend; componenten tonen niet alleen data, maar ook ontologie-gedreven classificaties.
