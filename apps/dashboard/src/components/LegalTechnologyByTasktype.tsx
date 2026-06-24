import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';
import LegalTechnologyForm, { selectForEdit } from './LegalTechnologyForm';
import { useCompareSelection } from './CompareSelectionContext';
import { useActiveTechnology } from './ActiveTechnologyContext';
import { useRightRail } from './rightRail/RightRailContext';

type OndersteuningVoor = {
  beschouwingsniveau: string;
  modelsoort: string;
};

type GeschiktVoorTaak = {
  omschrijving: string;
  taaktype: string;
};

type LegalTechnology = {
  id?: string;
  iri?: string;
  subtype?: 'JuridischeTechnologie' | 'Methode' | 'Standaard' | 'Tool';
  abbrevation?: string;
  versienummer?: string;
  naam: string;
  omschrijving?: string;
  gebruiksstatus: string;
  licentievorm: string;
  beoogde_gebruikers: string[];
  geboden_functionaliteit: string[];
  ondersteuning_voor: OndersteuningVoor[];
  geschikt_voor_taak: GeschiktVoorTaak[];
};

type LegalTechnologySummary = {
  id?: string;
  naam: string;
};

type TaskType = {
  iri: string;
  label: string;
  description?: string;
  group_iri?: string;
  group_label?: string;
  group_order?: number;
  task_order?: number;
};

type EnumerationGroup = {
  name: string;
  values: string[];
};

type TaskGroupFallback = {
  groupLabel: string;
  groupOrder: number;
  tasktypes: string[];
};

const TASK_GROUP_FALLBACK: TaskGroupFallback[] = [
  {
    groupLabel: 'Taakgroep 1',
    groupOrder: 0,
    tasktypes: [
      'Opstellen regeltekst',
      'Opdracht orientering',
      'Verzamelen bronmateriaal',
    ],
  },
  {
    groupLabel: 'Taakgroep 2',
    groupOrder: 1,
    tasktypes: [
      'Analyseren regeltekst',
      'Interpreteren en expliciteren',
      'Begrip definiëren',
    ],
  },
  {
    groupLabel: 'Taakgroep 3',
    groupOrder: 2,
    tasktypes: [
      'Specificeren gegevens(behoefte)',
      'Specificeren regels',
      'Specificeren processen',
    ],
  },
  {
    groupLabel: 'Taakgroep 4',
    groupOrder: 3,
    tasktypes: [
      'Valideren specificaties',
      'Geautomatiseerde regeluitvoering',
      'Beslisondersteuning',
      'Evaluatie',
    ],
  },
];

const TASKTYPE_FALLBACK_INDEX = (() => {
  const index = new Map<string, { groupLabel: string; groupOrder: number; taskOrder: number }>();
  TASK_GROUP_FALLBACK.forEach((group) => {
    group.tasktypes.forEach((tasktype, taskOrder) => {
      index.set(tasktype, {
        groupLabel: group.groupLabel,
        groupOrder: group.groupOrder,
        taskOrder,
      });
    });
  });
  return index;
})();

const STATUS_CLASSNAMES: Record<string, string> = {
  'In gebruik': 'lt-status-badge--success',
  Voorstel: 'lt-status-badge--warning',
  'Work in progress': 'lt-status-badge--info',
};

const SUBTYPE_CLASSNAMES: Record<string, string> = {
  Methode: 'lt-subtype-badge--method',
  Standaard: 'lt-subtype-badge--standard',
  Tool: 'lt-subtype-badge--tool',
  JuridischeTechnologie: 'lt-subtype-badge--technology',
};

const StatusBadge: React.FC<{ value: string }> = ({ value }) => {
  return (
    <span className={`badge rounded-pill border lt-status-badge ${STATUS_CLASSNAMES[value] ?? 'lt-status-badge--default'}`}>
      {value || '-'}
    </span>
  );
};

