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

  if (selectedIds.length < 2) {
    return (
      <div className="page-card page-card--md">
        <h2 className="page-heading">Vergelijken</h2>
        <p className="text-muted mb-0">Selecteer minimaal 2 technologieen om te vergelijken.</p>
      </div>
    );
  }

  const items = selectedIds.map((id) => details[id] || selectedItems.find((item) => item.id === id));
  const matrixRows = buildCompareMatrixRows(items);
  const diffCount = matrixRows.filter((row) => row.hasDiff).length;

  // Column membership: for each item index, is it in the active taakgroep?
  const activeColumnMask = React.useMemo<boolean[]>(() => {
    if (!activeGroupLabel) return items.map(() => false);
    return items.map((item) => {
      const techName = item?.naam || item?.id || '';
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

  return (
    <div className="page-card page-card--xxl">
      <h2 className="page-heading">Vergelijken</h2>
      {loading ? <p className="text-muted">Vergelijkingsgegevens laden...</p> : null}

      <div className="mb-3">
        <h3 className="h6 mb-2">Geselecteerde technologieen (lijst)</h3>
        <div className="d-flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span key={`${selectedIds[idx]}-chip`} className="badge text-bg-light border p-2">
              {item?.naam || selectedIds[idx]}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h3 className="h6 mb-0">Groepering op taakgroepen</h3>
          {activeGroupLabel ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setActiveGroupLabel(null)}
            >
              Filter wissen: <strong>{activeGroupLabel}</strong>
            </button>
          ) : (
            <span className="small text-muted">Klik een taakgroep om kolommen te markeren</span>
          )}
        </div>
        <div className="row g-2">
          {groupedByTaakgroep.map((group) => {
            const isActive = activeGroupLabel === group.groupLabel;
            return (
              <div key={group.groupLabel} className="col-md-6 col-xl-4">
                <button
                  type="button"
                  className={`compare-taakgroep-card w-100 text-start border rounded p-2 h-100${
                    isActive ? ' is-active' : ''
                  }`}
                  onClick={() => setActiveGroupLabel(isActive ? null : group.groupLabel)}
                  aria-pressed={isActive}
                >
                  <div className="fw-semibold mb-1">{group.groupLabel}</div>
                  <div className="small text-muted">{group.technologies.join(', ') || 'Geen technologieen'}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-muted mb-3">
        Afwijkende eigenschappen: <strong>{diffCount}</strong> van <strong>{matrixRows.length}</strong>
      </p>

      <div className="table-responsive">
        <table className="table table-bordered align-middle compare-matrix-table">
          <thead>
            <tr>
              <th>Eigenschap</th>
              {items.map((item, idx) => {
                const colHighlight = anyColumnActive && activeColumnMask[idx];
                const colDim = anyColumnActive && !activeColumnMask[idx];
                return (
                  <th
                    key={selectedIds[idx]}
                    className={`compare-col-header${colHighlight ? ' is-col-highlight' : ''}${colDim ? ' is-col-dim' : ''}`}
                  >
                    {item?.naam || selectedIds[idx]}
                    {colHighlight ? <span className="compare-col-active-badge ms-1">●</span> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row) => (
              <tr key={row.key} className={`compare-matrix-row${row.hasDiff ? ' is-diff' : ''}`}>
                <th scope="row">
                  {row.label}
                  {row.hasDiff ? <span className="compare-diff-chip ms-2">Afwijking</span> : null}
                </th>
                {row.values.map((value, idx) => {
                  const colHighlight = anyColumnActive && activeColumnMask[idx];
                  const colDim = anyColumnActive && !activeColumnMask[idx];
                  const cellDiff = row.diffMask[idx];
                  const cls = [
                    'compare-matrix-cell',
                    cellDiff ? 'is-diff' : '',
                    colHighlight ? 'is-col-highlight' : '',
                    colDim ? 'is-col-dim' : '',
                  ].filter(Boolean).join(' ');
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
    </div>
  );
};

export default ComparePage;
