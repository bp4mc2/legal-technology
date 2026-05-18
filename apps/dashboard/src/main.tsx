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




import NavBar from './components/NavBar';
import LegalTechnologyList from './components/LegalTechnologyList';
import LegalTechnologyByTasktype from './components/LegalTechnologyByTasktype';
import LegalTechnologyForm from './components/LegalTechnologyForm';
import LegalTechnologyDetailPage from './components/LegalTechnologyDetailPage';
import StatisticsPanel from './components/StatisticsPanel';
import EnumerationsFilter from './components/EnumerationsFilter';
import AssistantPanel from './components/AssistantPanel';
import OrganisatiesPanel from './components/OrganisatiesPanel';
import StickyNotesPanel from './components/StickyNotesPanel';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


function OverviewPage() {
  return (
    <div className="overview-layout">
      <div className="overview-main">
        <section className="page-card page-card--flush overview-block">
          <h2 className="page-heading">Statistieken & Overzicht</h2>
          <StatisticsPanel />
        </section>
        <section className="page-card page-card--flush">
          <h2 className="page-heading">Juridische Technologieën</h2>
          <LegalTechnologyList variant="cards" />
        </section>
      </div>
    </div>
  );
}

function LegalTechnologiesPage() {
  return (
    <div className="page-card page-card--lg">
      <h2 className="page-heading">Juridische Technologieën</h2>
      <LegalTechnologyList variant="list" />
    </div>
  );
}

function TaskTypesPage() {
  return (
    <div className="page-card page-card--xl">
      <h2 className="page-heading">Taaktypen</h2>
      <LegalTechnologyByTasktype />
    </div>
  );
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

function App() {
  return (
    <Router>
      <div className="app-shell">
        <NavBar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/legaltechnologies" element={<LegalTechnologiesPage />} />
            <Route path="/tasktypes" element={<TaskTypesPage />} />
            <Route path="/legaltechnologies/:id" element={<LegalTechnologyDetailPage />} />
            <Route path="/organisations" element={<OrganisatiesPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/enumerations" element={<EnumerationsPage />} />
            <Route path="/definitions" element={<DefinitionsPage />} />
            <Route path="/stickynotes" element={<StickyNotesPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
