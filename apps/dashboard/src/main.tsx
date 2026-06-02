import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';
import DefinitionsPanel from './components/DefinitionsPanel';
function DefinitionsPage() {
  return (
    <div className="page-card page-card--md">
      <DefinitionsPanel />
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
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

import AppShell from './components/AppShell';
import LegalTechnologyByTasktype from './components/LegalTechnologyByTasktype';
import LegalTechnologyForm from './components/LegalTechnologyForm';
import LegalTechnologyDetailPage from './components/LegalTechnologyDetailPage';
import StatisticsPanel from './components/StatisticsPanel';
import EnumerationsFilter from './components/EnumerationsFilter';
import AssistantPanel from './components/AssistantPanel';
import OrganisatiesPanel from './components/OrganisatiesPanel';
import StickyNotesPanel from './components/StickyNotesPanel';
import ComparePage from './components/ComparePage';
import TasksProductsPage from './components/TasksProductsPage';
import ProposalsPage from './components/ProposalsPage';
import CommentsPage from './components/CommentsPage';
import AuditLogPage from './components/AuditLogPage';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { CompareSelectionProvider, useCompareSelection } from './components/CompareSelectionContext';
import { ActiveTechnologyProvider } from './components/ActiveTechnologyContext';


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
      <LegalTechnologyByTasktype contextMode="right-rail" />
    </div>
  );
}

function TaskTypesPage() {
  return <TasksProductsPage />;
}

function StatsPage() {
  return (
    <div className="page-card page-card--sm">
      <h2 className="page-heading">Statistieken</h2>
      <StatisticsPanel />
    </div>
  );
}

function AssistantPage() {
  return (
    <div className="page-card page-card--sm">
      <h2 className="page-heading">Assistent</h2>
      <AssistantPanel />
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

  if (selectedCount === 0) {
    return (
      <div className="page-card page-card--md">
        <h2 className="page-heading">Selectie</h2>
        <p className="text-muted mb-3">Nog geen technologieen geselecteerd voor vergelijking.</p>
        <p className="text-muted mb-3">Selecteer 1 tot 4 technologieen in de weergave Alle technologieen (met taken).</p>
        <Link to="/legaltechnologies" className="btn btn-sm btn-primary">
          Ga naar Alle technologieen
        </Link>
      </div>
    );
  }

  return (
    <div className="page-card page-card--lg">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="page-heading mb-0">Selectie</h2>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearSelection}>
          Selectie leegmaken
        </button>
      </div>
      <p className="text-muted">Geselecteerde technologieen: {selectedCount}/4</p>
      <div className="d-flex align-items-center gap-2 mb-3">
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
          Vergelijk selectie
        </Link>
        {!canCompare ? <small className="text-muted">Selecteer nog 1 technologie om te vergelijken.</small> : null}
      </div>
      <div className="d-flex flex-wrap gap-2">
        {selectedItems.map((item) => (
          <div key={item.id} className="badge rounded-pill text-bg-light border p-2 d-flex align-items-center gap-2">
            <span>{item.naam || item.id}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-1"
              onClick={() => removeSelection(item.id)}
              aria-label={`Verwijder ${item.naam || item.id} uit selectie`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
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

function App() {
  return (
    <Router>
      <ActiveTechnologyProvider>
      <CompareSelectionProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/legaltechnologies" element={<LegalTechnologiesPage />} />
            <Route path="/legaltechnologies/compare" element={<ComparePage />} />
            <Route path="/legaltechnologies/selection" element={<SelectionPage />} />
            <Route path="/legaltechnologies/:id" element={<LegalTechnologyDetailPage />} />

            <Route path="/governance/proposals" element={<ProposalsPage />} />
            <Route path="/governance/comments" element={<CommentsPage />} />
            <Route path="/governance/stickynotes" element={<StickyNotesPage />} />
            <Route path="/governance/audit-log" element={<AuditLogPage />} />

            <Route path="/relations/tasks-products" element={<TaskTypesPage />} />
            <Route path="/relations/contribution-map" element={<PlaceholderPage title="Bijdragekaart" description="Relationale bijdragekaart (in opbouw)." />} />

            <Route path="/tasktypes" element={<Navigate to="/relations/tasks-products" replace />} />
            <Route path="/organisations" element={<OrganisatiesPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/enumerations" element={<EnumerationsPage />} />
            <Route path="/definitions" element={<DefinitionsPage />} />
            <Route path="/stickynotes" element={<Navigate to="/governance/stickynotes" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </CompareSelectionProvider>
      </ActiveTechnologyProvider>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
