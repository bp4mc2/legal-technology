import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTechnology } from './ActiveTechnologyContext';

type CommentStatus = 'Nieuw' | 'In behandeling' | 'Geaccepteerd' | 'Afgewezen' | 'Opgelost';

type Comment = {
  id: string;
  text: string;
  entityLabel: string;
  entityId?: string;
  entityType: 'Technologie' | 'Definitie';
  status: CommentStatus;
  submittedBy: string;
  submittedAt: string;
  resolution?: string;
};

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'opm-001',
    text: 'De omschrijving van LegalKM is verouderd en dekt de huidige functionaliteit niet meer volledig.',
    entityLabel: 'LegalKM',
    entityId: 'legalkm',
    entityType: 'Technologie',
    status: 'In behandeling',
    submittedBy: 'A. Janssen',
    submittedAt: '2026-05-29',
  },
  {
    id: 'opm-002',
    text: 'Definitie "Contractbeheer" mist verwijzing naar de Europese aanbestedingsregels.',
    entityLabel: 'Contractbeheer',
    entityType: 'Definitie',
    status: 'Nieuw',
    submittedBy: 'C. Bakker',
    submittedAt: '2026-05-31',
  },
  {
    id: 'opm-003',
    text: 'ClauseBase versienummer klopt niet meer. Leverancier heeft 3.2 uitgebracht.',
    entityLabel: 'ClauseBase',
    entityId: 'clausebase',
    entityType: 'Technologie',
    status: 'Opgelost',
    submittedBy: 'B. de Vries',
    submittedAt: '2026-05-22',
    resolution: 'Versienummer is bijgewerkt via voorstel vst-004.',
  },
  {
    id: 'opm-004',
    text: 'Licentievorm van DocuWare is gewijzigd naar abonnement. Huidige registratie is onjuist.',
    entityLabel: 'DocuWare',
    entityId: 'docuware',
    entityType: 'Technologie',
    status: 'Nieuw',
    submittedBy: 'A. Janssen',
    submittedAt: '2026-06-01',
  },
];

const STATUS_BADGE: Record<CommentStatus, string> = {
  Nieuw: 'text-bg-primary',
  'In behandeling': 'text-bg-warning',
  Geaccepteerd: 'text-bg-success',
  Afgewezen: 'text-bg-danger',
  Opgelost: 'text-bg-secondary',
};

const ALL_STATUSES: CommentStatus[] = [
  'Nieuw',
  'In behandeling',
  'Geaccepteerd',
  'Afgewezen',
  'Opgelost',
];

const CommentsPage: React.FC = () => {
  const { activeTechnology } = useActiveTechnology();
  const [statusFilter, setStatusFilter] = useState<CommentStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_COMMENTS.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch =
      !search ||
      c.text.toLowerCase().includes(search.toLowerCase()) ||
      c.entityLabel.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const hasFilters = statusFilter !== 'all' || !!search;

  return (
    <div className="page-card page-card--xxl">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="page-heading mb-0">Opmerkingen</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled
          aria-disabled="true"
          title="Rol vereist: Proposer of hoger"
        >
          + Opmerking toevoegen
        </button>
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
            htmlFor="comments-status-filter"
          >
            Status
          </label>
          <select
            id="comments-status-filter"
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CommentStatus | 'all')}
          >
            <option value="all">Alle statussen</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-grow-1" style={{ maxWidth: 300 }}>
          <label className="lt-filter-label form-label small mb-1" htmlFor="comments-search">
            Zoeken
          </label>
          <input
            id="comments-search"
            type="search"
            className="form-control form-control-sm"
            placeholder="Zoek in opmerkingen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <p className="mb-2">Geen opmerkingen gevonden die voldoen aan de filters.</p>
          {hasFilters ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setStatusFilter('all');
                setSearch('');
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtered.map((comment) => (
            <div key={comment.id} className="card border p-3">
              <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[comment.status]}`}>
                      {comment.status}
                    </span>
                    <span className="badge text-bg-light border small">{comment.entityType}</span>
                    {comment.entityId ? (
                      <Link
                        to={`/legaltechnologies/${encodeURIComponent(comment.entityId)}`}
                        className="small fw-medium"
                      >
                        {comment.entityLabel}
                      </Link>
                    ) : (
                      <span className="small fw-medium">{comment.entityLabel}</span>
                    )}
                  </div>
                  <p className="mb-1 small">{comment.text}</p>
                  {comment.resolution ? (
                    <p className="mb-0 small text-muted fst-italic">
                      Afhandeling: {comment.resolution}
                    </p>
                  ) : null}
                </div>
                <div
                  className="text-muted text-end flex-shrink-0"
                  style={{ fontSize: '0.75rem' }}
                >
                  <div>{comment.submittedAt}</div>
                  <div>{comment.submittedBy}</div>
                </div>
              </div>
              <div className="d-flex gap-1 mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled
                  aria-disabled="true"
                  title="Rol vereist: Moderator of hoger"
                >
                  Status wijzigen
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled
                  aria-disabled="true"
                  title="Rol vereist: Proposer of hoger"
                >
                  Escaleer naar Voorstel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="d-flex align-items-center gap-2 mt-3">
        <Link to="/governance/proposals" className="btn btn-sm btn-outline-secondary">
          Ga naar Voorstellen
        </Link>
        <Link to="/governance/audit-log" className="btn btn-sm btn-outline-secondary">
          Bekijk Auditlog
        </Link>
      </div>
    </div>
  );
};

export default CommentsPage;
