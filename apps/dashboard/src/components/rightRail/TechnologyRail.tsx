import React from 'react';
import { Link } from 'react-router-dom';
import { documentationSectionLink } from '../../app/routeContext';
import type { ActiveTechnology } from '../ActiveTechnologyContext';

export const TechnologyRail: React.FC<{
  technology: ActiveTechnology;
  clearTechnology: () => void;
}> = ({ technology, clearTechnology }) => (
  <>
    <div className="app-context-card">
      <div className="d-flex align-items-start justify-content-between gap-2">
        <h3 className="app-context-title mb-0">Documentatie</h3>
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
          aria-label="Deselecteer context"
          onClick={clearTechnology}
        >
          Wissen
        </button>
      </div>
      <div className="fw-semibold mb-1">{technology.naam}</div>
      {technology.subtype ? <div className="small text-muted mb-1">{technology.subtype}</div> : null}
      {technology.omschrijving ? (
        <p className="app-context-copy">{technology.omschrijving}</p>
      ) : (
        <p className="app-context-copy text-muted fst-italic">Geen omschrijving beschikbaar.</p>
      )}
      <div className="app-context-links">
        <Link to={`/legaltechnologies/${encodeURIComponent(technology.id)}`} className="app-context-link">
          Open detailpagina
        </Link>
        <Link to={documentationSectionLink('catalogus', technology.id)} className="app-context-link">
          Open documentatiehub
        </Link>
      </div>
    </div>

    <div className="app-context-card">
      <h3 className="app-context-title">Opmerkingen</h3>
      <p className="app-context-copy">
        Opmerkingen voor <strong>{technology.naam}</strong> zijn beschikbaar in de opmerkingenwerkstroom.
      </p>
      {technology.gebruiksstatus ? (
        <div className="small mb-2">
          Status: <span className="fw-semibold">{technology.gebruiksstatus}</span>
        </div>
      ) : null}
      <div className="app-context-links">
        <Link to="/governance/comments" className="app-context-link">
          Ga naar Opmerkingen
        </Link>
      </div>
    </div>

    <div className="app-context-card">
      <h3 className="app-context-title">Governance</h3>
      <p className="app-context-copy">
        Bekijk voorstellen en auditregels voor <strong>{technology.naam}</strong>.
      </p>
      {technology.licentievorm ? (
        <div className="small mb-2">
          Licentie: <span className="fw-semibold">{technology.licentievorm}</span>
        </div>
      ) : null}
      <div className="app-context-links">
        <Link to="/governance/proposals" className="app-context-link">
          Bekijk Voorstellen
        </Link>
        <Link to="/governance/audit-log" className="app-context-link">
          Bekijk Auditlog
        </Link>
      </div>
    </div>
  </>
);

export const TechnologyDetailRail: React.FC<{ technology: ActiveTechnology }> = ({ technology }) => (
  <>
    <div className="app-context-card">
      <h3 className="app-context-title">Op een oogopslag</h3>
      <div className="table-responsive">
        <table className="table table-sm mb-0">
          <tbody>
            <tr>
              <th className="text-muted fw-normal small">Beoogde gebruikers</th>
              <td className="small">{technology.beoogdeGebruikers?.filter(Boolean).join(', ') || '-'}</td>
            </tr>
            {technology.technologietype ? (
              <tr>
                <th className="text-muted fw-normal small">Technologietype</th>
                <td className="small">{technology.technologietype}</td>
              </tr>
            ) : null}
            {technology.typeTechnologie?.filter(Boolean).length ? (
              <tr>
                <th className="text-muted fw-normal small">Type technologie</th>
                <td className="small">{technology.typeTechnologie.filter(Boolean).join(', ')}</td>
              </tr>
            ) : null}
            <tr>
              <th className="text-muted fw-normal small">Vorm / subtype</th>
              <td className="small">{technology.subtype || '-'}</td>
            </tr>
            <tr>
              <th className="text-muted fw-normal small">Gebruiksstatus</th>
              <td className="small">{technology.gebruiksstatus || '-'}</td>
            </tr>
            <tr>
              <th className="text-muted fw-normal small">Licentie</th>
              <td className="small">{technology.licentievorm || '-'}</td>
            </tr>
            <tr>
              <th className="text-muted fw-normal small">Versie</th>
              <td className="small">{technology.versienummer || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div className="app-context-card">
      <h3 className="app-context-title">Functionaliteiten</h3>
      {technology.gebodenFunctionaliteit?.length ? (
        <div className="d-flex flex-wrap gap-2">
          {technology.gebodenFunctionaliteit.filter(Boolean).map((item) => (
            <span key={item} className="badge text-bg-light border">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="app-context-copy text-muted mb-0">Geen functionaliteiten beschikbaar.</p>
      )}
    </div>

    <div className="app-context-card">
      <h3 className="app-context-title">Taaktypes</h3>
      {technology.taaktypes?.length ? (
        <div className="d-flex flex-wrap gap-2">
          {technology.taaktypes.filter(Boolean).map((item) => (
            <span key={item} className="badge text-bg-light border">
              {item}
            </span>
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
        <Link to="/governance/stickynotes" className="app-context-link">
          Open Sticky Notes
        </Link>
        <Link to="/governance/comments" className="app-context-link">
          Ga naar Opmerkingen
        </Link>
      </div>
    </div>
  </>
);
