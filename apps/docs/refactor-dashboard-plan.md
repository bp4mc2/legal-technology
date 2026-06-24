# Refactoringplan Dashboard

## Doel

Het dashboard zo structureren dat nieuwe onderdelen eenvoudig kunnen worden toegevoegd:

1. Route registreren.
2. Pagina-component maken.
3. Eventueel context-rail configureren.
4. Test toevoegen.

De bestaande functionaliteit blijft tijdens de refactor leidend. De refactor moet vooral structuur verbeteren, zonder meteen nieuw gedrag te introduceren.

## Fase 1: Route- En Navigatieconfiguratie

Introduceer een centrale configuratie, bijvoorbeeld:

```text
apps/dashboard/src/app/routes.tsx
```

Doel: `main.tsx`, linker navigatie en route-context niet langer handmatig op meerdere plekken bijwerken.

Voorbeeld:
```ts
{
  path: '/governance/proposals',
  label: 'Voorstellen',
  section: 'governance',
  element: <ProposalsPage />,
  context: {
    title: 'Governance: Voorstellen',
    subtitle: 'Workflow voor beoordeling en besluitvorming van voorstellen.',
  },
}
```

Concrete acties:

- Verplaats `navSections` uit `AppShell.tsx` naar route-/navigatieconfiguratie.
- Laat `main.tsx` routes renderen vanuit configuratie.
- Laat `AppShell` actieve sectie bepalen vanuit dezelfde configuratie.
- Behoud legacy redirects apart of markeer ze als `hidden`.

Resultaat: een nieuwe pagina toevoegen vereist minder verspreide wijzigingen.

## Fase 2: AppShell Opsplitsen
Splits `AppShell.tsx` op in kleinere layoutcomponenten.

Voorgestelde structuur:

```text
src/app/
  routes.tsx
  navigation.ts
  routeContext.ts

src/components/layout/
  AppShell.tsx
  TopBar.tsx
  LeftRail.tsx
  RightRail.tsx
  CompareTray.tsx
```

Concrete acties:
- Verplaats topbar-logica uit `NavBar.tsx` eventueel naar `layout/TopBar.tsx`.
- Verplaats linker navigatie naar `LeftRail`.
- Verplaats compare tray naar `CompareTray`.
- Verplaats rechter rail rendering naar `RightRail`.
- Houd `AppShell` verantwoordelijk voor layout-compositie, niet voor domeinlogica.

Resultaat: `AppShell` wordt een rustige layout-wrapper.

## Fase 3: Right Rail Contract Expliciet Maken
Vervang de huidige combinatie van routecondities en browser-events door een typed rail-contract.

Voorgestelde structuur:

```text
src/components/rightRail/
  RightRailProvider.tsx
  rightRailTypes.ts
  TechnologyRail.tsx
  RouteInfoRail.tsx
  TasktypeRail.tsx
  RelationsRail.tsx
```

Concrete acties:
- Maak een `RightRailContext` met `railState` en `setRailState`.
- Vervang `window.dispatchEvent('lt-tasktype-context')`.
- Vervang `window.dispatchEvent('lt-relations-context')`.
- Laat featurepagina’s hun rail-context via React context publiceren.
- Houd route-defaultcontext als fallback.

Resultaat: contextpanelen worden uitbreidbaar en type-safe.

## Fase 4: Grote Featurepagina’s Ontvlechten
Begin met LegalTechnologyByTasktype.tsx, omdat daar de meeste complexiteit zit.

Voorgestelde structuur:

```text
src/features/legalTechnologies/
  api.ts
  types.ts
  hooks/
    useLegalTechnologies.ts
    useTaskTypes.ts
    useTechnologyFilters.ts
    useGroupedTechnologies.ts
  components/
    LegalTechnologyByTasktypePage.tsx
    TechnologyTable.tsx
    TaskGroupSection.tsx
    TechnologyActions.tsx
    TechnologyFilterControls.tsx
```

Concrete acties:
- Verplaats domeintypes uit componenten naar `types.ts`.
- Verplaats API-calls naar feature-api helpers.
- Verplaats filter- en group-logica naar hooks/utilities.
- Maak presentational components voor tabellen, badges en acties.
- Houd bestaande UI eerst visueel gelijk.

