import React from 'react';
import { useCompareSelection } from './CompareSelectionContext';
import { apiFetch } from '../utils/api';
import { buildCompareMatrixRows } from '../utils/compareMatrix';

type CompareDetail = {
  id?: string;
  naam: string;
  omschrijving?: string;
  gebruiksstatus?: string;
  licentievorm?: string;
  versienummer?: string;
  subtype?: string;
  beoogde_gebruikers?: string[];
  geboden_functionaliteit?: string[];
  geschikt_voor_taak?: { omschrijving: string; taaktype: string }[];
  technologietype?: string;
};

type TaskTypeMeta = {
  label: string;
  group_label?: string;
};

const ComparePage: React.FC = () => {
  const { selectedIds, selectedItems } = useCompareSelection();
  const [details, setDetails] = React.useState<Record<string, CompareDetail>>({});
  const [taskTypeMeta, setTaskTypeMeta] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [activeGroupLabel, setActiveGroupLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selectedIds.length === 0) {
      setDetails({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      selectedIds.map(async (id) => {
        try {
          const detail = await apiFetch<CompareDetail>(`/api/legaltechnologies/${encodeURIComponent(id)}`);
          return [id, detail] as const;
        } catch {
          return null;
        }
      }),
    )
      .then((rows) => {
        if (cancelled) return;
        const next: Record<string, CompareDetail> = {};
        rows.forEach((entry) => {
          if (!entry) return;
          const [id, detail] = entry;
          next[id] = detail;
        });
        setDetails(next);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  React.useEffect(() => {
    let cancelled = false;

    apiFetch<TaskTypeMeta[]>('/api/legaltechnologies/tasktypes')
      .then((rows) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        rows.forEach((row) => {
          const label = (row.label || '').trim();
          if (!label) return;
          next[label] = (row.group_label || '').trim() || 'Overige taakgroepen';
        });
        setTaskTypeMeta(next);
      })
      .catch(() => {
        if (!cancelled) {
          setTaskTypeMeta({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const items = selectedIds.map((id) => details[id] || selectedItems.find((item) => item.id === id));
  const matrixRows = buildCompareMatrixRows(items);
  const diffCount = matrixRows.filter((row) => row.hasDiff).length;

  const panelClass = 'rounded-lt border border-lt-border bg-lt-card p-5 shadow-lt sm:p-6';
  const headingClass = 'text-lg font-semibold text-lt-heading';
  const subheadingClass = 'text-sm font-semibold uppercase tracking-wide text-slate-600';
  const mutedTextClass = 'text-sm text-lt-muted';
  const activeGroupButtonClass =
    'inline-flex items-center rounded-md border border-lt-primaryBorder bg-lt-primarySoft px-3 py-1.5 text-sm font-medium text-lt-primary shadow-sm transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';

  // Column membership: for each item index, is it in the active taakgroep?
  const activeColumnMask = React.useMemo<boolean[]>(() => {
    if (!activeGroupLabel) return items.map(() => false);
    return items.map((item) => {
      const taaktypes = (item?.geschikt_voor_taak || []).map((e) => (e.taaktype || '').trim()).filter(Boolean);
      if (taaktypes.length === 0) {
        return activeGroupLabel === 'Overige taakgroepen';
      }
      return taaktypes.some((tt) => (taskTypeMeta[tt] || 'Overige taakgroepen') === activeGroupLabel);
    });
  }, [activeGroupLabel, items, taskTypeMeta]);

  const anyColumnActive = activeColumnMask.some(Boolean);

  const groupedByTaakgroep = React.useMemo(() => {
    const groups = new Map<string, Set<string>>();

    items.forEach((item) => {
      const techName = item?.naam || item?.id || 'Onbekende technologie';
      const taaktypes = (item?.geschikt_voor_taak || []).map((entry) => (entry.taaktype || '').trim()).filter(Boolean);

      if (taaktypes.length === 0) {
        if (!groups.has('Overige taakgroepen')) {
          groups.set('Overige taakgroepen', new Set<string>());
        }
        groups.get('Overige taakgroepen')!.add(techName);
        return;
      }

      taaktypes.forEach((taaktype) => {
        const groupLabel = taskTypeMeta[taaktype] || 'Overige taakgroepen';
        if (!groups.has(groupLabel)) {
          groups.set(groupLabel, new Set<string>());
        }
        groups.get(groupLabel)!.add(techName);
      });
    });

    return Array.from(groups.entries())
      .map(([groupLabel, technologies]) => ({
        groupLabel,
        technologies: Array.from(technologies).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
      }))
      .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel, undefined, { sensitivity: 'base' }));
  }, [items, taskTypeMeta]);

  if (selectedIds.length < 2) {
    return (
      <section className={panelClass}>
        <h2 className={headingClass}>Vergelijken</h2>
        <p className="mt-3 text-sm text-lt-muted">Selecteer minimaal 2 technologieen om te vergelijken.</p>
      </section>
    );
  }

  return (
    <section className={panelClass}>
      <h2 className={headingClass}>Vergelijken</h2>
      {loading ? <p className="mt-3 text-sm text-lt-muted">Vergelijkingsgegevens laden...</p> : null}

      <section className="mt-5">
        <h3 className={subheadingClass}>Geselecteerde technologieen (lijst)</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span
              key={`${selectedIds[idx]}-chip`}
              className="inline-flex items-center rounded-full border border-lt-primaryBorder bg-lt-primarySoft px-3 py-1.5 text-sm font-medium text-lt-text"
            >
              {item?.naam || selectedIds[idx]}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className={subheadingClass}>Groepering op taakgroepen</h3>
          {activeGroupLabel ? (
            <button
              type="button"
              className={activeGroupButtonClass}
              onClick={() => setActiveGroupLabel(null)}
            >
              Filter wissen: <strong>{activeGroupLabel}</strong>
            </button>
          ) : (
            <span className={mutedTextClass}>Klik een taakgroep om kolommen te markeren</span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {groupedByTaakgroep.map((group) => {
            const isActive = activeGroupLabel === group.groupLabel;
            return (
              <button
                key={group.groupLabel}
                type="button"
                className={`h-full rounded-lg border p-3 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary ${
                  isActive
                    ? 'border-lt-primaryBorder bg-lt-primarySoft'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => setActiveGroupLabel(isActive ? null : group.groupLabel)}
                aria-pressed={isActive}
              >
                <div className="text-sm font-semibold text-slate-800">{group.groupLabel}</div>
                <div className="mt-1 text-sm text-lt-muted">{group.technologies.join(', ') || 'Geen technologieen'}</div>
              </button>
            );
          })}
        </div>
      </section>

      <p className="mt-6 text-sm text-lt-muted">
        Afwijkende eigenschappen: <strong>{diffCount}</strong> van <strong>{matrixRows.length}</strong>
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">
                Eigenschap
              </th>
              {items.map((item, idx) => {
                const colHighlight = anyColumnActive && activeColumnMask[idx];
                const colDim = anyColumnActive && !activeColumnMask[idx];
                return (
                  <th
                    key={selectedIds[idx]}
                    className={`border-b border-slate-200 px-3 py-2 text-left font-semibold ${
                      colHighlight
                        ? 'bg-lt-primarySoft text-lt-primary'
                        : colDim
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item?.naam || selectedIds[idx]}
                    {colHighlight ? <span className="ml-1 text-xs">●</span> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row) => (
              <tr key={row.key} className={row.hasDiff ? 'bg-amber-50/40' : 'bg-white'}>
                <th
                  scope="row"
                  className={`sticky left-0 z-10 border-b border-slate-200 px-3 py-2 text-left font-semibold ${
                    row.hasDiff ? 'bg-amber-100/70 text-amber-900' : 'bg-white text-slate-700'
                  }`}
                >
                  {row.label}
                  {row.hasDiff ? (
                    <span className="ml-2 inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      Afwijking
                    </span>
                  ) : null}
                </th>
                {row.values.map((value, idx) => {
                  const colHighlight = anyColumnActive && activeColumnMask[idx];
                  const colDim = anyColumnActive && !activeColumnMask[idx];
                  const cellDiff = row.diffMask[idx];
                  const cls = [
                    'border-b border-slate-200 px-3 py-2 align-top',
                    cellDiff ? 'bg-amber-100/60 text-amber-900' : 'text-slate-700',
                    colHighlight ? 'bg-lt-primarySoft/70' : '',
                    colDim ? 'bg-slate-100 text-slate-400' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <td key={`${row.key}-${selectedIds[idx]}`} className={cls}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ComparePage;
