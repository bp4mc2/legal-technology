import React from 'react';
import { Link } from 'react-router-dom';

import AuditLogPage from '../components/AuditLogPage';
import CommentsPage from '../components/CommentsPage';
import ComparePage from '../components/ComparePage';
import DefinitionsPanel from '../components/DefinitionsPanel';
import DocumentationHubPage from '../components/DocumentationHubPage';
import EnumerationsFilter from '../components/EnumerationsFilter';
import LegalTechnologyDetailPage from '../components/LegalTechnologyDetailPage';
import OrganisatiesPanel from '../components/OrganisatiesPanel';
import ProposalsPage from '../components/ProposalsPage';
import StatisticsPanel from '../components/StatisticsPanel';
import StickyNotesPanel from '../components/StickyNotesPanel';
import TasksProductsPage from '../components/TasksProductsPage';
import { useCompareSelection } from '../components/CompareSelectionContext';
import { routeContexts, type RouteContext } from './routeContext';
import LegalTechnologyByTasktypePage from '../features/legalTechnologies/LegalTechnologyByTasktypePage';
import PolicyCyclePage from '../components/PolicyCyclePage';

export type NavSectionId = 'technologies' | 'documentation' | 'governance' | 'relations';

export type DashboardRoute = {
  path: string;
  label: string;
  section: NavSectionId;
  element?: React.ReactElement;
  context: RouteContext;
  navVisible: boolean;
  redirectTo?: string;
};

export const navSectionTitles: Record<NavSectionId, string> = {
  technologies: 'Technologies',
  documentation: 'Documentatie',
  governance: 'Governance',
  relations: 'Verbanden',
};

function OverviewPage() {
  return (
    <div className="overview-layout">
      <div className="overview-main">
        <section className="page-card page-card--flush overview-block">
          <h2 className="page-heading">Statistieken</h2>
          <StatisticsPanel />
        </section>
      </div>
    </div>
  );
}

function LegalTechnologiesPage() {
  return (
    <div className="page-card page-card--xxl">
      <h2 className="page-heading">Alle technologieen (met taken)</h2>
      <LegalTechnologyByTasktypePage contextMode="right-rail" />
    </div>
  );
}

function EnumerationsPage() {
  return (
    <div className="page-card page-card--sm">
      <h2 className="page-heading">Filter op Enumeraties</h2>
      <EnumerationsFilter />
    </div>
  );
}

function DefinitionsPage() {
  return (
    <div className="page-card page-card--md">
      <DefinitionsPanel />
    </div>
  );
}

function DocumentationPage() {
  return (
    <div className="page-card page-card--xxl">
      <DocumentationHubPage />
    </div>
  );
}

function OrganisatiesPage() {
  return (
    <div className="page-card page-card--md">
      <h2 className="page-heading">Organisaties</h2>
      <OrganisatiesPanel />
    </div>
  );
}

function StickyNotesPage() {
  return (
    <div className="page-card page-card--xxl">
      <h2 className="page-heading">Sticky Notes</h2>
      <StickyNotesPanel />
    </div>
  );
}

