import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTechnology } from './ActiveTechnologyContext';

type AuditActionType =
  | 'Status wijziging'
  | 'Voorstel ingediend'
  | 'Voorstel goedgekeurd'
  | 'Voorstel afgewezen'
  | 'Veld bijgewerkt'
  | 'Entiteit aangemaakt'
  | 'Entiteit gearchiveerd';

type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditActionType;
  entityLabel: string;
  entityId?: string;
  entityType: 'Technologie' | 'Definitie' | 'Relatie' | 'Voorstel';
  previousValue?: string;
  newValue?: string;
  reason?: string;
  proposalId?: string;
};

const MOCK_AUDIT: AuditEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-06-01T14:32:00',
    actor: 'B. de Vries',
    action: 'Voorstel ingediend',
    entityLabel: 'LegalKM',
    entityId: 'legalkm',
    entityType: 'Technologie',
    reason: 'Status wijziging na pilotfase.',
    proposalId: 'vst-001',
  },
  {
    id: 'aud-002',
    timestamp: '2026-05-30T10:15:00',
    actor: 'A. Janssen',
    action: 'Voorstel ingediend',
    entityLabel: 'Procesautomatisering',
    entityType: 'Definitie',
    reason: 'Definitie ontbreekt in register.',
    proposalId: 'vst-002',
  },
  {
    id: 'aud-003',
    timestamp: '2026-05-25T09:00:00',
    actor: 'Systeem (moderator)',
    action: 'Voorstel goedgekeurd',
    entityLabel: 'DocuWare \u2192 Archivering',
    entityType: 'Relatie',
    reason: 'Goedgekeurd na overleg met kennisbeheer.',
    proposalId: 'vst-003',
  },
  {
    id: 'aud-004',
    timestamp: '2026-05-22T16:45:00',
    actor: 'Systeem (moderator)',
    action: 'Voorstel afgewezen',
    entityLabel: 'ClauseBase',
    entityId: 'clausebase',
    entityType: 'Technologie',
    previousValue: '3.1',
    newValue: '3.2',
    reason: 'Verificatie bij leverancier vereist.',
    proposalId: 'vst-004',
  },
  {
    id: 'aud-005',
    timestamp: '2026-05-20T11:30:00',
    actor: 'Admin',
    action: 'Status wijziging',
    entityLabel: 'DocuWare',
    entityId: 'docuware',
    entityType: 'Technologie',
    previousValue: 'Concept',
    newValue: 'Gepubliceerd',
    reason: 'Publicatie na afronding inhoudsbeoordeling.',
  },
  {
    id: 'aud-006',
    timestamp: '2026-05-15T08:00:00',
    actor: 'B. de Vries',
    action: 'Entiteit aangemaakt',
    entityLabel: 'SignTools NL',
    entityType: 'Technologie',
    reason: 'Nieuwe technologie opgenomen vanuit inventarisatie.',
  },
];

const ACTION_BADGE: Record<AuditActionType, string> = {
  'Status wijziging': 'text-bg-info',
  'Voorstel ingediend': 'text-bg-primary',
  'Voorstel goedgekeurd': 'text-bg-success',
  'Voorstel afgewezen': 'text-bg-danger',
  'Veld bijgewerkt': 'text-bg-light border',
  'Entiteit aangemaakt': 'text-bg-success',
  'Entiteit gearchiveerd': 'text-bg-secondary',
};

const ALL_ACTIONS: AuditActionType[] = [
  'Status wijziging',
  'Voorstel ingediend',
  'Voorstel goedgekeurd',
  'Voorstel afgewezen',
  'Veld bijgewerkt',
  'Entiteit aangemaakt',
  'Entiteit gearchiveerd',
];

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' });
};

