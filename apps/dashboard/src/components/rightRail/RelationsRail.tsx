import React from 'react';
import { Link } from 'react-router-dom';
import type { RelationsRailCommands, RelationsRailContext } from './rightRailTypes';

type RelationsRailProps = {
  context: RelationsRailContext;
  commands: RelationsRailCommands;
};

const RelationsRail: React.FC<RelationsRailProps> = ({ context, commands }) => {
  const hasSelection = !!context.selection.taskTypeLabel || !!context.selection.productLabel;

  if (!hasSelection) {
    return (
      <div className="app-context-card">
        <h3 className="app-context-title">Taken {'->'} Producten context</h3>
        <p className="app-context-copy">Selecteer eerst een taaktype of product om context te tonen.</p>
        <div className="d-flex gap-2 flex-wrap">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={commands.selectFirstTaskgroup}>
            Spring naar eerste taakgroep
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={commands.resetFilters}>
            Reset filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-context-card">
        <h3 className="app-context-title">Taakcontext</h3>
        <p className="app-context-copy mb-1">
          Taakgroep: <strong>{context.selection.taskGroupLabel || 'Onbekend'}</strong>
        </p>
        <p className="app-context-copy mb-1">
          Taaktype: <strong>{context.selection.taskTypeLabel || 'Onbekend'}</strong>
        </p>
        <p className="app-context-copy mb-2">
          {context.metrics.technologyCount || 0} technologieen in context
        </p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={commands.selectFirstTaskgroup}>
          Spring naar eerste taakgroep
        </button>
      </div>

      <div className="app-context-card">
        <h3 className="app-context-title">Productimpact</h3>
        <p className="app-context-copy mb-2">
          Product: <strong>{context.selection.productLabel || 'Alle producten'}</strong>
        </p>
        {(context.selection.technologyNames || []).length > 0 ? (
          <div className="small mb-2">
            {(context.selection.technologyNames || []).slice(0, 4).join(', ')}
            {(context.selection.technologyNames || []).length > 4 ? '...' : ''}
          </div>
        ) : (
          <div className="small text-muted mb-2">Nog geen impacttechnologieen geselecteerd.</div>
        )}
        <div className="app-context-links">
          <Link to="/legaltechnologies" className="app-context-link">
            Open technologieen
          </Link>
          <Link to="/definitions" className="app-context-link">
            Open Definities
          </Link>
        </div>
      </div>

      <div className="app-context-card">
        <h3 className="app-context-title">Governance signalering</h3>
        <p className="app-context-copy mb-2">
          Signalen: <strong>{context.metrics.warningCount || 0}</strong>
        </p>
        <div className="app-context-links">
          <Link to="/governance/proposals" className="app-context-link">
            Ga naar Voorstellen
          </Link>
          <Link to="/governance/comments" className="app-context-link">
            Ga naar Opmerkingen
          </Link>
          <Link to="/governance/audit-log" className="app-context-link">
            Ga naar Auditlog
          </Link>
        </div>
      </div>
    </>
  );
};

export default RelationsRail;
