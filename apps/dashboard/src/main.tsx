import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/tailwind.css';
import './styles/index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import AppShell from './components/AppShell';
import { ActiveTechnologyProvider } from './components/ActiveTechnologyContext';
import { CompareSelectionProvider } from './components/CompareSelectionContext';
import { RightRailProvider } from './components/rightRail/RightRailContext';
import { dashboardRoutes } from './app/routes';

function App() {
  return (
    <Router>
      <ActiveTechnologyProvider>
        <CompareSelectionProvider>
          <RightRailProvider>
            <AppShell>
              <Routes>
                {dashboardRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.redirectTo ? <Navigate to={route.redirectTo} replace /> : route.element}
                  />
                ))}
              </Routes>
            </AppShell>
          </RightRailProvider>
        </CompareSelectionProvider>
      </ActiveTechnologyProvider>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
