import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTechnology } from './ActiveTechnologyContext';
import { apiFetch } from '../utils/api';

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

type GovernancePermissions = {
  role: string;
  actions: Record<string, boolean>;
};

const STATUS_BADGE: Record<CommentStatus, string> = {
  Nieuw: 'border-blue-200 bg-blue-100 text-blue-800',
  'In behandeling': 'border-amber-200 bg-amber-100 text-amber-900',
  Geaccepteerd: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  Afgewezen: 'border-rose-200 bg-rose-100 text-rose-800',
  Opgelost: 'border-slate-300 bg-slate-100 text-slate-700',
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [permissions, setPermissions] = useState<GovernancePermissions>({ role: 'Viewer', actions: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyCommentId, setBusyCommentId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (activeTechnology?.id) {
      params.set('entityId', activeTechnology.id);
    }
    if (search.trim()) {
      params.set('q', search.trim());
    }
    return params.toString();
  }, [statusFilter, search, activeTechnology?.id]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedComments, fetchedPermissions] = await Promise.all([
        apiFetch<Comment[]>(`/api/governance/comments${queryString ? `?${queryString}` : ''}`),
        apiFetch<GovernancePermissions>('/api/governance/permissions'),
      ]);
      setComments(fetchedComments);
      setPermissions(fetchedPermissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout bij laden van opmerkingen.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const canCreate = !!permissions.actions['comment.create'];
  const canUpdateStatus = !!permissions.actions['comment.update_status'];
  const canEscalate = !!permissions.actions['comment.escalate'];

  const hasFilters = statusFilter !== 'all' || !!search;

  const nextStatusFor = (status: CommentStatus): CommentStatus | null => {
    if (status === 'Nieuw') {
      return 'In behandeling';
    }
    if (status === 'In behandeling') {
      return 'Geaccepteerd';
    }
    if (status === 'Geaccepteerd') {
      return 'Opgelost';
    }
    return null;
  };

  const createComment = async () => {
    if (!canCreate) {
      return;
    }

    const text = window.prompt('Nieuwe opmerking');
    if (!text) {
      return;
    }

    try {
      await apiFetch<Comment>('/api/governance/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          entityLabel: activeTechnology?.naam || 'Onbekende entiteit',
          entityId: activeTechnology?.id,
          entityType: activeTechnology ? 'Technologie' : 'Definitie',
        }),
      });
      await loadComments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opmerking toevoegen mislukt.');
    }
  };

  const updateStatus = async (commentId: string, nextStatus: CommentStatus) => {
    setBusyCommentId(commentId);
    setError(null);
    try {
      await apiFetch<Comment>(`/api/governance/comments/${encodeURIComponent(commentId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadComments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Statuswijziging mislukt.');
    } finally {
      setBusyCommentId(null);
    }
  };

  const escalateToProposal = async (commentId: string) => {
    setBusyCommentId(commentId);
    setError(null);
    try {
      await apiFetch(`/api/governance/comments/${encodeURIComponent(commentId)}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await loadComments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Escaleren naar voorstel mislukt.');
    } finally {
      setBusyCommentId(null);
    }
  };

  const filtered = comments;

  const panelClass = 'rounded-lt border border-lt-border bg-lt-card p-5 shadow-lt sm:p-6';
  const secondaryButtonClass =
    'inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50';
  const primaryOutlineButtonClass =
    'inline-flex items-center rounded-md border border-lt-primaryBorder bg-lt-primarySoft px-3 py-2 text-sm font-medium text-lt-primary shadow-sm transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary disabled:cursor-not-allowed disabled:opacity-50';
  const fieldLabelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600';
  const fieldControlClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-lt-heading">Opmerkingen</h2>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            void createComment();
          }}
          disabled={!canCreate || loading}
          aria-disabled={!canCreate || loading}
          title="Rol vereist: Proposer of hoger"
        >
          + Opmerking toevoegen
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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[220px,minmax(0,300px)]">
        <div>
          <label
            className={fieldLabelClass}
            htmlFor="comments-status-filter"
          >
            Status
          </label>
          <select
            id="comments-status-filter"
            className={fieldControlClass}
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

        <div>
          <label className={fieldLabelClass} htmlFor="comments-search">
            Zoeken
          </label>
          <input
            id="comments-search"
            type="search"
            className={fieldControlClass}
            placeholder="Zoek in opmerkingen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-3 text-sm text-lt-muted">Opmerkingen laden...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-lt-muted">
          <p className="mb-2 text-sm">
            {activeTechnology
              ? `Geen opmerkingen gevonden voor ${activeTechnology.naam} met de huidige filters.`
              : 'Geen opmerkingen gevonden die voldoen aan de filters.'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              className={secondaryButtonClass}
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
        <div className="flex flex-col gap-3">
          {filtered.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[comment.status]}`}
                    >
                      {comment.status}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {comment.entityType}
                    </span>
                    {comment.entityId ? (
                      <Link
                        to={`/legaltechnologies/${encodeURIComponent(comment.entityId)}`}
                        className="text-sm font-semibold text-blue-700 underline underline-offset-2"
                      >
                        {comment.entityLabel}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-slate-800">{comment.entityLabel}</span>
                    )}
                  </div>
                  <p className="mb-1 text-sm text-slate-800">{comment.text}</p>
                  {comment.resolution ? (
                    <p className="mb-0 text-sm italic text-lt-muted">
                      Afhandeling: {comment.resolution}
                    </p>
                  ) : null}
                </div>
                <div
                  className="shrink-0 text-right text-xs text-lt-muted"
                >
                  <div>{comment.submittedAt}</div>
                  <div>{comment.submittedBy}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    const nextStatus = nextStatusFor(comment.status);
                    if (nextStatus) {
                      void updateStatus(comment.id, nextStatus);
                    }
                  }}
                  disabled={!canUpdateStatus || !nextStatusFor(comment.status) || busyCommentId === comment.id}
                  aria-disabled={!canUpdateStatus || !nextStatusFor(comment.status) || busyCommentId === comment.id}
                  title="Rol vereist: Moderator of hoger"
                >
                  Status wijzigen
                </button>
                <button
                  type="button"
                  className={primaryOutlineButtonClass}
                  onClick={() => {
                    void escalateToProposal(comment.id);
                  }}
                  disabled={!canEscalate || busyCommentId === comment.id}
                  aria-disabled={!canEscalate || busyCommentId === comment.id}
                  title="Rol vereist: Proposer of hoger"
                >
                  Escaleer naar Voorstel
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link to="/governance/proposals" className={secondaryButtonClass}>
          Ga naar Voorstellen
        </Link>
        <Link to="/governance/audit-log" className={secondaryButtonClass}>
          Bekijk Auditlog
        </Link>
      </div>
    </section>
  );
};

export default CommentsPage;
