import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, apiFetchText } from '../utils/api';
import LegalTechnologyForm, { selectForEdit } from './LegalTechnologyForm';

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
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Weet je zeker dat je deze technologie wilt verwijderen?')) return;
    try {
      await apiFetch(`/api/legaltechnologies/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedForComparison(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
    setDetailItem(null);
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
    navigate(`/legaltechnologies/${encodeURIComponent(id)}`);
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

  const toggleComparison = (id?: string) => {
    if (!id) return;
    setSelectedForComparison(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const resetComparison = () => {
    setSelectedForComparison(new Set());
  };

  const comparisonItems = useMemo(
    () =>
      Array.from(selectedForComparison)
        .map(id => items.find(item => item.id === id))
        .filter((item): item is LegalTechnology => item !== undefined),
    [selectedForComparison, items],
  );

  return (
    <div className="p-3 bg-white rounded shadow-sm">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0 fw-semibold text-primary">Juridische Technologieen</h4>
        <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={loading}>
          + Nieuwe technologie
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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

      {variant === 'cards' && selectedForComparison.size > 0 && (
        <div className="mt-4 mb-4 p-3 border rounded bg-light">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0 fw-semibold text-primary">
              Vergelijken: {comparisonItems.length} technologie{comparisonItems.length !== 1 ? 'en' : ''}
            </h5>
            <button className="btn btn-sm btn-outline-danger" onClick={resetComparison}>
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
                    <div className="mb-2"><strong>Type:</strong> <SubtypeBadge value={tech.subtype} /></div>
                    <div className="mb-2"><strong>Status:</strong> <StatusBadge value={tech.gebruiksstatus} /></div>
                    <div className="mb-2"><strong>Versie:</strong> {tech.versienummer || '-'}</div>
                    <div className="mb-0"><strong>Licentie:</strong> {tech.licentievorm || '-'}</div>
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
        <div className="text-center py-5 text-muted">
          <div className="fs-5 mb-1">Geen technologieen gevonden</div>
          <small>Gebruik de knop hierboven om een nieuwe technologie toe te voegen.</small>
        </div>
      ) : variant === 'cards' ? (
        <div className="row g-3">
          {items.map((item, idx) => {
            const id = item.id || `idx-${idx}`;
            const checked = selectedForComparison.has(id);
            const disableCheck = selectedForComparison.size >= 4 && !checked;
            return (
              <div key={id} className="col-md-6 col-xl-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-header bg-white d-flex justify-content-between align-items-start">
                    <div className="pe-2">
                      <div className="fw-semibold">{item.naam}</div>
                      <small className="text-muted">{item.abbrevation || item.id}</small>
                    </div>
                    <div className="form-check m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={checked}
                        disabled={disableCheck}
                        onChange={() => toggleComparison(item.id)}
                        title={disableCheck ? 'Maximaal 4 technologieen' : 'Selecteer voor vergelijking'}
                      />
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex gap-2 mb-2">
                      <SubtypeBadge value={item.subtype} />
                      <StatusBadge value={item.gebruiksstatus} />
                    </div>
                    <p className="small text-muted mb-3" style={{ minHeight: 42 }}>
                      {item.omschrijving || '-'}
                    </p>
                    <div className="small mb-1"><strong>Licentie:</strong> {item.licentievorm || '-'}</div>
                    <div className="small mb-1"><strong>Versie:</strong> {item.versienummer || '-'}</div>
                    <div className="small mb-0"><strong>Normstatus:</strong> {item.normstatus || '-'}</div>
                  </div>
                  <div className="card-footer bg-white d-flex gap-2 flex-wrap">
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
          <table className="table table-sm table-hover align-middle mb-0">
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
              {items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>
                    <div className="fw-semibold">{item.naam}</div>
                    <small className="text-muted">{item.abbrevation || item.id}</small>
                  </td>
                  <td><SubtypeBadge value={item.subtype} /></td>
                  <td><StatusBadge value={item.gebruiksstatus} /></td>
                  <td>{item.licentievorm || '-'}</td>
                  <td>{item.versienummer || '-'}</td>
                  <td className="text-end text-nowrap">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LegalTechnologyList;
