import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, apiFetchText } from '../utils/api';
import LegalTechnologyForm, { selectForEdit } from './LegalTechnologyForm';
import { useCompareSelection } from './CompareSelectionContext';
import { useActiveTechnology } from './ActiveTechnologyContext';

type Documentatie = {
  beoogdGebruik: string;
  toegevoegdeWaarde: string;
  onderdelen: string;
  ontwikkelingEnBeheer: string;
};

type Bronverwijzing = {
  titel: string;
  locatie: string;
  verwijzing: string;
};

type Organisation = {
  iri?: string;
  naam?: string;
  contactinformatie?: string;
};

type TechRef = {
  uri: string;
  name: string;
};

type StickyNote = {
  uri: string;
  linkedTechnology: TechRef;
  candidateTechnologies: TechRef[];
};

type LegalTechnology = {
  id?: string;
  subtype?: 'JuridischeTechnologie' | 'Methode' | 'Standaard' | 'Tool';
  abbrevation?: string;
  versienummer?: string;
  versiedatum?: string;
  naam: string;
  omschrijving: string;
  gebruiksstatus: string;
  licentievorm: string;
  geboden_functionaliteit: string[];
  technologietype: string;
  taaktype: string;
  beoogde_gebruikers: string[];
  bijgewerkt_op: string;
  ondersteuning_voor: { beschouwingsniveau: string; modelsoort: string }[];
  geschikt_voor_taak: { omschrijving: string; taaktype: string }[];
  documentatie: Documentatie;
  bronverwijzing: Bronverwijzing[];
  normstatus?: string;
  beheerder?: string;
  beheerder_org?: Organisation;
  leverancier?: string;
  leverancier_org?: Organisation;
  type_technologie?: string[];
};

const STATUS_COLORS: Record<string, string> = {
  'In gebruik': 'success',
  'Voorstel': 'warning text-dark',
  'Work in progress': 'info text-dark',
};

const SUBTYPE_COLORS: Record<string, string> = {
  Methode: 'info',
  Standaard: 'warning',
  Tool: 'success',
  JuridischeTechnologie: 'secondary',
};

const normalizeForCompare = (value?: string) =>
  decodeURIComponent((value || '').trim()).toLowerCase();

const compactIdentifier = (value?: string) => {
  const cleaned = decodeURIComponent((value || '').trim());
  if (!cleaned) {
    return '';
  }
  const hash = cleaned.lastIndexOf('#');
  if (hash >= 0 && hash < cleaned.length - 1) {
    return cleaned.slice(hash + 1).toLowerCase();
  }
  const slash = cleaned.lastIndexOf('/');
  if (slash >= 0 && slash < cleaned.length - 1) {
    return cleaned.slice(slash + 1).toLowerCase();
  }
  return cleaned.toLowerCase();
};

const StatusBadge: React.FC<{ value: string }> = ({ value }) => {
  const color = STATUS_COLORS[value] ?? 'secondary';
  return <span className={`badge bg-${color}`}>{value || '-'}</span>;
};

const SubtypeBadge: React.FC<{ value?: string }> = ({ value }) => {
  const key = value ?? 'JuridischeTechnologie';
  const color = SUBTYPE_COLORS[key] ?? 'secondary';
  const label = key === 'JuridischeTechnologie' ? 'Tech.' : key;
  return <span className={`badge bg-${color} bg-opacity-75`}>{label}</span>;
};

type LegalTechnologyListProps = {
  variant?: 'cards' | 'list';
};

