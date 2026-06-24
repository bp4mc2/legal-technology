import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTechnology } from './ActiveTechnologyContext';
import { apiFetch } from '../utils/api';

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

type GovernancePermissions = {
  role: string;
  actions: Record<string, boolean>;
};

const STATUS_BADGE: Record<ProposalStatus, string> = {
  Ingediend: 'border-blue-200 bg-blue-100 text-blue-800',
  'In behandeling': 'border-amber-200 bg-amber-100 text-amber-900',
  Goedgekeurd: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  Afgewezen: 'border-rose-200 bg-rose-100 text-rose-800',
  Teruggetrokken: 'border-slate-300 bg-slate-100 text-slate-700',
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
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [permissions, setPermissions] = useState<GovernancePermissions>({ role: 'Viewer', actions: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);

  const hasFilters = statusFilter !== 'all' || entityTypeFilter !== 'all' || !!search;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (entityTypeFilter !== 'all') {
      params.set('entityType', entityTypeFilter);
    }
    if (search.trim()) {
      params.set('q', search.trim());
    }
    return params.toString();
  }, [statusFilter, entityTypeFilter, search]);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [fetchedProposals, fetchedPermissions] = await Promise.all([
        apiFetch<Proposal[]>(`/api/governance/proposals${queryString ? `?${queryString}` : ''}`),
        apiFetch<GovernancePermissions>('/api/governance/permissions'),
      ]);
      setProposals(fetchedProposals);
      setPermissions(fetchedPermissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout bij laden van voorstellen.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  const canCreate = !!permissions.actions['proposal.create'];
  const canApprove = !!permissions.actions['proposal.approve'];
  const canReject = !!permissions.actions['proposal.reject'];

  const submitProposal = async () => {
    if (!canCreate) {
      return;
    }

    const title = window.prompt('Titel van het voorstel');
    if (!title) {
      return;
    }
    const description = window.prompt('Omschrijving van het voorstel');
    if (!description) {
      return;
    }

    try {
      await apiFetch<Proposal>('/api/governance/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          entityType: activeTechnology ? 'Technologie' : 'Definitie',
          entityLabel: activeTechnology?.naam || 'Onbekende entiteit',
          entityId: activeTechnology?.id,
          reason: 'Aangemaakt vanuit dashboard governance view',
        }),
      });
      await loadProposals();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Voorstel indienen mislukt.');
    }
  };

  const updateStatus = async (proposalId: string, nextStatus: ProposalStatus) => {
    setBusyProposalId(proposalId);
    setError(null);
    try {
      await apiFetch<Proposal>(`/api/governance/proposals/${encodeURIComponent(proposalId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadProposals();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Statuswijziging mislukt.');
    } finally {
      setBusyProposalId(null);
    }
  };

  const filtered = proposals;

  const panelClass = 'rounded-lt border border-lt-border bg-lt-card p-5 shadow-lt sm:p-6';
  const primaryButtonClass =
    'inline-flex items-center rounded-md border border-lt-primary bg-lt-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50';
  const secondaryButtonClass =
    'inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50';
  const successButtonClass =
    'inline-flex items-center rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50';
  const dangerButtonClass =
    'inline-flex items-center rounded-md border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50';
  const fieldLabelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';
  const fieldControlClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-lt-heading">Voorstellen</h2>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => {
            void submitProposal();
          }}
          disabled={!canCreate || loading}
          aria-disabled={!canCreate || loading}
          title="Rol vereist: Proposer of hoger"
        >
          + Voorstel indienen
        </button>
      </div>

      {error ? (
        <div
          className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {activeTechnology ? (
        <div
          className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900"
          role="status"
        >
          <span>
            Actieve context: <strong>{activeTechnology.naam}</strong>
          </span>
          <Link
            to={`/legaltechnologies/${encodeURIComponent(activeTechnology.id)}`}
            className="text-sm font-medium text-blue-700 underline underline-offset-2"
          >
            Open detailpagina
          </Link>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[220px,220px,minmax(0,300px)]">
        <div>
          <label
            className={fieldLabelClass}
            htmlFor="proposals-status-filter"
          >
            Status
          </label>
          <select
            id="proposals-status-filter"
            className={fieldControlClass}
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
            className={fieldLabelClass}
            htmlFor="proposals-type-filter"
          >
            Entiteitstype
          </label>
          <select
            id="proposals-type-filter"
            className={fieldControlClass}
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value as EntityType | 'all')}
          >
            <option value="all">Alle typen</option>
            <option value="Technologie">Technologie</option>
            <option value="Definitie">Definitie</option>
            <option value="Relatie">Relatie</option>
          </select>
        </div>

        <div>
          <label className={fieldLabelClass} htmlFor="proposals-search">
            Zoeken
          </label>
          <input
            id="proposals-search"
            type="search"
            className={fieldControlClass}
            placeholder="Zoek op titel of entiteit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-3 text-sm text-lt-muted">Voorstellen laden...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-lt-muted">
          <p className="mb-2 text-sm">Geen voorstellen gevonden die voldoen aan de filters.</p>
          {hasFilters ? (
            <button
              type="button"
              className={secondaryButtonClass}
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
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Voorstel</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Type</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Entiteit</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Ingediend</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proposal) => (
                <tr key={proposal.id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-3 py-2 align-top">
                    <div className="text-sm font-semibold text-slate-800">{proposal.title}</div>
                    <div className="text-xs text-lt-muted">
                      {proposal.description.length > 80
                        ? `${proposal.description.slice(0, 80)}\u2026`
                        : proposal.description}
                    </div>
                    {proposal.reason ? (
                      <div className="text-xs italic text-lt-muted">
                        Reden: {proposal.reason}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {proposal.entityType}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    {proposal.entityId ? (
                      <Link
                        to={`/legaltechnologies/${encodeURIComponent(proposal.entityId)}`}
                        className="text-sm font-semibold text-blue-700 underline underline-offset-2"
                      >
                        {proposal.entityLabel}
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-700">{proposal.entityLabel}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[proposal.status]}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="text-xs text-lt-muted">{proposal.submittedAt}</div>
                    <div className="text-xs text-lt-muted">{proposal.submittedBy}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={successButtonClass}
                        onClick={() => {
                          void updateStatus(proposal.id, 'Goedgekeurd');
                        }}
                        disabled={!canApprove || proposal.status !== 'In behandeling' || busyProposalId === proposal.id}
                        aria-disabled={!canApprove || proposal.status !== 'In behandeling' || busyProposalId === proposal.id}
                        title="Rol vereist: Moderator of hoger"
                      >
                        Goedkeuren
                      </button>
                      <button
                        type="button"
                        className={dangerButtonClass}
                        onClick={() => {
                          void updateStatus(proposal.id, 'Afgewezen');
                        }}
                        disabled={!canReject || proposal.status !== 'In behandeling' || busyProposalId === proposal.id}
                        aria-disabled={!canReject || proposal.status !== 'In behandeling' || busyProposalId === proposal.id}
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link to="/governance/audit-log" className={secondaryButtonClass}>
          Bekijk Auditlog
        </Link>
        <Link to="/governance/comments" className={secondaryButtonClass}>
          Ga naar Opmerkingen
        </Link>
      </div>
    </section>
  );
};

export default ProposalsPage;
