import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import { useCompareSelection } from './CompareSelectionContext';
import { useActiveTechnology } from './ActiveTechnologyContext';

const TASKTYPE_CONTEXT_EVENT = 'lt-tasktype-context';
const TASKTYPE_COMMAND_EVENT = 'lt-tasktype-command';
const RELATIONS_CONTEXT_EVENT = 'lt-relations-context';
const RELATIONS_COMMAND_EVENT = 'lt-relations-command';

type AppShellProps = {
  children: React.ReactNode;
};

const navSections = [
  {
    id: 'technologies',
    title: 'Technologies',
    links: [
      { to: '/', label: 'Overzicht' },
      { to: '/legaltechnologies', label: 'Alle technologieen' },
      { to: '/legaltechnologies/compare', label: 'Vergelijken' },
      { to: '/legaltechnologies/selection', label: 'Selectie' },
    ],
  },
  {
    id: 'documentation',
    title: 'Documentatie',
    links: [
      { to: '/definitions', label: 'Definities' },
    ],
  },
  {
    id: 'governance',
    title: 'Governance',
    links: [
      { to: '/governance/proposals', label: 'Voorstellen' },
      { to: '/governance/comments', label: 'Opmerkingen' },
      { to: '/governance/stickynotes', label: 'Sticky Notes' },
      { to: '/governance/audit-log', label: 'Auditlog' },
    ],
  },
  {
    id: 'relations',
    title: 'Verbanden',
    links: [
      { to: '/relations/tasks-products', label: 'Taken -> Producten' },
      { to: '/relations/contribution-map', label: 'Bijdragekaart' },
    ],
  },
];

type ContextCard = {
  title: string;
  copy: string;
  links?: Array<{ to: string; label: string }>;
};

type TasktypeRailContext = {
  taskGroups: Array<{ groupLabel: string; tasktypeCount: number }>;
  activeGroup: string | null;
  filters: {
    search: string;
    gebruikersgroepFilter: string;
    licentievormFilter: string;
    beschouwingsniveauFilter: string;
  };
  options: {
    gebruikersgroepen: string[];
    licentievormen: string[];
    beschouwingsniveaus: string[];
  };
  summary: {
    tasktypeCount: number;
    groupCount: number;
  };
};

type RelationsRailContext = {
  route: 'tasks-products' | 'contribution-map';
  selection: {
    taskGroupLabel?: string;
    taskTypeLabel?: string;
    productId?: string;
    productLabel?: string;
    technologyIds: string[];
    technologyNames?: string[];
  };
  metrics: {
    productCount: number;
    technologyCount: number;
    warningCount: number;
  };
  filters: Record<string, string>;
};

const getActiveNavSectionId = (pathname: string) => {
  if (pathname.startsWith('/definitions')) {
    return 'documentation';
  }
  if (pathname.startsWith('/governance')) {
    return 'governance';
  }
  if (pathname.startsWith('/relations') || pathname === '/tasktypes') {
    return 'relations';
  }
  return 'technologies';
};