const LegalTechnologyList: React.FC<LegalTechnologyListProps> = ({ variant = 'cards' }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<LegalTechnology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const {
    selectedSet,
    selectedItems,
    selectedCount,
    maxSelection,
    toggleSelection,
    removeSelection,
    clearSelection,
  } = useCompareSelection();
  const { setActiveTechnology } = useActiveTechnology();

  const triggerDownload = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchItems = async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LegalTechnology[]>(`/api/legaltechnologies/search?q=${encodeURIComponent(q)}`);
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadNamedGraph = async () => {
    setExportBusy(true);
    setError(null);
    setExportMessage(null);
    try {
      const turtle = await apiFetchText('/api/legaltechnologies/export/all.ttl');
      triggerDownload(turtle, 'all-legal-technologies.ttl', 'text/turtle;charset=utf-8');
      setExportMessage('Named graph download gestart.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExportBusy(false);
    }
  };

  const syncExports = async () => {
    setExportBusy(true);
    setError(null);
    setExportMessage(null);
    try {
      const result = await apiFetch<{
        legal_technology_bundles: number;
        organisation_bundles: number;
      }>('/api/legaltechnologies/export/sync', { method: 'POST' });
      setExportMessage(
        `Exports bijgewerkt: ${result.legal_technology_bundles} legal technology bundles en ${result.organisation_bundles} organisatiebundles.`,
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExportBusy(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchStickyNotes = async () => {
      try {
        const data = await apiFetch<StickyNote[]>('/api/stickynotes');
        if (!cancelled) {
          setStickyNotes(data);
        }
      } catch {
        if (!cancelled) {
          setStickyNotes([]);
        }
      }
    };

    fetchStickyNotes();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Weet je zeker dat je deze technologie wilt verwijderen?')) return;
    try {
      await apiFetch(`/api/legaltechnologies/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
      removeSelection(id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (id?: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch<LegalTechnology>(`/api/legaltechnologies/${id}`)
      .then(tech => {
        const safeSubtype =
          tech.subtype === 'Methode' || tech.subtype === 'Standaard' || tech.subtype === 'Tool'
            ? tech.subtype
            : 'Methode';
        selectForEdit({ ...tech, subtype: safeSubtype });
        setFormMode('edit');
        setShowForm(true);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleAdd = () => {
    selectForEdit({
      abbrevation: '',
      versienummer: '1.0',
      versiedatum: '',
      naam: '',
      omschrijving: '',
      gebruiksstatus: '',
      licentievorm: '',
      geboden_functionaliteit: [''],
      technologietype: '',
      taaktype: '',
      beoogde_gebruikers: [''],
      bijgewerkt_op: '',
      ondersteuning_voor: [{ beschouwingsniveau: '', modelsoort: '' }],
      geschikt_voor_taak: [{ omschrijving: '', taaktype: '' }],
      documentatie: {
        beoogdGebruik: '',
        toegevoegdeWaarde: '',
        onderdelen: '',
        ontwikkelingEnBeheer: '',
      },
      bronverwijzing: [{ titel: '', locatie: '', verwijzing: '' }],
      normstatus: '',
    });
    setFormMode('add');
    setShowForm(true);
  };

  const closeFormModal = () => {
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchItems(search);
  };

  const handleView = (id?: string) => {
    if (!id) return;
    const item = items.find((technology) => technology.id === id);
    if (item) {
      setActiveTechnology({
        id: item.id || id,
        naam: item.naam,
        omschrijving: item.omschrijving,
        gebruiksstatus: item.gebruiksstatus,
        licentievorm: item.licentievorm,
        subtype: item.subtype,
        versienummer: item.versienummer,
        beoogdeGebruikers: item.beoogde_gebruikers || [],
        gebodenFunctionaliteit: item.geboden_functionaliteit || [],
        technologietype: item.technologietype,
        typeTechnologie: item.type_technologie || [],
        taaktypes: (item.geschikt_voor_taak || []).map((entry) => entry.taaktype).filter(Boolean),
        ondersteuningsniveaus: item.ondersteuning_voor || [],
      });
    }
    navigate(`/legaltechnologies/${encodeURIComponent(id)}`);
  };

  const handleSetContext = (id?: string) => {
    if (!id) return;
    const item = items.find((technology) => technology.id === id);
    if (!item) return;

    setActiveTechnology({
      id: item.id || id,
      naam: item.naam,
      omschrijving: item.omschrijving,
      gebruiksstatus: item.gebruiksstatus,
      licentievorm: item.licentievorm,
      subtype: item.subtype,
      versienummer: item.versienummer,
      beoogdeGebruikers: item.beoogde_gebruikers || [],
      gebodenFunctionaliteit: item.geboden_functionaliteit || [],
      technologietype: item.technologietype,
      typeTechnologie: item.type_technologie || [],
      taaktypes: (item.geschikt_voor_taak || []).map((entry) => entry.taaktype).filter(Boolean),
      ondersteuningsniveaus: item.ondersteuning_voor || [],
    });
  };

  const downloadTechTurtle = async (id?: string) => {
    if (!id) return;
    try {
      const turtle = await apiFetchText(`/api/legaltechnologies/${id}/export.ttl`);
      triggerDownload(turtle, `legal-technology-${id}.ttl`, 'text/turtle;charset=utf-8');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const downloadTechMarkdown = async (id?: string) => {
    if (!id) return;
    try {
      const markdown = await apiFetchText(`/api/legaltechnologies/${id}/export.md`);
      triggerDownload(markdown, `legal-technology-${id}.md`, 'text/markdown;charset=utf-8');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(search);
  };

  const comparisonItems = useMemo(
    () =>
      selectedItems
        .map(selected => items.find(item => item.id === selected.id) ?? ({
          id: selected.id,
          naam: selected.naam || selected.id,
          omschrijving: selected.omschrijving || '',
          gebruiksstatus: selected.gebruiksstatus || '',
          licentievorm: selected.licentievorm || '',
          versienummer: selected.versienummer || '',
          subtype: selected.subtype as LegalTechnology['subtype'],
          geboden_functionaliteit: [],
          technologietype: '',
          taaktype: '',
          beoogde_gebruikers: [],
          bijgewerkt_op: '',
          ondersteuning_voor: [],
          geschikt_voor_taak: [],
          documentatie: {
            beoogdGebruik: '',
            toegevoegdeWaarde: '',
            onderdelen: '',
            ontwikkelingEnBeheer: '',
          },
          bronverwijzing: [],
        } as LegalTechnology))
        .filter((item): item is LegalTechnology => item !== undefined),
    [selectedItems, items],
  );

  const stickyCountsByTechnology = useMemo(() => {
    const counts: Record<string, { definitive: number; candidate: number }> = {};

    const increment = (key: string, field: 'definitive' | 'candidate') => {
      if (!key) {
        return;
      }
      if (!counts[key]) {
        counts[key] = { definitive: 0, candidate: 0 };
      }
      counts[key][field] += 1;
    };

    stickyNotes.forEach((note) => {
      const definitiveKeys = new Set<string>([
        normalizeForCompare(note.linkedTechnology?.uri),
        compactIdentifier(note.linkedTechnology?.uri),
      ]);
      definitiveKeys.forEach((key) => increment(key, 'definitive'));

      note.candidateTechnologies.forEach((candidate) => {
        const candidateKeys = new Set<string>([
          normalizeForCompare(candidate?.uri),
          compactIdentifier(candidate?.uri),
        ]);
        candidateKeys.forEach((key) => increment(key, 'candidate'));
      });
    });

    return counts;
  }, [stickyNotes]);

  const getStickyCounts = (itemId?: string) => {
    const normalized = normalizeForCompare(itemId);
    const compact = compactIdentifier(itemId);
    const primary = stickyCountsByTechnology[normalized] || { definitive: 0, candidate: 0 };
    const secondary = stickyCountsByTechnology[compact] || { definitive: 0, candidate: 0 };

    const definitive = primary.definitive + (compact && compact !== normalized ? secondary.definitive : 0);
    const candidate = primary.candidate + (compact && compact !== normalized ? secondary.candidate : 0);

    return {
      definitive,
      candidate,
      total: definitive + candidate,
    };
  };

  return (
    <div className="lt-list-panel">
      <div className="lt-list-toolbar">
        <h4 className="mb-0 fw-semibold text-primary">Juridische Technologieen</h4>
        <div className="lt-list-actions">
          <button className="btn btn-sm btn-outline-secondary" onClick={downloadNamedGraph} disabled={loading || exportBusy}>
            Download named graph
          </button>
          <button className="btn btn-sm btn-outline-primary" onClick={syncExports} disabled={loading || exportBusy}>
            Sync exports
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={loading || exportBusy}>
            + Nieuwe technologie
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {exportMessage && <div className="alert alert-success">{exportMessage}</div>}

      <form onSubmit={handleSearch} className="d-flex gap-2 mb-3">
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Zoek op naam of omschrijving..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-sm btn-outline-primary text-nowrap">
          Zoeken
        </button>
      </form>

      {showForm && (
        <>
          <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {formMode === 'edit' ? 'Juridische technologie bewerken' : 'Nieuwe juridische technologie'}
                  </h5>
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

      {variant === 'cards' && selectedCount > 0 && (
        <div className="lt-list-comparison mt-4 mb-4 p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0 fw-semibold text-primary">
              Vergelijken: {comparisonItems.length} technologie{comparisonItems.length !== 1 ? 'en' : ''}
            </h5>
            <button className="btn btn-sm btn-outline-danger" onClick={clearSelection}>
              Vergelijking resetten
            </button>
          </div>
          <div className="row g-3">
            {comparisonItems.map(tech => (
              <div key={tech.id} className="col-md-6 col-xl-3">
                <div className="card h-100 border-primary">
                  <div className="card-header bg-primary bg-opacity-10 py-2">
                    <div className="fw-semibold text-truncate">{tech.naam}</div>
                    <small className="text-muted">{tech.abbrevation || tech.id}</small>
                  </div>
                  <div className="card-body small">
                    <div className="mb-2"><strong>Naam:</strong> {tech.naam || '-'}</div>
                    <div className="mb-2"><strong>Gebruiksstatus:</strong> <StatusBadge value={tech.gebruiksstatus} /></div>
                    <div className="mb-2"><strong>Licentievorm:</strong> {tech.licentievorm || '-'}</div>
                    <div className="mb-2">
                      <strong>Beoogde gebruikers:</strong>{' '}
                      {tech.beoogde_gebruikers?.filter(Boolean).join(', ') || '-'}
                    </div>
                    <div className="mb-2">
                      <strong>Geboden functionaliteit:</strong>{' '}
                      {tech.geboden_functionaliteit?.filter(Boolean).join(', ') || '-'}
                    </div>
                    <div className="mb-0">
                      <strong>Geschikt voor taak:</strong>{' '}
                      {(
                        tech.geschikt_voor_taak?.map(t => t.taaktype).filter(Boolean) ??
                        (tech.taaktype ? [tech.taaktype] : [])
                      ).join(', ') || '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Laden...
        </div>
      ) : items.length === 0 ? (
        <div className="lt-list-empty text-center py-5">
          <div className="fs-5 mb-1">Geen technologieen gevonden</div>
          <small>Gebruik de knop hierboven om een nieuwe technologie toe te voegen.</small>
        </div>
      ) : variant === 'cards' ? (
        <div className="row g-3">
          {items.map((item, idx) => {
            const id = item.id || `idx-${idx}`;
            const checked = selectedSet.has(id);
            const disableCheck = selectedCount >= maxSelection && !checked;
            const stickyCounts = getStickyCounts(item.id);
            return (
              <div key={id} className="col-md-6 col-xl-4">
                <div className={`lt-list-card card h-100${checked ? ' is-compare-selected' : ''}`}>
                  <div className="lt-list-card-header card-header d-flex justify-content-between align-items-start">
                    <div className="pe-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 fw-semibold text-decoration-none text-start lt-context-name-link"
                        onClick={() => handleSetContext(id)}
                      >
                        {item.naam}
                        <span className="lt-context-name-hint ms-1" aria-hidden="true">
                          <span className="lt-context-name-hint-icon">›</span>
                          <span className="lt-context-name-hint-label">context</span>
                        </span>
                      </button>
                      <small className="text-muted">{item.abbrevation || id}</small>
                    </div>
                    <div className="form-check form-switch lt-compare-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={checked}
                        disabled={disableCheck}
                        role="switch"
                        aria-label={`Vergelijk ${item.naam}`}
                        onChange={() => toggleSelection({
                          id,
                          naam: item.naam,
                          omschrijving: item.omschrijving,
                          gebruiksstatus: item.gebruiksstatus,
                          licentievorm: item.licentievorm,
                          versienummer: item.versienummer,
                          subtype: item.subtype,
                        })}
                        title={disableCheck ? `Maximaal ${maxSelection} technologieen` : 'Selecteer voor vergelijking'}
                      />
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex gap-2 mb-2">
                      <SubtypeBadge value={item.subtype} />
                      <StatusBadge value={item.gebruiksstatus} />
                    </div>
                    <div className="d-flex gap-2 mb-2 flex-wrap">
                      <span className={`badge ${stickyCounts.total > 0 ? 'text-bg-primary' : 'text-bg-light'}`}>
                        Sticky notes: {stickyCounts.total}
                      </span>
                      {stickyCounts.definitive > 0 && (
                        <span className="badge text-bg-success">Definitief: {stickyCounts.definitive}</span>
                      )}
                      {stickyCounts.candidate > 0 && (
                        <span className="badge text-bg-warning text-dark">Kandidaat: {stickyCounts.candidate}</span>
                      )}
                    </div>
                    <p className="small text-muted mb-3" style={{ minHeight: 42 }}>
                      {item.omschrijving || '-'}
                    </p>
                    <div className="small mb-1"><strong>Licentie:</strong> {item.licentievorm || '-'}</div>
                    <div className="small mb-1"><strong>Versie:</strong> {item.versienummer || '-'}</div>
                    <div className="small mb-0"><strong>Normstatus:</strong> {item.normstatus || '-'}</div>
                  </div>
                  <div className="card-footer bg-white d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-outline-success" onClick={() => handleSetContext(id)}>
                      Context
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleView(item.id)}>
                      Details
                    </button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(item.id)}>
                      Bewerken
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>
                      Verwijder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="lt-list-table table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 220 }}>Naam</th>
                <th>Type</th>
                <th>Status</th>
                <th>Licentie</th>
                <th>Versie</th>
                <th className="text-end">Acties</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const id = item.id || `idx-${idx}`;
                return (
                <tr key={id}>
                  <td>
                    <button
                      type="button"
                      className="btn btn-link p-0 fw-semibold text-decoration-none text-start lt-context-name-link"
                      onClick={() => handleSetContext(id)}
                    >
                      {item.naam}
                      <span className="lt-context-name-hint ms-1" aria-hidden="true">
                        <span className="lt-context-name-hint-icon">›</span>
                        <span className="lt-context-name-hint-label">context</span>
                      </span>
                    </button>
                    <small className="text-muted">{item.abbrevation || id}</small>
                    <div className="mt-1">
                      {(() => {
                        const stickyCounts = getStickyCounts(item.id);
                        return (
                          <div className="d-flex gap-1 flex-wrap">
                            <span className={`badge ${stickyCounts.total > 0 ? 'text-bg-primary' : 'text-bg-light'}`}>
                              Sticky: {stickyCounts.total}
                            </span>
                            {stickyCounts.definitive > 0 && (
                              <span className="badge text-bg-success">D: {stickyCounts.definitive}</span>
                            )}
                            {stickyCounts.candidate > 0 && (
                              <span className="badge text-bg-warning text-dark">K: {stickyCounts.candidate}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td><SubtypeBadge value={item.subtype} /></td>
                  <td><StatusBadge value={item.gebruiksstatus} /></td>
                  <td>{item.licentievorm || '-'}</td>
                  <td>{item.versienummer || '-'}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleSetContext(id)}>
                      Context
                    </button>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleView(item.id)}>
                      Details
                    </button>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(item.id)}>
                      Bewerken
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>
                      Verwijder
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LegalTechnologyList;