Resultaat: nieuwe technologie-weergaven of filters worden goedkoper om te bouwen.

## Fase 5: Domeintypes En API Helpers Centraliseren
Voorkom dubbele types in componenten.

Voorgestelde structuur:

```text
src/domain/
  legalTechnology.ts
  governance.ts
  taskTypes.ts
  organisations.ts

src/services/
  apiClient.ts
  legalTechnologyService.ts
  governanceService.ts
  documentationService.ts
```

Concrete acties:
- Verplaats gedeelde types zoals `LegalTechnology`, `TaskType` en `GovernancePermissions`.
- Breid `apiFetch` uit naar kleine servicefuncties.
- Maak query-param helpers voor filters.
- Houd identity headers centraal.

Resultaat: minder kopieerwerk en minder kans op contractdrift met de API.

## Fase 6: Feature-Template Voor Nieuwe Onderdelen
Maak een intern patroon voor nieuwe dashboardonderdelen.

Minimaal patroon:

```text
src/features/example/
  ExamplePage.tsx
  exampleService.ts
  exampleTypes.ts
  ExamplePage.test.tsx
```

Nieuwe feature toevoegen wordt dan:
- Featuremap aanmaken.
- Pagina-component maken.
- Route registreren in `routes.tsx`.
- Optionele rail-context toevoegen.
- Test toevoegen.

Resultaat: uitbreiding wordt voorspelbaar.

## Fase 7: Testdekking Meebewegen
Per fase kleine tests aanpassen of toevoegen.
    
Prioriteit:

- Routeconfig test: alle zichtbare nav-links hebben een route.
- Shell test: juiste actieve sectie per route.
- Compare tray test blijft behouden.
- Right rail test: route fallback, actieve technologie, tasktype context, relations context.
- Feature tests voor governance en legal technologies blijven gericht.

Te draaien na dashboardwijzigingen:

```powershell
cd apps\dashboard
npm run test -- --run
npm run lint
npm run build
```

## Aanbevolen Volgorde
1. Centrale route-/navigatieconfiguratie introduceren.
2. AppShell opsplitsen zonder gedrag te wijzigen.
3. Right rail contract vervangen.
4. LegalTechnologyByTasktype refactoren.
5. Domeintypes en services centraliseren.
6. Feature-template vastleggen in korte documentatie.

## Ontwerpregel
Eerst structuur verbeteren zonder UX- of gedragswijzigingen. Daarna pas nieuwe functionaliteit toevoegen. Zo blijft de refactor controleerbaar en blijft de bestaande dashboard-design-spec leidend.

## Implementatiepatroon Nieuwe Dashboardfeatures

Gebruik de dashboard-design-spec als functionele bron van waarheid. Nieuwe onderdelen worden voortaan toegevoegd via een vast patroon:

1. Maak een featuremap onder `apps/dashboard/src/features/<featureNaam>/`.
2. Maak of hergebruik gedeelde domeintypes onder `apps/dashboard/src/domain/`.
3. Zet API-toegang in een service onder `apps/dashboard/src/services/`.
4. Registreer de route in `apps/dashboard/src/app/routes.tsx`.
5. Voeg `navVisible: true` toe wanneer de route in de linker navigatie moet verschijnen.
6. Kies de juiste `section`: `technologies`, `documentation`, `governance` of `relations`.
7. Voeg route-context toe via `apps/dashboard/src/app/routeContext.ts` wanneer de standaardcontext niet volstaat.
8. Publiceer optionele right-rail state via `useRightRail()` in plaats van `window.dispatchEvent`.
9. Voeg minimaal een routeconfig- of featuretest toe.

Voorbeeld voor een toekomstige `Bijdragekaart`:

```tsx
{
  path: '/relations/contribution-map',
  label: 'Bijdragekaart',
  section: 'relations',
  element: <ContributionMapPage />,
  context: routeContexts.relations,
  navVisible: true,
}
```

Right-rail state gebruikt een typed contract met varianten voor:

- `routeInfo`
- `technology`
- `technologyDetail`
- `tasktype`
- `relations`

Featurepagina's mogen rail-context zetten, maar de shell bepaalt of die context zichtbaar is voor de actuele route. Hierdoor kan stale state geen verkeerde rail op een andere route tonen.