const getRouteContext = (pathname: string): { title: string; subtitle: string; cards: ContextCard[] } => {
  if (pathname.startsWith('/governance/proposals')) {
    return {
      title: 'Governance: Voorstellen',
      subtitle: 'Workflow voor beoordeling en besluitvorming van voorstellen.',
      cards: [
        {
          title: 'Documentatie',
          copy: 'Koppel voorstelwijzigingen aan bron- en technologiedocumentatie.',
          links: [
            { to: '/definitions', label: 'Open Definities' },
            { to: '/legaltechnologies', label: 'Open Technologieen' },
          ],
        },
        {
          title: 'Opmerkingen',
          copy: 'Gebruik opmerkingen om beoordeling en motivatie vast te leggen.',
          links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
        },
        {
          title: 'Governance',
          copy: 'Keur voorstellen goed of af en leg besluitreden vast in auditlog.',
          links: [{ to: '/governance/audit-log', label: 'Bekijk Auditlog' }],
        },
      ],
    };
  }

  if (pathname.startsWith('/governance/comments')) {
    return {
      title: 'Governance: Opmerkingen',
      subtitle: 'Statusgestuurde commentaarworkflow over technologieen en documentatie.',
      cards: [
        {
          title: 'Documentatie',
          copy: 'Opmerkingen verwijzen naar technologie- en mediadocumentatie.',
          links: [{ to: '/definitions', label: 'Open Definities' }],
        },
        {
          title: 'Opmerkingen',
          copy: 'Volg status overgangen: Nieuw, In behandeling, Geaccepteerd, Afgewezen, Opgelost.',
        },
        {
          title: 'Governance',
          copy: 'Escalaties kunnen worden omgezet naar voorstellen voor besluitvorming.',
          links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
        },
      ],
    };
  }

  if (pathname.startsWith('/governance/stickynotes') || pathname === '/stickynotes') {
    return {
      title: 'Governance: Sticky Notes',
      subtitle: 'Zelfstandige workflow voor notities, triage en follow-up.',
      cards: [
        {
          title: 'Documentatie',
          copy: 'Gebruik bronkoppelingen wanneer sticky notes leiden tot documentatiewijzigingen.',
          links: [{ to: '/definitions', label: 'Open Definities' }],
        },
        {
          title: 'Opmerkingen',
          copy: 'Notities kunnen doorstromen naar formele opmerkingen indien nodig.',
          links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
        },
        {
          title: 'Governance',
          copy: 'Converteer open notities naar voorstellen wanneer besluitvorming vereist is.',
          links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
        },
      ],
    };
  }

  if (pathname.startsWith('/governance/audit-log')) {
    return {
      title: 'Governance: Auditlog',
      subtitle: 'Chronologische mutatieregistratie voor governance-acties.',
      cards: [
        {
          title: 'Documentatie',
          copy: 'Gebruik auditregels om documentatie-impact te herleiden.',
        },
        {
          title: 'Opmerkingen',
          copy: 'Koppel auditregels aan opmerkingen en besluitvorming voor traceerbaarheid.',
        },
        {
          title: 'Governance',
          copy: 'Auditregels ondersteunen beoordeling van voorstellen en statuswijzigingen.',
          links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
        },
      ],
    };
  }

  if (pathname.startsWith('/relations')) {
    return {
      title: 'Verbanden',
      subtitle: 'Relaties tussen taken, producten en bijdragen binnen de keten.',
      cards: [
        {
          title: 'Documentatie',
          copy: 'Relatie-inzichten kunnen onderliggende documentatie en definities verrijken.',
          links: [{ to: '/definitions', label: 'Open Definities' }],
        },
        {
          title: 'Opmerkingen',
          copy: 'Leg onduidelijke relaties vast als opmerkingen voor inhoudelijke opvolging.',
          links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
        },
        {
          title: 'Governance',
          copy: 'Escalaties op relatiekwaliteit kunnen naar voorstellen worden doorgezet.',
          links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
        },
      ],
    };
  }

  return {
    title: 'Technologies',
    subtitle: 'Context op basis van de huidige technologie- of overzichtsweergave.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Context voor de geselecteerde technologie verschijnt hier.',
        links: [{ to: '/definitions', label: 'Open Definities' }],
      },
      {
        title: 'Opmerkingen',
        copy: 'Recente opmerkingen en statusovergangen verschijnen hier.',
        links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
      },
      {
        title: 'Governance',
        copy: 'Voorstellen en auditfragmenten verschijnen hier.',
        links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
      },
    ],
  };
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const { selectedItems, selectedCount, removeSelection, clearSelection } = useCompareSelection();
  const canCompare = selectedCount >= 2;
  const missingForCompare = Math.max(0, 2 - selectedCount);
  const [tasktypeRailContext, setTasktypeRailContext] = React.useState<TasktypeRailContext | null>(null);
  const [relationsRailContext, setRelationsRailContext] = React.useState<RelationsRailContext | null>(null);
  const { activeTechnology, setActiveTechnology } = useActiveTechnology();
  const activeSectionId = getActiveNavSectionId(location.pathname);
  const routeContext = getRouteContext(location.pathname);
  const showTasktypeRailControls =
    location.pathname === '/legaltechnologies' &&
    !!tasktypeRailContext &&
    !activeTechnology;
  const isTasksProductsRoute = location.pathname === '/relations/tasks-products';
  const isTechnologyDetailRoute =
    /^\/legaltechnologies\/[^/]+$/.test(location.pathname) &&
    !location.pathname.startsWith('/legaltechnologies/compare') &&
    !location.pathname.startsWith('/legaltechnologies/selection');

  // Show tech-aware rail only on legal technology routes (not Overzicht).
  const isTechRoute =
    location.pathname === '/legaltechnologies' ||
    location.pathname.startsWith('/legaltechnologies/');
  const showTechAwareRail = isTechRoute && !!activeTechnology && !isTechnologyDetailRoute;
  const showTechDetailRail = isTechnologyDetailRoute && !!activeTechnology;
  const showRelationsRail = isTasksProductsRoute;

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<TasktypeRailContext>;
      if (!customEvent.detail) {
        return;
      }
      setTasktypeRailContext(customEvent.detail);
    };

    window.addEventListener(TASKTYPE_CONTEXT_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(TASKTYPE_CONTEXT_EVENT, handler as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (location.pathname === '/legaltechnologies') {
      setActiveTechnology(null);
    }
  }, [location.pathname, setActiveTechnology]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<RelationsRailContext>;
      if (!customEvent.detail) {
        return;
      }
      setRelationsRailContext(customEvent.detail);
    };

    window.addEventListener(RELATIONS_CONTEXT_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(RELATIONS_CONTEXT_EVENT, handler as EventListener);
    };
  }, []);

  const sendTasktypeCommand = (detail: Record<string, string>) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent(TASKTYPE_COMMAND_EVENT, { detail }));
  };

  const sendRelationsCommand = (detail: Record<string, string>) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent(RELATIONS_COMMAND_EVENT, { detail }));
  };

  const getLinkClassName = (path: string) => {
    const isActive = path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);
    return `app-rail-link${isActive ? ' is-active' : ''}`;
  };

  const hasRelationsSelection =
    !!relationsRailContext?.selection.taskTypeLabel ||
    !!relationsRailContext?.selection.productLabel;

  const railHeading = showTechDetailRail || showTechAwareRail
    ? activeTechnology!.naam
    : showRelationsRail
      ? 'Taken -> Producten'
      : routeContext.title;

  const railSubtitle = showTechDetailRail || showTechAwareRail
    ? 'Geselecteerde technologie'
    : showRelationsRail
      ? 'Route-specifieke context voor taak-product analyse'
      : routeContext.subtitle;

  return (
    <div className="app-shell">
      <NavBar />
      <div className="app-layout">
        <aside className="app-left-rail" aria-label="Primary navigation">
          {navSections.map((section) => (
            <section
              key={section.title}
              className={`app-rail-section${section.id === activeSectionId ? ' is-current-section' : ''}`}
              aria-current={section.id === activeSectionId ? 'true' : undefined}
            >
              <h3 className="app-rail-heading">{section.title}</h3>
              <div className="app-rail-links">
                {section.links.map((link) => (
                  <Link key={link.to} to={link.to} className={getLinkClassName(link.to)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </aside>

        <main className="app-main" id="main-content">
          {children}
          {selectedCount > 0 ? (
            <section className="app-compare-tray" aria-label="Vergelijkselectie">
              <div className="app-compare-tray-header">
                <div>
                  <strong>Vergelijkselectie</strong>
                  <span className="app-compare-tray-count"> {selectedCount}/4 geselecteerd</span>
                  {!canCompare ? (
                    <div className="small text-muted">Selecteer nog {missingForCompare} technologie om te vergelijken.</div>
                  ) : null}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Link to="/legaltechnologies/selection" className="btn btn-sm btn-outline-secondary">
                    Beheer selectie
                  </Link>
                  <Link
                    to="/legaltechnologies/compare"
                    className={`btn btn-sm ${canCompare ? 'btn-primary' : 'btn-outline-secondary disabled'}`}
                    aria-disabled={!canCompare}
                    onClick={(e) => {
                      if (!canCompare) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {canCompare ? 'Vergelijk nu' : 'Nog niet beschikbaar'}
                  </Link>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearSelection}>
                    Reset
                  </button>
                </div>
              </div>
              <div className="app-compare-tray-items">
                {selectedItems.map((item) => (
                  <div key={item.id} className="app-compare-chip">
                    <span>{item.naam || item.id}</span>
                    <button
                      type="button"
                      className="app-compare-chip-remove"
                      onClick={() => removeSelection(item.id)}
                      aria-label={`Verwijder ${item.naam || item.id} uit selectie`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="app-right-rail" aria-label="Context panel">
          <header className="app-context-header">
            <h2 className="app-context-heading">{railHeading}</h2>
            <p className="app-context-subtitle">{railSubtitle}</p>
          </header>

          {showTasktypeRailControls ? (
            <>
              {tasktypeRailContext.activeGroup ? (
                <div className="app-context-card">
                  <h3 className="app-context-title">Taakgroep</h3>
                  <p className="app-context-copy mb-2">
                    {tasktypeRailContext.activeGroup}
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => sendTasktypeCommand({ type: 'clearFilters' })}
                  >
                    Wis taakgroepfilter
                  </button>
                </div>
              ) : null}

              <div className="app-context-card">
                <div className="d-flex align-items-center justify-content-between">
                  <h3 className="app-context-title">Filters</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => sendTasktypeCommand({ type: 'clearFilters' })}
                  >
                    Reset
                  </button>
                </div>

                <div className="d-grid gap-2 mt-2">
                  <div>
                    <label className="lt-filter-label form-label small mb-1">Zoekterm</label>
                    <input
                      type="search"
                      className="form-control form-control-sm"
                      placeholder="Zoek..."
                      value={tasktypeRailContext.filters.search}
                      onChange={(e) => sendTasktypeCommand({ type: 'setFilter', key: 'search', value: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="lt-filter-label form-label small mb-1">Gebruikersgroep</label>
                    <select
                      className="form-select form-select-sm"
                      value={tasktypeRailContext.filters.gebruikersgroepFilter}
                      onChange={(e) =>
                        sendTasktypeCommand({
                          type: 'setFilter',
                          key: 'gebruikersgroepFilter',
                          value: e.target.value,
                        })
                      }
                    >
                      <option value="">Alle</option>
                      {tasktypeRailContext.options.gebruikersgroepen.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="lt-filter-label form-label small mb-1">Licentievorm</label>
                    <select
                      className="form-select form-select-sm"
                      value={tasktypeRailContext.filters.licentievormFilter}
                      onChange={(e) =>
                        sendTasktypeCommand({
                          type: 'setFilter',
                          key: 'licentievormFilter',
                          value: e.target.value,
                        })
                      }
                    >
                      <option value="">Alle</option>
                      {tasktypeRailContext.options.licentievormen.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="lt-filter-label form-label small mb-1">Beschouwingsniveau</label>
                    <select
                      className="form-select form-select-sm"
                      value={tasktypeRailContext.filters.beschouwingsniveauFilter}
                      onChange={(e) =>
                        sendTasktypeCommand({
                          type: 'setFilter',
                          key: 'beschouwingsniveauFilter',
                          value: e.target.value,
                        })
                      }
                    >
                      <option value="">Alle</option>
                      {tasktypeRailContext.options.beschouwingsniveaus.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {showRelationsRail ? (
            hasRelationsSelection ? (
              <>
                <div className="app-context-card">
                  <h3 className="app-context-title">Taakcontext</h3>
                  <p className="app-context-copy mb-1">
                    Taakgroep: <strong>{relationsRailContext?.selection.taskGroupLabel || 'Onbekend'}</strong>
                  </p>
                  <p className="app-context-copy mb-1">
                    Taaktype: <strong>{relationsRailContext?.selection.taskTypeLabel || 'Onbekend'}</strong>
                  </p>
                  <p className="app-context-copy mb-2">
                    {relationsRailContext?.metrics.technologyCount || 0} technologieen in context
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => sendRelationsCommand({ type: 'selectFirstTaskgroup' })}
                  >
                    Spring naar eerste taakgroep
                  </button>
                </div>

                <div className="app-context-card">
                  <h3 className="app-context-title">Productimpact</h3>
                  <p className="app-context-copy mb-2">
                    Product: <strong>{relationsRailContext?.selection.productLabel || 'Alle producten'}</strong>
                  </p>
                  {(relationsRailContext?.selection.technologyNames || []).length > 0 ? (
                    <div className="small mb-2">
                      {(relationsRailContext?.selection.technologyNames || []).slice(0, 4).join(', ')}
                      {(relationsRailContext?.selection.technologyNames || []).length > 4 ? '...' : ''}
                    </div>
                  ) : (
                    <div className="small text-muted mb-2">Nog geen impacttechnologieen geselecteerd.</div>
                  )}
                  <div className="app-context-links">
                    <Link to="/legaltechnologies" className="app-context-link">Open technologieen</Link>
                    <Link to="/definitions" className="app-context-link">Open Definities</Link>
                  </div>
                </div>

                <div className="app-context-card">
                  <h3 className="app-context-title">Governance signalering</h3>
                  <p className="app-context-copy mb-2">
                    Signalen: <strong>{relationsRailContext?.metrics.warningCount || 0}</strong>
                  </p>
                  <div className="app-context-links">
                    <Link to="/governance/proposals" className="app-context-link">Ga naar Voorstellen</Link>
                    <Link to="/governance/comments" className="app-context-link">Ga naar Opmerkingen</Link>
                    <Link to="/governance/audit-log" className="app-context-link">Ga naar Auditlog</Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="app-context-card">
                <h3 className="app-context-title">Taken {'->'} Producten context</h3>
                <p className="app-context-copy">
                  Selecteer eerst een taaktype of product om context te tonen.
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => sendRelationsCommand({ type: 'selectFirstTaskgroup' })}
                  >
                    Spring naar eerste taakgroep
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => sendRelationsCommand({ type: 'resetFilters' })}
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            )
          ) : showTechDetailRail ? (
            <>
              <div className="app-context-card">
                <h3 className="app-context-title">Op een oogopslag</h3>
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <th className="text-muted fw-normal small">Beoogde gebruikers</th>
                        <td className="small">{activeTechnology!.beoogdeGebruikers?.filter(Boolean).join(', ') || '–'}</td>
                      </tr>
                      {activeTechnology!.technologietype ? (
                        <tr>
                          <th className="text-muted fw-normal small">Technologietype</th>
                          <td className="small">{activeTechnology!.technologietype}</td>
                        </tr>
                      ) : null}
                      {activeTechnology!.typeTechnologie?.filter(Boolean).length ? (
                        <tr>
                          <th className="text-muted fw-normal small">Type technologie</th>
                          <td className="small">{activeTechnology!.typeTechnologie!.filter(Boolean).join(', ')}</td>
                        </tr>
                      ) : null}
                      <tr>
                        <th className="text-muted fw-normal small">Vorm / subtype</th>
                        <td className="small">{activeTechnology!.subtype || '–'}</td>
                      </tr>
                      <tr>
                        <th className="text-muted fw-normal small">Gebruiksstatus</th>
                        <td className="small">{activeTechnology!.gebruiksstatus || '–'}</td>
                      </tr>
                      <tr>
                        <th className="text-muted fw-normal small">Licentie</th>
                        <td className="small">{activeTechnology!.licentievorm || '–'}</td>
                      </tr>
                      <tr>
                        <th className="text-muted fw-normal small">Versie</th>
                        <td className="small">{activeTechnology!.versienummer || '–'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="app-context-card">
                <h3 className="app-context-title">Functionaliteiten</h3>
                {activeTechnology!.gebodenFunctionaliteit?.length ? (
                  <div className="d-flex flex-wrap gap-2">
                    {activeTechnology!.gebodenFunctionaliteit.filter(Boolean).map((item) => (
                      <span key={item} className="badge text-bg-light border">{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="app-context-copy text-muted mb-0">Geen functionaliteiten beschikbaar.</p>
                )}
              </div>

              <div className="app-context-card">
                <h3 className="app-context-title">Taaktypes</h3>
                {activeTechnology!.taaktypes?.length ? (
                  <div className="d-flex flex-wrap gap-2">
                    {activeTechnology!.taaktypes.filter(Boolean).map((item) => (
                      <span key={item} className="badge text-bg-light border">{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="app-context-copy text-muted mb-0">Geen taaktypes beschikbaar.</p>
                )}
              </div>

              <div className="app-context-card">
                <h3 className="app-context-title">Governance</h3>
                <p className="app-context-copy mb-2">
                  Sticky Notes horen onder governance en worden via de governance-route beheerd.
                </p>
                <div className="app-context-links">
                  <Link to="/governance/stickynotes" className="app-context-link">Open Sticky Notes</Link>
                  <Link to="/governance/comments" className="app-context-link">Ga naar Opmerkingen</Link>
                </div>
              </div>
            </>
          ) : showTechAwareRail ? (
            <>
              <div className="app-context-card">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <h3 className="app-context-title mb-0">Documentatie</h3>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                    aria-label="Deselecteer context"
                    onClick={() => setActiveTechnology(null)}
                  >
                    Wissen
                  </button>
                </div>
                <div className="fw-semibold mb-1">{activeTechnology!.naam}</div>
                {activeTechnology!.subtype ? (
                  <div className="small text-muted mb-1">{activeTechnology!.subtype}</div>
                ) : null}
                {activeTechnology!.omschrijving ? (
                  <p className="app-context-copy">{activeTechnology!.omschrijving}</p>
                ) : (
                  <p className="app-context-copy text-muted fst-italic">Geen omschrijving beschikbaar.</p>
                )}
                <div className="app-context-links">
                  <Link
                    to={`/legaltechnologies/${encodeURIComponent(activeTechnology!.id)}`}
                    className="app-context-link"
                  >
                    Open detailpagina
                  </Link>
                  <Link to="/definitions" className="app-context-link">Open Definities</Link>
                </div>
              </div>

              <div className="app-context-card">
                <h3 className="app-context-title">Opmerkingen</h3>
                <p className="app-context-copy">
                  Opmerkingen voor <strong>{activeTechnology!.naam}</strong> zijn beschikbaar in de opmerkingenwerkstroom.
                </p>
                {activeTechnology!.gebruiksstatus ? (
                  <div className="small mb-2">
                    Status: <span className="fw-semibold">{activeTechnology!.gebruiksstatus}</span>
                  </div>
                ) : null}
                <div className="app-context-links">
                  <Link to="/governance/comments" className="app-context-link">Ga naar Opmerkingen</Link>
                </div>
              </div>

              <div className="app-context-card">
                <h3 className="app-context-title">Governance</h3>
                <p className="app-context-copy">
                  Bekijk voorstellen en auditregels voor <strong>{activeTechnology!.naam}</strong>.
                </p>
                {activeTechnology!.licentievorm ? (
                  <div className="small mb-2">
                    Licentie: <span className="fw-semibold">{activeTechnology!.licentievorm}</span>
                  </div>
                ) : null}
                <div className="app-context-links">
                  <Link to="/governance/proposals" className="app-context-link">Bekijk Voorstellen</Link>
                  <Link to="/governance/audit-log" className="app-context-link">Bekijk Auditlog</Link>
                </div>
              </div>
            </>
          ) : (showTasktypeRailControls ? [] : routeContext.cards).map((card) => (
            <div key={card.title} className="app-context-card">
              <h3 className="app-context-title">{card.title}</h3>
              <p className="app-context-copy">{card.copy}</p>
              {card.links && card.links.length > 0 ? (
                <div className="app-context-links">
                  {card.links.map((link) => (
                    <Link key={link.to} to={link.to} className="app-context-link">{link.label}</Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
};

export default AppShell;