function SelectionPage() {
  const { selectedItems, removeSelection, clearSelection, selectedCount } = useCompareSelection();
  const canCompare = selectedCount >= 2;

  const primaryButtonClass =
    'inline-flex items-center rounded-md border border-lt-primary bg-lt-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';
  const secondaryButtonClass =
    'inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';
  const dangerButtonClass =
    'inline-flex items-center rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';

  if (selectedCount === 0) {
    return (
      <section className="rounded-lt border border-lt-border bg-lt-card p-5 shadow-lt sm:p-6">
        <h2 className="text-lg font-semibold text-lt-heading">Selectie</h2>
        <p className="mt-3 text-sm text-lt-muted">Nog geen technologieen geselecteerd voor vergelijking.</p>
        <p className="mt-2 text-sm text-lt-muted">Selecteer 1 tot 4 technologieen in de weergave Alle technologieen (met taken).</p>
        <Link to="/legaltechnologies" className={`${primaryButtonClass} mt-4`}>
          Ga naar Alle technologieen
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lt border border-lt-border bg-lt-card p-5 shadow-lt sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-lt-heading">Selectie</h2>
        <button type="button" className={dangerButtonClass} onClick={clearSelection}>
          Selectie leegmaken
        </button>
      </div>
      <p className="text-sm text-lt-muted">Geselecteerde technologieen: {selectedCount}/4</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Link
          to="/legaltechnologies/compare"
          className={canCompare ? primaryButtonClass : `${secondaryButtonClass} cursor-not-allowed opacity-60`}
          aria-disabled={!canCompare}
          onClick={(e) => {
            if (!canCompare) {
              e.preventDefault();
            }
          }}
        >
          Vergelijk selectie
        </Link>
        {!canCompare ? <small className="text-sm text-lt-muted">Selecteer nog 1 technologie om te vergelijken.</small> : null}
      </div>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Geselecteerde technologieen">
        {selectedItems.map((item) => (
          <li
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full border border-lt-primaryBorder bg-lt-primarySoft px-3 py-1.5 text-sm font-medium text-lt-text"
          >
            <span>{item.naam || item.id}</span>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary"
              onClick={() => removeSelection(item.id)}
              aria-label={`Verwijder ${item.naam || item.id} uit selectie`}
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-card page-card--md">
      <h2 className="page-heading">{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export const dashboardRoutes: DashboardRoute[] = [
  { path: '/', label: 'Overzicht', section: 'technologies', element: <OverviewPage />, context: routeContexts.technologies, navVisible: true },
  { path: '/capabilities', label: 'Beleidscyclus', section: 'technologies', element: <PolicyCyclePage />, context: routeContexts.technologies, navVisible: true },
  { path: '/legaltechnologies', label: 'Alle technologieen', section: 'technologies', element: <LegalTechnologiesPage />, context: routeContexts.technologies, navVisible: true },
  { path: '/legaltechnologies/compare', label: 'Vergelijken', section: 'technologies', element: <ComparePage />, context: routeContexts.technologies, navVisible: true },
  { path: '/legaltechnologies/selection', label: 'Selectie', section: 'technologies', element: <SelectionPage />, context: routeContexts.technologies, navVisible: true },
  { path: '/legaltechnologies/:id', label: 'Technologie detail', section: 'technologies', element: <LegalTechnologyDetailPage />, context: routeContexts.technologies, navVisible: false },

  { path: '/documentation', label: 'Documentatiehub', section: 'documentation', element: <DocumentationPage />, context: routeContexts.documentation, navVisible: true },
  { path: '/definitions', label: 'Definities', section: 'documentation', element: <DefinitionsPage />, context: routeContexts.documentation, navVisible: true },

  { path: '/governance/proposals', label: 'Voorstellen', section: 'governance', element: <ProposalsPage />, context: routeContexts.proposals, navVisible: true },
  { path: '/governance/comments', label: 'Opmerkingen', section: 'governance', element: <CommentsPage />, context: routeContexts.comments, navVisible: true },
  { path: '/governance/stickynotes', label: 'Sticky Notes', section: 'governance', element: <StickyNotesPage />, context: routeContexts.stickyNotes, navVisible: true },
  { path: '/governance/audit-log', label: 'Auditlog', section: 'governance', element: <AuditLogPage />, context: routeContexts.auditLog, navVisible: true },

  { path: '/relations/tasks-products', label: 'Taken -> Producten', section: 'relations', element: <TasksProductsPage />, context: routeContexts.relations, navVisible: true },
  {
    path: '/relations/contribution-map',
    label: 'Bijdragekaart',
    section: 'relations',
    element: <PlaceholderPage title="Bijdragekaart" description="Relationale bijdragekaart (in opbouw)." />,
    context: routeContexts.relations,
    navVisible: true,
  },

  { path: '/organisations', label: 'Organisaties', section: 'documentation', element: <OrganisatiesPage />, context: routeContexts.documentation, navVisible: false },
  { path: '/assistant', label: 'Assistent', section: 'technologies', context: routeContexts.technologies, navVisible: false, redirectTo: '/' },
  { path: '/enumerations', label: 'Enumeraties', section: 'technologies', element: <EnumerationsPage />, context: routeContexts.technologies, navVisible: false },

  { path: '/tasktypes', label: 'Legacy Taaktypen', section: 'relations', context: routeContexts.relations, navVisible: false, redirectTo: '/relations/tasks-products' },
  { path: '/stickynotes', label: 'Legacy Sticky Notes', section: 'governance', context: routeContexts.stickyNotes, navVisible: false, redirectTo: '/governance/stickynotes' },
  { path: '*', label: 'Fallback', section: 'technologies', context: routeContexts.technologies, navVisible: false, redirectTo: '/' },
];

export const getRouteConfigForPath = (pathname: string): DashboardRoute => {
  const exact = dashboardRoutes.find((route) => route.path === pathname);
  if (exact) {
    return exact;
  }

  const candidates = dashboardRoutes
    .filter((route) => route.path !== '*' && !route.path.includes(':') && pathname.startsWith(`${route.path}/`))
    .sort((a, b) => b.path.length - a.path.length);

  if (candidates.length > 0) {
    return candidates[0];
  }

  if (/^\/legaltechnologies\/[^/]+$/.test(pathname)) {
    return dashboardRoutes.find((route) => route.path === '/legaltechnologies/:id')!;
  }

  return dashboardRoutes.find((route) => route.path === '*')!;
};

export const getNavSections = () =>
  (Object.keys(navSectionTitles) as NavSectionId[]).map((sectionId) => ({
    id: sectionId,
    title: navSectionTitles[sectionId],
    links: dashboardRoutes
      .filter((route) => route.navVisible && route.section === sectionId)
      .map((route) => ({ to: route.path, label: route.label })),
  }));