const AuditLogPage: React.FC = () => {
  const { activeTechnology } = useActiveTechnology();
  const [actionFilter, setActionFilter] = useState<AuditActionType | 'all'>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_AUDIT.filter((entry) => {
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const matchesType = entityTypeFilter === 'all' || entry.entityType === entityTypeFilter;
    const matchesSearch =
      !search ||
      entry.entityLabel.toLowerCase().includes(search.toLowerCase()) ||
      entry.actor.toLowerCase().includes(search.toLowerCase()) ||
      (entry.reason || '').toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesType && matchesSearch;
  });

  const hasFilters = actionFilter !== 'all' || entityTypeFilter !== 'all' || !!search;

  return (
    <div className="page-card page-card--xxl">
      <div className="mb-3">
        <h2 className="page-heading mb-0">Auditlog</h2>
        <p className="text-muted small mb-0">
          Chronologische registratie van governance-acties. Alleen-lezen.
        </p>
      </div>

      {activeTechnology ? (
        <div className="alert alert-info d-flex align-items-center gap-2 py-2 mb-3" role="status">
          <span>
            Actieve context: <strong>{activeTechnology.naam}</strong>
          </span>
          <Link
            to={`/legaltechnologies/${encodeURIComponent(activeTechnology.id)}`}
            className="ms-2 small"
          >
            Open detailpagina
          </Link>
        </div>
      ) : null}

      <div className="d-flex flex-wrap gap-2 mb-3">
        <div>
          <label
            className="lt-filter-label form-label small mb-1"
            htmlFor="audit-action-filter"
          >
            Actietype
          </label>
          <select
            id="audit-action-filter"
            className="form-select form-select-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditActionType | 'all')}
          >
            <option value="all">Alle acties</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="lt-filter-label form-label small mb-1"
            htmlFor="audit-type-filter"
          >
            Entiteitstype
          </label>
          <select
            id="audit-type-filter"
            className="form-select form-select-sm"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
          >
            <option value="all">Alle typen</option>
            <option value="Technologie">Technologie</option>
            <option value="Definitie">Definitie</option>
            <option value="Relatie">Relatie</option>
            <option value="Voorstel">Voorstel</option>
          </select>
        </div>

        <div className="flex-grow-1" style={{ maxWidth: 300 }}>
          <label className="lt-filter-label form-label small mb-1" htmlFor="audit-search">
            Zoeken
          </label>
          <input
            id="audit-search"
            type="search"
            className="form-control form-control-sm"
            placeholder="Zoek op entiteit of actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <p className="mb-2">Geen auditregels gevonden die voldoen aan de filters.</p>
          {hasFilters ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setActionFilter('all');
                setEntityTypeFilter('all');
                setSearch('');
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <ol className="list-unstyled" aria-label="Auditlog tijdlijn">
          {filtered.map((entry, idx) => (
            <li
              key={entry.id}
              className={`d-flex gap-3 mb-3${idx < filtered.length - 1 ? ' pb-3 border-bottom' : ''}`}
            >
              <div
                className="flex-shrink-0 text-muted text-end"
                style={{ minWidth: 110, fontSize: '0.75rem' }}
              >
                <div>{formatTimestamp(entry.timestamp)}</div>
                <div className="fw-medium" style={{ color: 'var(--lt-text)' }}>
                  {entry.actor}
                </div>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <span className={`badge ${ACTION_BADGE[entry.action]}`}>{entry.action}</span>
                  <span className="badge text-bg-light border small">{entry.entityType}</span>
                  {entry.entityId ? (
                    <Link
                      to={`/legaltechnologies/${encodeURIComponent(entry.entityId)}`}
                      className="small fw-medium"
                    >
                      {entry.entityLabel}
                    </Link>
                  ) : (
                    <span className="small fw-medium">{entry.entityLabel}</span>
                  )}
                  {entry.proposalId ? (
                    <Link to="/governance/proposals" className="small text-muted">
                      &rarr; Voorstel {entry.proposalId}
                    </Link>
                  ) : null}
                </div>
                {entry.previousValue || entry.newValue ? (
                  <div className="small text-muted mb-1">
                    {entry.previousValue ? (
                      <span>
                        Oud: <code>{entry.previousValue}</code>
                      </span>
                    ) : null}
                    {entry.previousValue && entry.newValue ? (
                      <span className="mx-1">&rarr;</span>
                    ) : null}
                    {entry.newValue ? (
                      <span>
                        Nieuw: <code>{entry.newValue}</code>
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {entry.reason ? (
                  <p className="mb-0 small text-muted">{entry.reason}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="d-flex align-items-center gap-2 mt-2">
        <Link to="/governance/proposals" className="btn btn-sm btn-outline-secondary">
          Ga naar Voorstellen
        </Link>
        <Link to="/governance/comments" className="btn btn-sm btn-outline-secondary">
          Ga naar Opmerkingen
        </Link>
      </div>
    </div>
  );
};

export default AuditLogPage;
