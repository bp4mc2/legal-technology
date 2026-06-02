import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTechnology } from './ActiveTechnologyContext';

type ProposalStatus = 'Ingediend' | 'In behandeling' | 'Goedgekeurd' | 'Afgewezen' | 'Teruggetrokken';
type EntityType = 'Technologie' | 'Definitie' | 'Relatie';

type Proposal = {
  id: string;
  title: string;
  description: string;
  entityType: EntityType;
  entityLabel: string;
  entityId?: string;
  status: ProposalStatus;
  submittedBy: string;
  submittedAt: string;
  reason?: string;
};

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'vst-001',
    title: 'Status wijziging: LegalKM naar "In gebruik"',
    description: 'Voorstel om de gebruiksstatus van LegalKM te wijzigen van Concept naar In gebruik na succesvolle pilot.',
    entityType: 'Technologie',
    entityLabel: 'LegalKM',
    entityId: 'legalkm',
    status: 'In behandeling',
    submittedBy: 'B. de Vries',
    submittedAt: '2026-05-28',
    reason: 'Pilotresultaten positief beoordeeld door gebruikersgroep.',
  },
  {
    id: 'vst-002',
    title: 'Toevoeging: nieuwe definitie "Procesautomatisering"',
    description: 'Definitie voor procesautomatisering ontbreekt in het begrippenregister.',
    entityType: 'Definitie',
    entityLabel: 'Procesautomatisering',
    status: 'Ingediend',
    submittedBy: 'A. Janssen',
    submittedAt: '2026-05-30',
  },
  {
    id: 'vst-003',
    title: 'Relatie verwijderen: DocuWare - Archivering',
    description: 'De relatie tussen DocuWare en het taaktype Archivering is niet meer actueel.',
    entityType: 'Relatie',
    entityLabel: 'DocuWare → Archivering',
    status: 'Goedgekeurd',
    submittedBy: 'C. Bakker',
    submittedAt: '2026-05-20',
    reason: 'Goedgekeurd na overleg met kennisbeheer.',
  },
  {
    id: 'vst-004',
    title: 'Versienummer bijwerken: ClauseBase 3.1 → 3.2',
    description: 'Nieuwste versie van ClauseBase is beschikbaar, versienummer moet worden bijgewerkt.',
    entityType: 'Technologie',
    entityLabel: 'ClauseBase',
    entityId: 'clausebase',
    status: 'Afgewezen',
    submittedBy: 'B. de Vries',
    submittedAt: '2026-05-15',
    reason: 'Versienummer vereist verificatie bij leverancier. Terugverwezen.',
  },
];

const STATUS_BADGE: Record<ProposalStatus, string> = {
  Ingediend: 'text-bg-primary',
  'In behandeling': 'text-bg-warning',
  Goedgekeurd: 'text-bg-success',
  Afgewezen: 'text-bg-danger',
  Teruggetrokken: 'text-bg-secondary',
};

const ALL_STATUSES: ProposalStatus[] = [
  'Ingediend',
  'In behandeling',
  'Goedgekeurd',
  'Afgewezen',
  'Teruggetrokken',
];

const ProposalsPage: React.FC = () => {
  const { activeTechnology } = useActiveTechnology();
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_PROPOSALS.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = entityTypeFilter === 'all' || p.entityType === entityTypeFilter;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.entityLabel.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const hasFilters = statusFilter !== 'all' || entityTypeFilter !== 'all' || !!search;

  return (
    <div className="page-card page-card--xxl">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="page-heading mb-0">Voorstellen</h2>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled
          aria-disabled="true"
          title="Rol vereist: Proposer of hoger"
        >
          + Voorstel indienen
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
            htmlFor="proposals-status-filter"
          >
            Status
          </label>
          <select
            id="proposals-status-filter"
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProposalStatus | 'all')}
          >
            <option value="all">Alle statussen</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="lt-filter-label form-label small mb-1"
            htmlFor="proposals-type-filter"
          >
            Entiteitstype
          </label>
          <select
            id="proposals-type-filter"
            className="form-select form-select-sm"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value as EntityType | 'all')}
          >
            <option value="all">Alle typen</option>
            <option value="Technologie">Technologie</option>
            <option value="Definitie">Definitie</option>
            <option value="Relatie">Relatie</option>
          </select>
        </div>

        <div className="flex-grow-1" style={{ maxWidth: 300 }}>
          <label className="lt-filter-label form-label small mb-1" htmlFor="proposals-search">
            Zoeken
          </label>
          <input
            id="proposals-search"
            type="search"
            className="form-control form-control-sm"
            placeholder="Zoek op titel of entiteit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <p className="mb-2">Geen voorstellen gevonden die voldoen aan de filters.</p>
          {hasFilters ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setStatusFilter('all');
                setEntityTypeFilter('all');
                setSearch('');
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Voorstel</th>
                <th>Type</th>
                <th>Entiteit</th>
                <th>Status</th>
                <th>Ingediend</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proposal) => (
                <tr key={proposal.id}>
                  <td>
                    <div className="fw-medium small">{proposal.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {proposal.description.length > 80
                        ? `${proposal.description.slice(0, 80)}\u2026`
                        : proposal.description}
                    </div>
                    {proposal.reason ? (
                      <div className="text-muted fst-italic" style={{ fontSize: '0.75rem' }}>
                        Reden: {proposal.reason}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className="badge text-bg-light border small">{proposal.entityType}</span>
                  </td>
                  <td>
                    {proposal.entityId ? (
                      <Link
                        to={`/legaltechnologies/${encodeURIComponent(proposal.entityId)}`}
                        className="small"
                      >
                        {proposal.entityLabel}
                      </Link>
                    ) : (
                      <span className="small">{proposal.entityLabel}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[proposal.status]}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td>
                    <div className="small text-muted">{proposal.submittedAt}</div>
                    <div className="small text-muted">{proposal.submittedBy}</div>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        disabled
                        aria-disabled="true"
                        title="Rol vereist: Moderator of hoger"
                      >
                        Goedkeuren
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled
                        aria-disabled="true"
                        title="Rol vereist: Moderator of hoger"
                      >
                        Afwijzen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="d-flex align-items-center gap-2 mt-2">
        <Link to="/governance/audit-log" className="btn btn-sm btn-outline-secondary">
          Bekijk Auditlog
        </Link>
        <Link to="/governance/comments" className="btn btn-sm btn-outline-secondary">
          Ga naar Opmerkingen
        </Link>
      </div>
    </div>
  );
};

export default ProposalsPage;
