import 'bootstrap/dist/css/bootstrap.min.css';
import DefinitionsPanel from './components/DefinitionsPanel';
function DefinitionsPage() {
  return (
    <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 800, margin: '2rem auto' }}>
      <DefinitionsPanel />
    </div>
  );
}

function OrganisatiesPage() {
  return (
    <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 800, margin: '2rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Organisaties</h2>
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
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


function OverviewPage() {
  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 2 }}>
        <section style={{ marginBottom: '2rem', background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Statistieken & Overzicht</h2>
          <StatisticsPanel />
        </section>
        <section style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Juridische Technologieën</h2>
          <LegalTechnologyList variant="cards" />
        </section>
      </div>
    </div>
  );
}

function LegalTechnologiesPage() {
  return (
    <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 900, margin: '2rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Juridische Technologieën</h2>
      <LegalTechnologyList variant="list" />
    </div>
  );
}

function TaskTypesPage() {
  return (
    <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 1100, margin: '2rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Taaktypen</h2>
      <LegalTechnologyByTasktype />
    </div>
  );
}

function StatsPage() {
  return (
    <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 600, margin: '2rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Statistieken</h2>
      <StatisticsPanel />
    </div>
  );
}

function AssistantPage() {
  return (
    <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 600, margin: '2rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Assistent</h2>
      <AssistantPanel />
    </div>
  );
}

function EnumerationsPage() {
  return (
    <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 600, margin: '2rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Filter op Enumeraties</h2>
      <EnumerationsFilter />
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'sans-serif', margin: '0', background: '#f5f6fa', minHeight: '100vh' }}>
        <NavBar />
        <div style={{ margin: '2rem' }}>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/legaltechnologies" element={<LegalTechnologiesPage />} />
            <Route path="/tasktypes" element={<TaskTypesPage />} />
            <Route path="/legaltechnologies/:id" element={<LegalTechnologyDetailPage />} />
            <Route path="/organisations" element={<OrganisatiesPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/enumerations" element={<EnumerationsPage />} />
            <Route path="/definitions" element={<DefinitionsPage />} />
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
