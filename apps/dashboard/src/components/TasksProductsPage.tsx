import React from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useRightRail } from './rightRail/RightRailContext';

type TaskType = {
  label: string;
  group_label?: string;
  group_order?: number;
  task_order?: number;
};

type LegalTechnologySummary = {
  id?: string;
  naam: string;
};

type LegalTechnology = {
  id?: string;
  naam: string;
  gebruiksstatus?: string;
  geschikt_voor_taak?: Array<{ taaktype: string }>;
  ondersteuning_voor?: Array<{ beschouwingsniveau: string; modelsoort: string }>;
};

type TaskTypeView = {
  label: string;
  groupLabel: string;
  groupOrder?: number;
  taskOrder?: number;
  technologies: LegalTechnology[];
  products: string[];
};

const TasksProductsPage: React.FC = () => {
  const { setRailState } = useRightRail();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<LegalTechnology[]>([]);
  const [taskTypes, setTaskTypes] = React.useState<TaskType[]>([]);

  const [search, setSearch] = React.useState('');
  const [selectedTaskGroup, setSelectedTaskGroup] = React.useState('');
  const [selectedTaskType, setSelectedTaskType] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        let taskTypeRows: TaskType[] = [];
        try {
          taskTypeRows = await apiFetch<TaskType[]>('/api/legaltechnologies/tasktypes');
        } catch {
          taskTypeRows = [];
        }

        const summaries = await apiFetch<LegalTechnologySummary[]>('/api/legaltechnologies/search?q=');
        const detailRows = await Promise.all(
          summaries
            .filter((row) => !!row.id)
            .map(async (row) => {
              try {
                return await apiFetch<LegalTechnology>(`/api/legaltechnologies/${encodeURIComponent(row.id!)}`);
              } catch {
                return null;
              }
            }),
        );

        if (cancelled) {
          return;
        }

        setTaskTypes(taskTypeRows);
        setItems(detailRows.filter((row): row is LegalTechnology => row !== null));
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Onbekende fout bij laden.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedTaskTypes = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const byLabel = new Map<string, TaskType>();

    taskTypes.forEach((row) => {
      const label = (row.label || '').trim();
      if (label) {
        byLabel.set(label, row);
      }
    });

    items.forEach((item) => {
      (item.geschikt_voor_taak || []).forEach((entry) => {
        const label = (entry.taaktype || '').trim();
        if (label && !byLabel.has(label)) {
          byLabel.set(label, { label });
        }
      });
    });

    const views: TaskTypeView[] = Array.from(byLabel.values()).map((taskType) => {
      const label = (taskType.label || '').trim();
      const technologies = items.filter((item) =>
        (item.geschikt_voor_taak || []).some((entry) => (entry.taaktype || '').trim() === label),
      );

      const products = Array.from(
        new Set(
          technologies
            .flatMap((tech) => (tech.ondersteuning_voor || []).map((o) => (o.modelsoort || '').trim()))
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

      const groupLabel = (taskType.group_label || '').trim() || 'Overige taakgroepen';
      const matchesSearch =
        !q ||
        label.toLowerCase().includes(q) ||
        groupLabel.toLowerCase().includes(q) ||
        products.some((p) => p.toLowerCase().includes(q)) ||
        technologies.some((t) => (t.naam || '').toLowerCase().includes(q));

      return {
        label,
        groupLabel,
        groupOrder: taskType.group_order,
        taskOrder: taskType.task_order,
        technologies,
        products,
        matchesSearch,
      } as TaskTypeView & { matchesSearch: boolean };
    });

    return views
      .filter((view) => view.matchesSearch)
      .sort((a, b) => {
        const ao = a.groupOrder ?? 9999;
        const bo = b.groupOrder ?? 9999;
        if (ao !== bo) return ao - bo;

        const at = a.taskOrder ?? 9999;
        const bt = b.taskOrder ?? 9999;
        if (at !== bt) return at - bt;

        return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
      })
      .map((view) => ({
        label: view.label,
        groupLabel: view.groupLabel,
        groupOrder: view.groupOrder,
        taskOrder: view.taskOrder,
        technologies: view.technologies,
        products: view.products,
      }));
  }, [items, taskTypes, search]);

  const taskGroups = React.useMemo(
    () =>
      Array.from(new Set(groupedTaskTypes.map((row) => row.groupLabel))).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      ),
    [groupedTaskTypes],
  );

  const taskTypesInSelectedGroup = React.useMemo(
    () =>
      groupedTaskTypes.filter((row) => !selectedTaskGroup || row.groupLabel === selectedTaskGroup),
    [groupedTaskTypes, selectedTaskGroup],
  );

  const selectedTaskTypeEntry = React.useMemo(
    () => taskTypesInSelectedGroup.find((row) => row.label === selectedTaskType) || null,
    [taskTypesInSelectedGroup, selectedTaskType],
  );

  const availableProducts = React.useMemo(
    () => selectedTaskTypeEntry?.products || [],
    [selectedTaskTypeEntry],
  );

  const impactedTechnologies = React.useMemo(() => {
    const base = selectedTaskTypeEntry?.technologies || [];
    if (!selectedProduct) {
      return base;
    }

    return base.filter((tech) =>
      (tech.ondersteuning_voor || []).some((o) => (o.modelsoort || '').trim() === selectedProduct),
    );
  }, [selectedTaskTypeEntry, selectedProduct]);

  const warnings = React.useMemo(() => {
    const list: string[] = [];

    if (selectedTaskTypeEntry && availableProducts.length === 0) {
      list.push('Voor dit taaktype is nog geen productkoppeling beschikbaar.');
    }

    if (selectedProduct && impactedTechnologies.length === 0) {
      list.push('Geen technologieen gevonden voor de gekozen productselectie.');
    }

    return list;
  }, [selectedTaskTypeEntry, availableProducts.length, selectedProduct, impactedTechnologies.length]);

  React.useEffect(() => {
    setRailState({
      type: 'relations',
      context: {
      route: 'tasks-products' as const,
      selection: {
        taskGroupLabel: selectedTaskGroup || undefined,
        taskTypeLabel: selectedTaskType || undefined,
        productLabel: selectedProduct || undefined,
        technologyIds: impactedTechnologies.map((tech) => tech.id).filter(Boolean) as string[],
        technologyNames: impactedTechnologies.map((tech) => tech.naam).filter(Boolean),
      },
      metrics: {
        productCount: availableProducts.length,
        technologyCount: impactedTechnologies.length,
        warningCount: warnings.length,
      },
      filters: {
        search,
      },
      },
      commands: {
        selectFirstTaskgroup: () => {
          const first = taskGroups[0] || '';
          setSelectedTaskGroup(first);
          setSelectedTaskType('');
          setSelectedProduct('');
        },
        resetFilters: () => {
          setSearch('');
          setSelectedTaskGroup('');
          setSelectedTaskType('');
          setSelectedProduct('');
        },
      },
    });

    return () => {
      setRailState(null);
    };
  }, [
    selectedTaskGroup,
    selectedTaskType,
    selectedProduct,
    impactedTechnologies,
    availableProducts.length,
    warnings.length,
    search,
    taskGroups,
    setRailState,
  ]);

  React.useEffect(() => {
    if (selectedTaskGroup && !taskGroups.includes(selectedTaskGroup)) {
      setSelectedTaskGroup('');
    }
  }, [selectedTaskGroup, taskGroups]);

  React.useEffect(() => {
    if (selectedTaskType && !taskTypesInSelectedGroup.some((row) => row.label === selectedTaskType)) {
      setSelectedTaskType('');
      setSelectedProduct('');
    }
  }, [selectedTaskType, taskTypesInSelectedGroup]);

  React.useEffect(() => {
    if (selectedProduct && !availableProducts.includes(selectedProduct)) {
      setSelectedProduct('');
    }
  }, [selectedProduct, availableProducts]);

  if (loading) {
    return (
      <div className="page-card page-card--md">
        <p className="text-muted mb-0">Taken {'->'} Producten laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-card page-card--md">
        <h2 className="page-heading">Taken {'->'} Producten</h2>
        <div className="alert alert-danger mb-0">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-card page-card--xxl">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h2 className="page-heading mb-0">Taken {'->'} Producten</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => {
            setSearch('');
            setSelectedTaskGroup('');
            setSelectedTaskType('');
            setSelectedProduct('');
          }}
        >
          Reset selectie
        </button>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-3">
          <label className="form-label small mb-1">Zoekterm</label>
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Zoek op taaktype, product of technologie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label small mb-1">Taakgroep</label>
          <select
            className="form-select form-select-sm"
            value={selectedTaskGroup}
            onChange={(e) => {
              setSelectedTaskGroup(e.target.value);
              setSelectedTaskType('');
              setSelectedProduct('');
            }}
          >
            <option value="">Alle</option>
            {taskGroups.map((groupLabel) => (
              <option key={groupLabel} value={groupLabel}>{groupLabel}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label small mb-1">Taaktype</label>
          <select
            className="form-select form-select-sm"
            value={selectedTaskType}
            onChange={(e) => {
              setSelectedTaskType(e.target.value);
              setSelectedProduct('');
            }}
          >
            <option value="">Selecteer taaktype</option>
            {taskTypesInSelectedGroup.map((row) => (
              <option key={row.label} value={row.label}>{row.label}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label small mb-1">Product</label>
          <select
            className="form-select form-select-sm"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            disabled={!selectedTaskType}
          >
            <option value="">Alle producten</option>
            {availableProducts.map((product) => (
              <option key={product} value={product}>{product}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTaskType && !selectedProduct ? (
        <div className="alert alert-info mb-3">
          Selecteer eerst een taaktype of product om context en impact te tonen.
        </div>
      ) : null}

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="table-responsive border rounded">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Technologie</th>
                  <th>Status</th>
                  <th>Taaktypen</th>
                  <th>Producten</th>
                  <th className="text-end">Actie</th>
                </tr>
              </thead>
              <tbody>
                {impactedTechnologies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      Geen technologieen voor de huidige taak/product context.
                    </td>
                  </tr>
                ) : (
                  impactedTechnologies.map((tech) => (
                    <tr key={tech.id || tech.naam}>
                      <td>
                        <div className="fw-semibold">{tech.naam}</div>
                        <small className="text-muted">{tech.id || '-'}</small>
                      </td>
                      <td>{tech.gebruiksstatus || '-'}</td>
                      <td>{(tech.geschikt_voor_taak || []).map((x) => x.taaktype).filter(Boolean).join(', ') || '-'}</td>
                      <td>{(tech.ondersteuning_voor || []).map((x) => x.modelsoort).filter(Boolean).join(', ') || '-'}</td>
                      <td className="text-end">
                        {tech.id ? (
                          <Link className="btn btn-sm btn-outline-primary" to={`/legaltechnologies/${encodeURIComponent(tech.id)}`}>
                            Open detail
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12 col-xl-4 d-grid gap-2">
          <div className="border rounded p-3">
            <div className="fw-semibold mb-1">Selectieoverzicht</div>
            <div className="small text-muted mb-1">Taakgroep: {selectedTaskGroup || 'Niet geselecteerd'}</div>
            <div className="small text-muted mb-1">Taaktype: {selectedTaskType || 'Niet geselecteerd'}</div>
            <div className="small text-muted">Product: {selectedProduct || 'Niet geselecteerd'}</div>
          </div>
          <div className="border rounded p-3">
            <div className="fw-semibold mb-1">Signalen</div>
            {warnings.length === 0 ? (
              <div className="small text-success">Geen signalen voor de huidige selectie.</div>
            ) : (
              <ul className="small mb-0 ps-3">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksProductsPage;