const SubtypeBadge: React.FC<{ value?: string }> = ({ value }) => {
  const key = value ?? 'JuridischeTechnologie';
  const label = key === 'JuridischeTechnologie' ? 'Technologie' : key;
  return (
    <span className={`badge rounded-pill border lt-subtype-badge ${SUBTYPE_CLASSNAMES[key] ?? 'lt-subtype-badge--default'}`}>
      {label}
    </span>
  );
};

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 11.5V14h2.5l7.1-7.1-2.5-2.5L2 11.5z" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8.9 3.6l2.5 2.5 1.1-1.1a.9.9 0 0 0 0-1.3l-1.2-1.2a.9.9 0 0 0-1.3 0L8.9 3.6z" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2.7 4.5h10.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M6.2 2.8h3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M4.4 4.5l.5 8.1c.03.5.45.9.95.9h4.4c.5 0 .92-.4.95-.9l.5-8.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M6.7 6.6v4.8M9.3 6.6v4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="4.3" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10.5 10.5L13.6 13.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

type LegalTechnologyByTasktypeProps = {
  contextMode?: 'internal' | 'right-rail';
};

const LegalTechnologyByTasktype: React.FC<LegalTechnologyByTasktypeProps> = ({ contextMode = 'internal' }) => {
  const { selectedSet, selectedCount, maxSelection, toggleSelection, removeSelection } = useCompareSelection();
  const { setActiveTechnology } = useActiveTechnology();
  const { setRailState } = useRightRail();
  const [items, setItems] = useState<LegalTechnology[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'lijst' | 'taaktype'>('taaktype');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  const [enumGebruikersgroepen, setEnumGebruikersgroepen] = useState<string[]>([]);
  const [enumLicentievormen, setEnumLicentievormen] = useState<string[]>([]);
  const [enumBeschouwingsniveaus, setEnumBeschouwingsniveaus] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [gebruikersgroepFilter, setGebruikersgroepFilter] = useState('');
  const [licentievormFilter, setLicentievormFilter] = useState('');
  const [beschouwingsniveauFilter, setBeschouwingsniveauFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      let taskTypeValues: TaskType[] = [];
      try {
        taskTypeValues = await apiFetch<TaskType[]>('/api/legaltechnologies/tasktypes');
        setTaskTypes(taskTypeValues);
      } catch {
        // Keep UI functional if task type metadata is unavailable.
      }

      try {
        const groups = await apiFetch<EnumerationGroup[]>('/api/legaltechnologies/enumerations');
        const byName = new Map(groups.map((group) => [group.name, group.values ?? []]));
        setEnumGebruikersgroepen((byName.get('Gebruikersgroepen') ?? []).filter(Boolean));
        setEnumLicentievormen((byName.get('Licentievormen') ?? []).filter(Boolean));
        setEnumBeschouwingsniveaus((byName.get('Beschouwingsniveaus') ?? []).filter(Boolean));
      } catch {
        // Keep UI functional if enumeration endpoint is unavailable.
      }

      const summaries = await apiFetch<LegalTechnologySummary[]>('/api/legaltechnologies/search?q=');
      const details = await Promise.all(
        summaries
          .filter((summary) => !!summary.id)
          .map(async (summary) => {
            try {
              return await apiFetch<LegalTechnology>(`/api/legaltechnologies/${encodeURIComponent(summary.id!)}`);
            } catch {
              return null;
            }
          }),
      );

      const resolved = details.filter((item): item is LegalTechnology => item !== null);
      setItems(resolved);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleEdit = (id?: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch<LegalTechnology>(`/api/legaltechnologies/${id}`)
      .then((tech) => {
        const safeSubtype =
          tech.subtype === 'Methode' || tech.subtype === 'Standaard' || tech.subtype === 'Tool'
            ? tech.subtype
            : 'Methode';
        selectForEdit({ ...tech, subtype: safeSubtype });
        setShowForm(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Weet je zeker dat je deze technologie wilt verwijderen?')) return;
    try {
      await apiFetch(`/api/legaltechnologies/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.id !== id));
      removeSelection(id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const closeFormModal = () => {
    setShowForm(false);
  };

  const handleSetContext = (tech: LegalTechnology, fallbackId: string) => {
    setActiveTechnology({
      id: tech.id || fallbackId,
      iri: tech.iri,
      naam: tech.naam,
      omschrijving: tech.omschrijving,
      gebruiksstatus: tech.gebruiksstatus,
      licentievorm: tech.licentievorm,
      subtype: tech.subtype,
      versienummer: tech.versienummer,
      beoogdeGebruikers: tech.beoogde_gebruikers || [],
      gebodenFunctionaliteit: tech.geboden_functionaliteit || [],
      taaktypes: (tech.geschikt_voor_taak || []).map((item) => item.taaktype).filter(Boolean),
      ondersteuningsniveaus: tech.ondersteuning_voor || [],
    });
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchAll();
  };

  const gebruikersgroepen = useMemo(
    () =>
      Array.from(
        new Set([
          ...enumGebruikersgroepen,
          ...items.flatMap((item) => (item.beoogde_gebruikers ?? []).filter(Boolean)),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [items, enumGebruikersgroepen],
  );

  const licentievormen = useMemo(
    () =>
      Array.from(new Set([...enumLicentievormen, ...items.map((item) => item.licentievorm).filter(Boolean)])).sort((a, b) =>
        a.localeCompare(b),
      ),
    [items, enumLicentievormen],
  );

  const beschouwingsniveaus = useMemo(
    () =>
      Array.from(
        new Set([
          ...enumBeschouwingsniveaus,
          ...items.flatMap((item) => (item.ondersteuning_voor ?? []).map((o) => o.beschouwingsniveau).filter(Boolean)),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [items, enumBeschouwingsniveaus],
  );

  const matchesTechnologyFilters = useCallback((item: LegalTechnology, q: string) => {
    const taaktypen = (item.geschikt_voor_taak ?? []).map((t) => t.taaktype).filter(Boolean);
    const matchesSearch =
      !q ||
      item.naam?.toLowerCase().includes(q) ||
      item.omschrijving?.toLowerCase().includes(q) ||
      taaktypen.some((taaktype) => taaktype.toLowerCase().includes(q));

    const matchesGebruikersgroep = !gebruikersgroepFilter || (item.beoogde_gebruikers ?? []).includes(gebruikersgroepFilter);
    const matchesLicentievorm = !licentievormFilter || item.licentievorm === licentievormFilter;
    const matchesBeschouwingsniveau =
      !beschouwingsniveauFilter ||
      (item.ondersteuning_voor ?? []).some((ov) => ov.beschouwingsniveau === beschouwingsniveauFilter);

    return matchesSearch && matchesGebruikersgroep && matchesLicentievorm && matchesBeschouwingsniveau;
  }, [gebruikersgroepFilter, licentievormFilter, beschouwingsniveauFilter]);

  const groupedByTasktype = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredItems = items.filter((item) => matchesTechnologyFilters(item, q));
    const knownTaskTypes = new Map(taskTypes.map((taskType) => [taskType.label, taskType]));

    filteredItems.forEach((item) => {
      const taaktypen = (item.geschikt_voor_taak ?? []).map((t) => t.taaktype).filter(Boolean);
      taaktypen.forEach((taaktype) => {
        if (!knownTaskTypes.has(taaktype)) {
          knownTaskTypes.set(taaktype, {
            iri: taaktype,
            label: taaktype,
            description: '',
          });
        }
      });
    });

    return Array.from(knownTaskTypes.values())
      .map((taskType) => {
        const technologies = filteredItems
          .filter((item) => (item.geschikt_voor_taak ?? []).some((entry) => entry.taaktype === taskType.label))
          .sort((a, b) => a.naam.localeCompare(b.naam));

        const taskTypeMatchesSearch =
          !q ||
          taskType.label.toLowerCase().includes(q) ||
          (taskType.description ?? '').toLowerCase().includes(q);

        const fallback = TASKTYPE_FALLBACK_INDEX.get(taskType.label);

        return {
          taaktype: taskType.label,
          description: taskType.description ?? '',
          taskOrder: taskType.task_order ?? fallback?.taskOrder,
          groupOrder: taskType.group_order ?? fallback?.groupOrder,
          groupLabel: (taskType.group_label || '').trim() || fallback?.groupLabel || 'Overige taaktypen',
          groupIri: (taskType.group_iri || '').trim(),
          technologies,
          visible: taskTypeMatchesSearch || technologies.length > 0,
        };
      })
      .filter((group) => group.visible);
  }, [items, taskTypes, search, matchesTechnologyFilters]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...items.filter((item) => matchesTechnologyFilters(item, q))].sort((a, b) =>
      a.naam.localeCompare(b.naam, undefined, { sensitivity: 'base' }),
    );
  }, [items, search, matchesTechnologyFilters]);

  const groupedByTaskGroup = useMemo(() => {
    const groups = new Map<
      string,
      {
        groupLabel: string;
        groupOrder?: number;
        tasktypes: Array<{
          taaktype: string;
          description: string;
          taskOrder?: number;
          technologies: LegalTechnology[];
        }>;
      }
    >();

    groupedByTasktype.forEach((tasktypeGroup) => {
      const key = tasktypeGroup.groupIri || tasktypeGroup.groupLabel;
      if (!groups.has(key)) {
        groups.set(key, {
          groupLabel: tasktypeGroup.groupLabel,
          groupOrder: tasktypeGroup.groupOrder,
          tasktypes: [],
        });
      }
      groups.get(key)!.tasktypes.push(tasktypeGroup);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        tasktypes: [...group.tasktypes].sort((a, b) => {
          const ao = a.taskOrder;
          const bo = b.taskOrder;
          if (ao !== undefined && bo !== undefined && ao !== bo) {
            return ao - bo;
          }
          if (ao !== undefined && bo === undefined) {
            return -1;
          }
          if (ao === undefined && bo !== undefined) {
            return 1;
          }
          return a.taaktype.localeCompare(b.taaktype, undefined, { sensitivity: 'base' });
        }),
      }))
      .sort(
        (a, b) =>
          (a.groupOrder ?? 9999) - (b.groupOrder ?? 9999) ||
          a.groupLabel.localeCompare(b.groupLabel, undefined, { numeric: true, sensitivity: 'base' }),
      );
  }, [groupedByTasktype]);

  const scrollToGroup = (groupLabel: string) => {
    setActiveGroup(groupLabel);

    const container = contentScrollRef.current;
    const element = sectionRefs.current[groupLabel];
    if (!element) return;

    if (container) {
      const y = Math.max(0, element.offsetTop - 12);
      container.scrollTo({ top: y, behavior: 'smooth' });
      return;
    }

    const yOffset = -84;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  useEffect(() => {
    if (contextMode !== 'right-rail') {
      return;
    }

    setRailState({
      type: 'tasktype',
      context: {
        taskGroups: groupedByTaskGroup.map((group) => ({
          groupLabel: group.groupLabel,
          tasktypeCount: group.tasktypes.length,
        })),
        activeGroup,
        filters: {
          search,
          gebruikersgroepFilter,
          licentievormFilter,
          beschouwingsniveauFilter,
        },
        options: {
          gebruikersgroepen,
          licentievormen,
          beschouwingsniveaus,
        },
        summary: {
          tasktypeCount: groupedByTasktype.length,
          groupCount: groupedByTaskGroup.length,
        },
      },
      commands: {
        clearFilters: () => {
        setSearch('');
        setGebruikersgroepFilter('');
        setLicentievormFilter('');
        setBeschouwingsniveauFilter('');
        },
        setFilter: (key, value) => {
          const nextValue = value || '';
          if (key === 'search') {
            setSearch(nextValue);
          } else if (key === 'gebruikersgroepFilter') {
            setGebruikersgroepFilter(nextValue);
          } else if (key === 'licentievormFilter') {
            setLicentievormFilter(nextValue);
          } else if (key === 'beschouwingsniveauFilter') {
            setBeschouwingsniveauFilter(nextValue);
          }
        },
      },
    });

    return () => {
      setRailState(null);
    };
  }, [
    contextMode,
    groupedByTaskGroup,
    activeGroup,
    search,
    gebruikersgroepFilter,
    licentievormFilter,
    beschouwingsniveauFilter,
    gebruikersgroepen,
    licentievormen,
    beschouwingsniveaus,
    groupedByTasktype.length,
    setRailState,
  ]);

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5 text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Laden...
        </div>
      </div>
    );
  }

  return (
    <div className="d-grid gap-3">
      <section className="lt-tasktype-header-card">
        <div className="lt-tasktype-header-inner px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h3 className="lt-tasktype-title mb-1 fw-semibold">Juridische Technologieen</h3>
            <p className="lt-tasktype-subtitle mb-0 small">
              {viewMode === 'lijst'
                ? 'Alle technologieen in een platte lijst'
                : 'Gegroepeerd naar taakstructuur'}
            </p>
          </div>
          <div className="btn-group" role="group" aria-label="Weergave">
            <button
              type="button"
              className={`btn btn-sm ${
                viewMode === 'lijst' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              onClick={() => setViewMode('lijst')}
            >
              Lijst
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                viewMode === 'taaktype' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              onClick={() => setViewMode('taaktype')}
            >
              Per taaktype
            </button>
          </div>
        </div>
      </section>

      {error && <div className="alert alert-danger mb-0">{error}</div>}

      {showForm && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Juridische technologie bewerken</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closeFormModal} />
                </div>
                <div className="modal-body">
                  <LegalTechnologyForm onSuccess={handleFormSuccess} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeFormModal}>
                    Sluiten
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeFormModal} />
        </>
      )}

      <div className="lt-tasktype-layout row g-3 align-items-start">
        {contextMode !== 'right-rail' && viewMode === 'taaktype' ? (
          <aside className="lt-tasktype-sidebar col-12 col-lg-auto h-100">
            <div className="lt-tasktype-sticky d-grid gap-3 position-sticky">
              <section className="lt-tasktype-card card">
                <div className="lt-tasktype-card-header card-header py-3 border-bottom-0">
                  <div className="lt-tasktype-card-header-title small fw-semibold">Taakgroepen</div>
                </div>
                <div className="card-body py-2">
                  <div className="d-grid gap-2">
                    {groupedByTaskGroup.map((taskGroup, groupIdx) => (
                      <button
                        key={`nav-${taskGroup.groupLabel}-${groupIdx}`}
                        type="button"
                        className={`lt-taskgroup-btn btn text-start rounded-3 p-2 ${
                          activeGroup === taskGroup.groupLabel ? 'is-active' : ''
                        }`}
                        onClick={() => scrollToGroup(taskGroup.groupLabel)}
                        title={`Ga naar ${taskGroup.groupLabel}`}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="lt-taskgroup-label small fw-semibold text-truncate">{taskGroup.groupLabel}</div>
                          <div className="d-inline-flex align-items-center gap-2">
                            <span className="lt-taskgroup-count badge rounded-pill">
                              {taskGroup.tasktypes.length}
                            </span>
                            <span className={`lt-taskgroup-chevron ${activeGroup === taskGroup.groupLabel ? 'is-active' : ''}`}>
                              <ChevronRightIcon />
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="lt-tasktype-card card">
                <div className="lt-tasktype-card-header card-header py-3 border-bottom-0">
                  <div className="lt-tasktype-card-header-title small fw-semibold">Filters</div>
                </div>
                <div className="card-body d-grid gap-3">
                  <div>
                    <label className="lt-filter-label form-label small mb-1">Zoekterm</label>
                    <div className="lt-filter-search-wrap">
                      <span className="lt-filter-search-icon" aria-hidden="true"><SearchIcon /></span>
                      <input
                        type="search"
                        className="form-control form-control-sm lt-filter-search-input"
                        placeholder="Zoek..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="lt-filter-label form-label small mb-1">Gebruikersgroep</label>
                    <select
                      className="form-select form-select-sm"
                      value={gebruikersgroepFilter}
                      onChange={(e) => setGebruikersgroepFilter(e.target.value)}
                    >
                      <option value="">Alle</option>
                      {gebruikersgroepen.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="lt-filter-label form-label small mb-1">Licentievorm</label>
                    <select
                      className="form-select form-select-sm"
                      value={licentievormFilter}
                      onChange={(e) => setLicentievormFilter(e.target.value)}
                    >
                      <option value="">Alle</option>
                      {licentievormen.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="lt-filter-label form-label small mb-1">Beschouwingsniveau</label>
                    <select
                      className="form-select form-select-sm"
                      value={beschouwingsniveauFilter}
                      onChange={(e) => setBeschouwingsniveauFilter(e.target.value)}
                    >
                      <option value="">Alle</option>
                      {beschouwingsniveaus.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lt-filter-summary border-top pt-3 small">
                    {viewMode === 'lijst' ? (
                      <><span className="lt-filter-summary-strong fw-semibold">{filteredItems.length}</span> technologie{filteredItems.length !== 1 ? 'en' : ''}</>
                    ) : (
                      <><span className="lt-filter-summary-strong fw-semibold">{groupedByTasktype.length}</span> taaktypen in{' '}
                      <span className="lt-filter-summary-strong fw-semibold">{groupedByTaskGroup.length}</span> groepen</>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </aside>
        ) : null}

        <div className={`lt-tasktype-content ${contextMode === 'right-rail' ? 'col-12' : 'col'}`} ref={contentScrollRef}>
          {viewMode === 'lijst' ? (
            filteredItems.length === 0 ? (
              <section className="card border-0 shadow-sm">
                <div className="card-body text-center py-4 text-muted">
                  Geen resultaten voor deze zoek/filter-combinatie.
                </div>
              </section>
            ) : (
              <section className="card">
                <div className="card-header py-3 border-bottom d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Alle technologieen</span>
                  <span className="badge rounded-pill bg-light text-dark border">{filteredItems.length}</span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="lt-table-head">Naam</th>
                          <th className="lt-table-head">Type</th>
                          <th className="lt-table-head">Status</th>
                          <th className="lt-table-head">Licentie</th>
                          <th className="lt-table-head">Versie</th>
                          <th className="lt-table-head text-end">Acties</th>
                        </tr>
                      </thead>
                      <tbody className="border-top-0">
                        {filteredItems.map((tech, techIdx) => {
                          const compareId = tech.id || '';
                          const contextId = tech.id || `list-${techIdx}`;
                          const isSelected = compareId ? selectedSet.has(compareId) : false;
                          const disableSelect = !isSelected && selectedCount >= maxSelection;
                          return (
                            <tr
                              key={tech.id || `list-${techIdx}`}
                              className={`align-middle lt-tech-row${isSelected ? ' is-compare-selected' : ''}`}
                            >
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-link p-0 fw-semibold text-decoration-none text-start lt-context-name-link"
                                  onClick={() => handleSetContext(tech, contextId)}
                                >
                                  {tech.naam}
                                  <span className="lt-context-name-hint ms-1" aria-hidden="true">
                                    <span className="lt-context-name-hint-icon">›</span>
                                    <span className="lt-context-name-hint-label">context</span>
                                  </span>
                                </button>
                                <small className="text-muted">{tech.abbrevation || contextId}</small>
                              </td>
                              <td><SubtypeBadge value={tech.subtype} /></td>
                              <td><StatusBadge value={tech.gebruiksstatus} /></td>
                              <td>{tech.licentievorm || '-'}</td>
                              <td>{tech.versienummer || '-'}</td>
                              <td className="text-end text-nowrap">
                                <div className="d-inline-flex align-items-center gap-1">
                                  <div className="form-check form-switch lt-compare-switch-cell mb-0">
                                    <input
                                      type="checkbox"
                                      role="switch"
                                      className="form-check-input lt-compare-switch-input"
                                      checked={isSelected}
                                      disabled={!compareId || disableSelect}
                                      aria-label={`Vergelijk ${tech.naam}`}
                                      onChange={() =>
                                        compareId &&
                                        toggleSelection({
                                          id: compareId,
                                          naam: tech.naam,
                                          omschrijving: tech.omschrijving,
                                          gebruiksstatus: tech.gebruiksstatus,
                                          licentievorm: tech.licentievorm,
                                          versienummer: tech.versienummer,
                                          subtype: tech.subtype,
                                        })
                                      }
                                      title={disableSelect ? `Maximaal ${maxSelection} technologieen` : 'Selecteer voor vergelijking'}
                                    />
                                  </div>
                                  <button
                                    className="lt-action-btn lt-action-btn--outline btn btn-sm"
                                    onClick={() => handleEdit(tech.id)}
                                    disabled={!tech.id}
                                  >
                                    <span className="me-1 align-middle"><EditIcon /></span>
                                    Bewerken
                                  </button>
                                  <button
                                    className="lt-action-btn lt-action-btn--danger btn btn-sm"
                                    onClick={() => handleDelete(tech.id)}
                                    disabled={!tech.id}
                                  >
                                    <span className="me-1 align-middle"><TrashIcon /></span>
                                    Verwijder
                                  </button>
                                </div>
                                {disableSelect ? <div className="small text-muted mt-1">Maximum ({maxSelection}) bereikt</div> : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )
          ) : groupedByTasktype.length === 0 ? (
            <section className="card border-0 shadow-sm">
              <div className="card-body text-center py-4 text-muted">
                Geen resultaten voor deze zoek/filter-combinatie.
              </div>
            </section>
          ) : (
            <div className="d-grid gap-3">
              {groupedByTaskGroup.map((taskGroup, groupIdx) => (
                <section
                  key={`${taskGroup.groupLabel}-${groupIdx}`}
                  ref={(el) => {
                    sectionRefs.current[taskGroup.groupLabel] = el;
                  }}
                  className="lt-taskgroup-section card"
                >
                  <div className="lt-taskgroup-section-header card-header d-flex justify-content-between align-items-center py-3 border-bottom">
                    <div className="lt-taskgroup-section-title fw-semibold">{taskGroup.groupLabel}</div>
                    <span className="lt-taskgroup-section-count badge rounded-pill">
                      {taskGroup.tasktypes.length} taaktype{taskGroup.tasktypes.length !== 1 ? 'n' : ''}
                    </span>
                  </div>

                  <div className="card-body d-grid gap-3 py-2">
                    {taskGroup.tasktypes.map((group, taskIdx) => {
                      const tasktypeSectionId = `tasktype-section-${groupIdx}-${taskIdx}`;
                      return (
                        <article key={`${taskGroup.groupLabel}-${group.taaktype}`} id={tasktypeSectionId} className="border-bottom pb-3 pt-2">
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <h5 className="lt-tasktype-name mb-0 fw-semibold">{group.taaktype}</h5>
                            <span className="badge rounded-pill bg-light text-dark border">
                              {group.technologies.length} technologie{group.technologies.length !== 1 ? 'en' : ''}
                            </span>
                          </div>

                          <div className="lt-tasktype-description small text-muted mb-3">
                            {group.description || 'Geen taakomschrijving beschikbaar.'}
                          </div>

                          <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th className="lt-table-head">Naam</th>
                                  <th className="lt-table-head">Type</th>
                                  <th className="lt-table-head">Status</th>
                                  <th className="lt-table-head">Licentie</th>
                                  <th className="lt-table-head">Versie</th>
                                  <th className="lt-table-head text-end">Acties</th>
                                </tr>
                              </thead>
                              <tbody className="border-top-0">
                                {group.technologies.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="text-center text-muted py-3">
                                      Geen juridische technologieen gevonden voor dit taaktype met de huidige filters.
                                    </td>
                                  </tr>
                                ) : (
                                  group.technologies.map((tech, techIdx) => (
                                    <tr
                                      key={tech.id || `${group.taaktype}-${techIdx}`}
                                      className={`align-middle lt-tech-row${(tech.id ? selectedSet.has(tech.id) : false) ? ' is-compare-selected' : ''}`}
                                    >
                                      <td>
                                        {(() => {
                                          const contextId = tech.id || `${group.taaktype}-${techIdx}`;
                                          return (
                                            <>
                                              <button
                                                type="button"
                                                className="btn btn-link p-0 fw-semibold text-decoration-none text-start lt-context-name-link"
                                                onClick={() => handleSetContext(tech, contextId)}
                                              >
                                                {tech.naam}
                                                <span className="lt-context-name-hint ms-1" aria-hidden="true">
                                                  <span className="lt-context-name-hint-icon">›</span>
                                                  <span className="lt-context-name-hint-label">context</span>
                                                </span>
                                              </button>
                                              <small className="text-muted">{tech.abbrevation || contextId}</small>
                                            </>
                                          );
                                        })()}
                                      </td>
                                      <td><SubtypeBadge value={tech.subtype} /></td>
                                      <td><StatusBadge value={tech.gebruiksstatus} /></td>
                                      <td>{tech.licentievorm || '-'}</td>
                                      <td>{tech.versienummer || '-'}</td>
                                      <td className="text-end text-nowrap">
                                        {(() => {
                                          const compareId = tech.id || '';
                                          const isSelected = compareId ? selectedSet.has(compareId) : false;
                                          const disableSelect = !isSelected && selectedCount >= maxSelection;
                                          return (
                                            <>
                                              <div className="d-inline-flex align-items-center gap-1">
                                                <div className="form-check form-switch lt-compare-switch-cell mb-0">
                                                  <input
                                                    type="checkbox"
                                                    role="switch"
                                                    className="form-check-input lt-compare-switch-input"
                                                    checked={isSelected}
                                                    disabled={!compareId || disableSelect}
                                                    aria-label={`Vergelijk ${tech.naam}`}
                                                    onChange={() =>
                                                      compareId &&
                                                      toggleSelection({
                                                        id: compareId,
                                                        naam: tech.naam,
                                                        omschrijving: tech.omschrijving,
                                                        gebruiksstatus: tech.gebruiksstatus,
                                                        licentievorm: tech.licentievorm,
                                                        versienummer: tech.versienummer,
                                                        subtype: tech.subtype,
                                                      })
                                                    }
                                                    title={disableSelect ? `Maximaal ${maxSelection} technologieen` : 'Selecteer voor vergelijking'}
                                                  />
                                                </div>
                                                <button
                                                  className="lt-action-btn lt-action-btn--outline btn btn-sm"
                                                  onClick={() => handleEdit(tech.id)}
                                                  disabled={!tech.id}
                                                >
                                                  <span className="me-1 align-middle"><EditIcon /></span>
                                                  Bewerken
                                                </button>
                                                <button
                                                  className="lt-action-btn lt-action-btn--danger btn btn-sm"
                                                  onClick={() => handleDelete(tech.id)}
                                                  disabled={!tech.id}
                                                >
                                                  <span className="me-1 align-middle"><TrashIcon /></span>
                                                  Verwijder
                                                </button>
                                              </div>
                                              {disableSelect ? <div className="small text-muted mt-1">Maximum ({maxSelection}) bereikt</div> : null}
                                            </>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default LegalTechnologyByTasktype;
