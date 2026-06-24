import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiFetch } from '../utils/api';
import { useActiveTechnology } from './ActiveTechnologyContext';

type AuditActionType =
  | 'Status wijziging'
  | 'Voorstel ingediend'
  | 'Voorstel goedgekeurd'
  | 'Voorstel afgewezen'
  | 'Voorstel teruggetrokken'
  | 'Opmerking ingediend'
  | 'Opmerking geescaleerd naar voorstel'
  | 'Veld bijgewerkt'
  | 'Entiteit aangemaakt'
  | 'Entiteit gearchiveerd';

type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditActionType | string;
  entityLabel: string;
  entityId?: string;
  entityType: 'Technologie' | 'Definitie' | 'Relatie' | 'Voorstel' | string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  proposalId?: string;
};

const ACTION_BADGE: Record<string, string> = {
  'Status wijziging': 'border-cyan-200 bg-cyan-100 text-cyan-800',
  'Voorstel ingediend': 'border-blue-200 bg-blue-100 text-blue-800',
  'Voorstel goedgekeurd': 'border-emerald-200 bg-emerald-100 text-emerald-800',
  'Voorstel afgewezen': 'border-rose-200 bg-rose-100 text-rose-800',
  'Voorstel teruggetrokken': 'border-slate-300 bg-slate-100 text-slate-700',
  'Opmerking ingediend': 'border-blue-200 bg-blue-100 text-blue-800',
  'Opmerking geescaleerd naar voorstel': 'border-amber-200 bg-amber-100 text-amber-900',
  'Veld bijgewerkt': 'border-slate-300 bg-slate-50 text-slate-700',
  'Entiteit aangemaakt': 'border-emerald-200 bg-emerald-100 text-emerald-800',
  'Entiteit gearchiveerd': 'border-slate-300 bg-slate-100 text-slate-700',
};

const ALL_ACTIONS: AuditActionType[] = [
  'Status wijziging',
  'Voorstel ingediend',
  'Voorstel goedgekeurd',
  'Voorstel afgewezen',
  'Voorstel teruggetrokken',
  'Opmerking ingediend',
  'Opmerking geescaleerd naar voorstel',
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
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (actionFilter !== 'all') {
      params.set('action', actionFilter);
    }
    if (entityTypeFilter !== 'all') {
      params.set('entityType', entityTypeFilter);
    }
    if (activeTechnology?.id) {
      params.set('entityId', activeTechnology.id);
    }
    if (search.trim()) {
      params.set('q', search.trim());
    }
    return params.toString();
  }, [actionFilter, entityTypeFilter, search, activeTechnology?.id]);

  useEffect(() => {
    const loadAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<AuditEntry[]>(`/api/governance/audit-log${queryString ? `?${queryString}` : ''}`);
        setEntries(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Auditlog laden mislukt.');
      } finally {
        setLoading(false);
      }
    };
    void loadAudit();
  }, [queryString]);

  const filtered = entries;
  const hasFilters = actionFilter !== 'all' || entityTypeFilter !== 'all' || !!search;

  const panelClass = 'rounded-lt border border-lt-border bg-lt-card p-5 shadow-lt sm:p-6';
  const secondaryButtonClass =
    'inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50';
  const fieldLabelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';
  const fieldControlClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';

  return (
    <section className={panelClass}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-lt-heading">Auditlog</h2>
        <p className="mt-1 text-sm text-lt-muted">
          Chronologische registratie van governance-acties. Alleen-lezen.
        </p>
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
            htmlFor="audit-action-filter"
          >
            Actietype
          </label>
          <select
            id="audit-action-filter"
            className={fieldControlClass}
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
            className={fieldLabelClass}
            htmlFor="audit-type-filter"
          >
            Entiteitstype
          </label>
          <select
            id="audit-type-filter"
            className={fieldControlClass}
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

        <div>
          <label className={fieldLabelClass} htmlFor="audit-search">
            Zoeken
          </label>
          <input
            id="audit-search"
            type="search"
            className={fieldControlClass}
            placeholder="Zoek op entiteit of actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-3 text-sm text-lt-muted">Auditlog laden...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-lt-muted">
          <p className="mb-2 text-sm">
            {activeTechnology
              ? `Geen auditregels gevonden voor ${activeTechnology.naam} met de huidige filters.`
              : 'Geen auditregels gevonden die voldoen aan de filters.'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              className={secondaryButtonClass}
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
        <ol className="mt-2 list-none" aria-label="Auditlog tijdlijn">
          {filtered.map((entry, idx) => (
            <li
              key={entry.id}
              className={`mb-3 flex gap-3${idx < filtered.length - 1 ? ' border-b border-slate-200 pb-3' : ''}`}
            >
              <div
                className="w-28 shrink-0 text-right text-xs text-lt-muted"
              >
                <div>{formatTimestamp(entry.timestamp)}</div>
                <div className="font-medium text-lt-text">
                  {entry.actor}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACTION_BADGE[entry.action] || 'border-slate-300 bg-slate-50 text-slate-700'}`}
                  >
                    {entry.action}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {entry.entityType}
                  </span>
                  {entry.entityId ? (
                    <Link
                      to={`/legaltechnologies/${encodeURIComponent(entry.entityId)}`}
                      className="text-sm font-semibold text-blue-700 underline underline-offset-2"
                    >
                      {entry.entityLabel}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800">{entry.entityLabel}</span>
                  )}
                  {entry.proposalId ? (
                    <Link to="/governance/proposals" className="text-sm text-lt-muted underline underline-offset-2">
                      &rarr; Voorstel {entry.proposalId}
                    </Link>
                  ) : null}
                </div>
                {entry.previousValue || entry.newValue ? (
                  <div className="mb-1 text-sm text-lt-muted">
                    {entry.previousValue ? (
                      <span>
                        Oud: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">{entry.previousValue}</code>
                      </span>
                    ) : null}
                    {entry.previousValue && entry.newValue ? (
                      <span className="mx-1">&rarr;</span>
                    ) : null}
                    {entry.newValue ? (
                      <span>
                        Nieuw: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">{entry.newValue}</code>
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {entry.reason ? (
                  <p className="mb-0 text-sm text-lt-muted">{entry.reason}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link to="/governance/proposals" className={secondaryButtonClass}>
          Ga naar Voorstellen
        </Link>
        <Link to="/governance/comments" className={secondaryButtonClass}>
          Ga naar Opmerkingen
        </Link>
      </div>
    </section>
  );
};

export default AuditLogPage;
