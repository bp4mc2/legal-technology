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
  iri?: string;
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
  'In gebruik': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'Voorstel': 'border-amber-200 bg-amber-50 text-amber-900',
  'Work in progress': 'border-sky-200 bg-sky-50 text-sky-900',
};

const SUBTYPE_COLORS: Record<string, string> = {
  Methode: 'border-cyan-200 bg-cyan-100 text-cyan-800',
  Standaard: 'border-amber-200 bg-amber-100 text-amber-900',
  Tool: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  JuridischeTechnologie: 'border-slate-300 bg-slate-100 text-slate-700',
};

const DEFAULT_BADGE = 'border-slate-300 bg-slate-100 text-slate-700';

const BUTTON_SECONDARY_SM =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_PRIMARY_SM =
  'inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_OUTLINE_PRIMARY_SM =
  'inline-flex items-center justify-center rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_OUTLINE_SUCCESS_SM =
  'inline-flex items-center justify-center rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_OUTLINE_DANGER_SM =
  'inline-flex items-center justify-center rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';

const INPUT_SM =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:bg-slate-100';

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
  const color = STATUS_COLORS[value] ?? DEFAULT_BADGE;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>{value || '-'}</span>;
};

const SubtypeBadge: React.FC<{ value?: string }> = ({ value }) => {
  const key = value ?? 'JuridischeTechnologie';
  const color = SUBTYPE_COLORS[key] ?? DEFAULT_BADGE;
  const label = key === 'JuridischeTechnologie' ? 'Tech.' : key;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
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
        iri: item.iri,
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
      iri: item.iri,
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
        <h4 className="mb-0 text-lg font-semibold text-blue-700">Juridische Technologieen</h4>
        <div className="lt-list-actions">
          <button className={BUTTON_SECONDARY_SM} onClick={downloadNamedGraph} disabled={loading || exportBusy}>
            Download named graph
          </button>
          <button className={BUTTON_OUTLINE_PRIMARY_SM} onClick={syncExports} disabled={loading || exportBusy}>
            Sync exports
          </button>
          <button className={BUTTON_PRIMARY_SM} onClick={handleAdd} disabled={loading || exportBusy}>
            + Nieuwe technologie
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}
      {exportMessage && <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{exportMessage}</div>}

      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          type="search"
          className={INPUT_SM}
          placeholder="Zoek op naam of omschrijving..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className={`${BUTTON_OUTLINE_PRIMARY_SM} text-nowrap`}>
          Zoeken
        </button>
      </form>

      {showForm && (
        <>
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lt">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h5 className="text-base font-semibold text-slate-900">
                  {formMode === 'edit' ? 'Juridische technologie bewerken' : 'Nieuwe juridische technologie'}
                </h5>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeFormModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  x
                </button>
              </div>
              <div className="max-h-[72vh] overflow-y-auto px-4 py-3">
                <LegalTechnologyForm onSuccess={handleFormSuccess} />
              </div>
              <div className="flex justify-end border-t border-slate-200 px-4 py-3">
                <button type="button" className={BUTTON_SECONDARY_SM} onClick={closeFormModal}>
                  Sluiten
                </button>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-[1190] bg-slate-900/40 backdrop-blur" onClick={closeFormModal} />
        </>
      )}

      {variant === 'cards' && selectedCount > 0 && (
        <div className="lt-list-comparison mb-4 mt-4 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h5 className="mb-0 font-semibold text-blue-700">
              Vergelijken: {comparisonItems.length} technologie{comparisonItems.length !== 1 ? 'en' : ''}
            </h5>
            <button className={BUTTON_OUTLINE_DANGER_SM} onClick={clearSelection}>
              Vergelijking resetten
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {comparisonItems.map(tech => (
              <div key={tech.id}>
                <div className="h-full rounded-lg border border-blue-200 bg-white shadow-sm">
                  <div className="border-b border-blue-100 bg-blue-50/70 px-3 py-2">
                    <div className="truncate font-semibold text-slate-900">{tech.naam}</div>
                    <small className="text-slate-500">{tech.abbrevation || tech.id}</small>
                  </div>
                  <div className="space-y-2 p-3 text-sm">
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
        <div className="py-8 text-center text-slate-500">
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" role="status" aria-hidden="true" />
          Laden...
        </div>
      ) : items.length === 0 ? (
        <div className="lt-list-empty py-8 text-center">
          <div className="mb-1 text-lg">Geen technologieen gevonden</div>
          <small>Gebruik de knop hierboven om een nieuwe technologie toe te voegen.</small>
        </div>
      ) : variant === 'cards' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, idx) => {
            const id = item.id || `idx-${idx}`;
            const checked = selectedSet.has(id);
            const disableCheck = selectedCount >= maxSelection && !checked;
            const stickyCounts = getStickyCounts(item.id);
            return (
              <div key={id}>
                <div className={`lt-list-card flex h-full flex-col${checked ? ' is-compare-selected' : ''}`}>
                  <div className="lt-list-card-header flex items-start justify-between border-b border-slate-200 px-3 py-2">
                    <div className="pe-2 min-w-0">
                      <button
                        type="button"
                        className="lt-context-name-link p-0 text-start font-semibold"
                        onClick={() => handleSetContext(id)}
                      >
                        {item.naam}
                        <span className="lt-context-name-hint ms-1" aria-hidden="true">
                          <span className="lt-context-name-hint-icon">›</span>
                          <span className="lt-context-name-hint-label">context</span>
                        </span>
                      </button>
                      <small className="text-slate-500">{item.abbrevation || id}</small>
                    </div>
                    <div className="lt-compare-switch m-0">
                      <input
                        className="lt-compare-switch-input h-5 w-10 cursor-pointer appearance-none rounded-full border border-slate-300 bg-slate-100 transition checked:border-emerald-500 checked:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-55"
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
                  <div className="flex-1 px-3 py-3">
                    <div className="mb-2 flex gap-2">
                      <SubtypeBadge value={item.subtype} />
                      <StatusBadge value={item.gebruiksstatus} />
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          stickyCounts.total > 0
                            ? 'border-blue-200 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-slate-100 text-slate-700'
                        }`}
                      >
                        Sticky notes: {stickyCounts.total}
                      </span>
                      {stickyCounts.definitive > 0 && (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">Definitief: {stickyCounts.definitive}</span>
                      )}
                      {stickyCounts.candidate > 0 && (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">Kandidaat: {stickyCounts.candidate}</span>
                      )}
                    </div>
                    <p className="mb-3 min-h-[42px] text-sm text-slate-500">
                      {item.omschrijving || '-'}
                    </p>
                    <div className="mb-1 text-sm"><strong>Licentie:</strong> {item.licentievorm || '-'}</div>
                    <div className="mb-1 text-sm"><strong>Versie:</strong> {item.versienummer || '-'}</div>
                    <div className="mb-0 text-sm"><strong>Normstatus:</strong> {item.normstatus || '-'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-3 py-2">
                    <button className={BUTTON_OUTLINE_SUCCESS_SM} onClick={() => handleSetContext(id)}>
                      Context
                    </button>
                    <button className={BUTTON_SECONDARY_SM} onClick={() => handleView(item.id)}>
                      Details
                    </button>
                    <button className={BUTTON_OUTLINE_PRIMARY_SM} onClick={() => handleEdit(item.id)}>
                      Bewerken
                    </button>
                    <button className={BUTTON_OUTLINE_DANGER_SM} onClick={() => handleDelete(item.id)}>
                      Verwijder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="lt-list-table min-w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left" style={{ minWidth: 220 }}>Naam</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Licentie</th>
                <th className="px-3 py-2 text-left">Versie</th>
                <th className="px-3 py-2 text-end">Acties</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const id = item.id || `idx-${idx}`;
                return (
                <tr key={id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="lt-context-name-link p-0 text-start font-semibold"
                      onClick={() => handleSetContext(id)}
                    >
                      {item.naam}
                      <span className="lt-context-name-hint ms-1" aria-hidden="true">
                        <span className="lt-context-name-hint-icon">›</span>
                        <span className="lt-context-name-hint-label">context</span>
                      </span>
                    </button>
                    <small className="text-slate-500">{item.abbrevation || id}</small>
                    <div className="mt-1">
                      {(() => {
                        const stickyCounts = getStickyCounts(item.id);
                        return (
                          <div className="flex flex-wrap gap-1">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                                stickyCounts.total > 0
                                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                                  : 'border-slate-300 bg-slate-100 text-slate-700'
                              }`}
                            >
                              Sticky: {stickyCounts.total}
                            </span>
                            {stickyCounts.definitive > 0 && (
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">D: {stickyCounts.definitive}</span>
                            )}
                            {stickyCounts.candidate > 0 && (
                              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">K: {stickyCounts.candidate}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-3 py-2"><SubtypeBadge value={item.subtype} /></td>
                  <td className="px-3 py-2"><StatusBadge value={item.gebruiksstatus} /></td>
                  <td className="px-3 py-2">{item.licentievorm || '-'}</td>
                  <td className="px-3 py-2">{item.versienummer || '-'}</td>
                  <td className="text-nowrap px-3 py-2 text-end">
                    <button className={`${BUTTON_OUTLINE_SUCCESS_SM} mr-1`} onClick={() => handleSetContext(id)}>
                      Context
                    </button>
                    <button className={`${BUTTON_SECONDARY_SM} mr-1`} onClick={() => handleView(item.id)}>
                      Details
                    </button>
                    <button className={`${BUTTON_OUTLINE_PRIMARY_SM} mr-1`} onClick={() => handleEdit(item.id)}>
                      Bewerken
                    </button>
                    <button className={BUTTON_OUTLINE_DANGER_SM} onClick={() => handleDelete(item.id)}>
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
