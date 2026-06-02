import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, apiFetchText } from '../utils/api';
import { useActiveTechnology } from './ActiveTechnologyContext';

type Organisation = {
  iri?: string;
  naam?: string;
  contactinformatie?: string;
};

type Documentatie = {
  beoogdGebruik?: string;
  toegevoegdeWaarde?: string;
  onderdelen?: string;
  ontwikkelingEnBeheer?: string;
};

type Bronverwijzing = {
  titel?: string;
  locatie?: string;
  verwijzing?: string;
};

type TechRef = {
  uri: string;
  name: string;
};

type StickyNote = {
  uri: string;
  noteId: string;
  text: string;
  statusIri: string;
  status: string;
  section: string;
  color: string;
  omschrijvingAfhandeling: string;
  board: { uri: string; name: string };
  taaktype: { uri: string; name: string };
  linkedTechnology: TechRef;
  candidateTechnologies: TechRef[];
};

type TechSuggestion = {
  uri: string;
  name: string;
};

type EnumerationValue = string | { label?: string; iri?: string; value?: string };

type EnumerationResponse = {
  name: string;
  values: EnumerationValue[];
};

type LegalTechnology = {
  id?: string;
  iri?: string;
  subtype?: string;
  abbrevation?: string;
  versienummer?: string;
  versiedatum?: string;
  naam: string;
  omschrijving: string;
  gebruiksstatus: string;
  licentievorm: string;
  geboden_functionaliteit: string[];
  technologietype?: string;
  taaktype?: string;
  beoogde_gebruikers: string[];
  bijgewerkt_op: string;
  ondersteuning_voor: { beschouwingsniveau: string; modelsoort: string }[];
  geschikt_voor_taak: { omschrijving: string; taaktype: string }[];
  documentatie?: Documentatie;
  bronverwijzing?: Bronverwijzing[];
  normstatus?: string;
  beheerder?: string;
  beheerder_org?: Organisation;
  leverancier?: string;
  leverancier_org?: Organisation;
  type_technologie?: string[];
};

const STATUS_BADGE: Record<string, string> = {
  'In gebruik': 'success',
  'Voorstel': 'warning text-dark',
  'Work in progress': 'info text-dark',
};

const SUBTYPE_BADGE: Record<string, string> = {
  Methode: 'primary',
  Standaard: 'warning text-dark',
  Tool: 'success',
};

const STICKY_STATUS_COLORS: Record<string, string> = {
  Opgenomen: '#16a34a',
  'Geen Juridische Technologie': '#6b7280',
  Uitzoeken: '#d97706',
  'Nader Te Bepalen': '#2563eb',
};

const stickyStatusChipStyle = (status: string): React.CSSProperties => ({
  ['--lt-detail-status-bg' as any]: STICKY_STATUS_COLORS[status] || '#6b7280',
});

const stickyNoteColorStyle = (color?: string): React.CSSProperties => ({
  ['--lt-detail-note-bg' as any]: color || '#fde68a',
});

const normalizeForCompare = (value?: string) =>
  decodeURIComponent((value || '').trim()).toLowerCase();

const uriMatchesTechnology = (uri: string | undefined, technologyKeys: Set<string>) => {
  const normalizedUri = normalizeForCompare(uri);
  return Boolean(normalizedUri) && technologyKeys.has(normalizedUri);
};

function TagList({ items, bg = 'primary' }: { items: string[]; bg?: string }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return <span className="text-muted">–</span>;
  return (
    <div className="d-flex flex-wrap gap-1">
      {visible.map((v, i) => (
        <span key={i} className={`badge bg-${bg} bg-opacity-10 border text-${bg.startsWith('warning') ? 'dark' : bg} fw-normal lt-detail-accent-badge`}>
          {v}
        </span>
      ))}
    </div>
  );
}

function Section({
  title,
  id,
  children,
  badge,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div id={id} className="card border-0 shadow-sm mb-3 lt-detail-section">
      <div className="card-header lt-detail-section-header">
        <span className="fw-semibold">{title}</span>
        {badge && (
          <span className="badge bg-light text-secondary border fw-normal ms-2 lt-detail-section-badge">
            {badge}
          </span>
        )}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function triggerDownload(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function LegalTechnologyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setActiveTechnology } = useActiveTechnology();
  const [tech, setTech] = useState<LegalTechnology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(true);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [stickyLoading, setStickyLoading] = useState(false);
  const [stickyError, setStickyError] = useState<string | null>(null);
  const [allStickyStatuses, setAllStickyStatuses] = useState<{ label: string; iri: string }[]>([]);
  const [allStickyStatusIriByLabel, setAllStickyStatusIriByLabel] = useState<Record<string, string>>({});

  const [editingSticky, setEditingSticky] = useState<StickyNote | null>(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [definitiveTechDraft, setDefinitiveTechDraft] = useState('');
  const [definitiveTechNameDraft, setDefinitiveTechNameDraft] = useState('');
  const [omschrijvingDraft, setOmschrijvingDraft] = useState('');
  const [techSuggestions, setTechSuggestions] = useState<TechSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [savingSticky, setSavingSticky] = useState(false);
  const [stickyActionError, setStickyActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch<LegalTechnology>(`/api/legaltechnologies/${id}`)
      .then(async data => {
        if (data.beheerder) {
          try { data.beheerder_org = await apiFetch<Organisation>(`/api/organisations/${encodeURIComponent(data.beheerder)}`); } catch { /* IRI fallback */ }
        }
        if (data.leverancier) {
          try { data.leverancier_org = await apiFetch<Organisation>(`/api/organisations/${encodeURIComponent(data.leverancier)}`); } catch { /* IRI fallback */ }
        }
        setTech(data);
        setActiveTechnology({
          id: data.id || id,
          naam: data.naam,
          omschrijving: data.omschrijving,
          gebruiksstatus: data.gebruiksstatus,
          licentievorm: data.licentievorm,
          subtype: data.subtype,
          versienummer: data.versienummer,
          beoogdeGebruikers: data.beoogde_gebruikers || [],
          gebodenFunctionaliteit: data.geboden_functionaliteit || [],
          technologietype: data.technologietype,
          typeTechnologie: data.type_technologie || [],
          taaktypes: (data.geschikt_voor_taak || []).map((item) => item.taaktype).filter(Boolean),
          ondersteuningsniveaus: data.ondersteuning_voor || [],
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const fetchStickyStatuses = async () => {
      try {
        const data = await apiFetch<EnumerationResponse>('/api/legaltechnologies/enumerations/StickyNoteStatussen');
        const normalized = (data.values || []).reduce<{ label: string; iri: string }[]>((acc, item) => {
          if (typeof item === 'string') {
            acc.push({ label: item, iri: '' });
            return acc;
          }

          const label = (item.label || item.value || '').trim();
          if (!label) {
            return acc;
          }

          acc.push({ label, iri: (item.iri || '').trim() });
          return acc;
        }, []);

        setAllStickyStatuses(normalized);

        const mapping: Record<string, string> = {};
        normalized.forEach((status) => {
          if (status.iri) {
            mapping[status.label] = status.iri;
          }
        });
        setAllStickyStatusIriByLabel(mapping);
      } catch (e) {
        console.warn('Kon StickyNoteStatussen niet ophalen via enumerations endpoint', e);
        setAllStickyStatuses([]);
        setAllStickyStatusIriByLabel({});
      }
    };

    fetchStickyStatuses();
  }, []);

  useEffect(() => {
    if (!tech?.id && !id) {
      setStickyNotes([]);
      return;
    }

    const fetchStickyNotes = async () => {
      setStickyLoading(true);
      setStickyError(null);
      try {
        const technologyUri =
          (tech?.iri || '').trim() ||
          ((id || '').startsWith('http://') || (id || '').startsWith('https://') ? (id || '').trim() : '');

        const endpoint = technologyUri
          ? `/api/stickynotes?technologyUri=${encodeURIComponent(technologyUri)}`
          : '/api/stickynotes';

        const data = await apiFetch<StickyNote[]>(endpoint);
        setStickyNotes(data);
      } catch (e: any) {
        setStickyError(e?.message || 'Kon sticky notes niet ophalen');
      } finally {
        setStickyLoading(false);
      }
    };

    fetchStickyNotes();
  }, [tech?.id, tech?.iri, id]);

  const technologyMatchKeys = useMemo(() => {
    const keys = new Set<string>();
    const routeUriCandidate =
      (id || '').startsWith('http://') || (id || '').startsWith('https://') ? id : undefined;
    const candidates = [routeUriCandidate, tech?.iri];
    candidates.forEach((candidate) => {
      const normalized = normalizeForCompare(candidate);
      if (normalized) {
        keys.add(normalized);
      }
    });
    return keys;
  }, [id, tech?.iri]);

  const relatedStickyNotes = useMemo(() => {
    return stickyNotes.filter((note) => {
      if (uriMatchesTechnology(note.linkedTechnology?.uri, technologyMatchKeys)) {
        return true;
      }
      return note.candidateTechnologies.some((candidate) =>
        uriMatchesTechnology(candidate.uri, technologyMatchKeys),
      );
    });
  }, [stickyNotes, technologyMatchKeys]);

  const stickyStatusIriByLabel = useMemo(() => {
    const mapping: Record<string, string> = { ...allStickyStatusIriByLabel };
    stickyNotes.forEach((note) => {
      if (note.status && note.statusIri && !mapping[note.status]) {
        mapping[note.status] = note.statusIri;
      }
    });
    return mapping;
  }, [allStickyStatusIriByLabel, stickyNotes]);

  const stickyStatuses = useMemo(() => {
    const endpointStatuses = Array.from(new Set(allStickyStatuses.map((s) => s.label).filter(Boolean))).sort();
    if (endpointStatuses.length > 0) {
      return endpointStatuses;
    }
    return Array.from(new Set(stickyNotes.map((note) => note.status).filter(Boolean))).sort();
  }, [allStickyStatuses, stickyNotes]);

  const stickySummary = useMemo(() => {
    const definitive = relatedStickyNotes.filter((note) =>
      uriMatchesTechnology(note.linkedTechnology?.uri, technologyMatchKeys),
    ).length;
    const candidate = relatedStickyNotes.filter((note) =>
      note.candidateTechnologies.some((candidateTechnology) =>
        uriMatchesTechnology(candidateTechnology.uri, technologyMatchKeys),
      ),
    ).length;
    return {
      total: relatedStickyNotes.length,
      definitive,
      candidate,
    };
  }, [relatedStickyNotes, technologyMatchKeys]);

  const applyUpdatedStickyNote = (updated: StickyNote) => {
    setStickyNotes((previous) =>
      previous.map((note) => (note.uri === updated.uri ? updated : note)),
    );
    setEditingSticky(updated);
    setStatusDraft(updated.statusIri || '');
    setDefinitiveTechDraft(updated.linkedTechnology?.uri || '');
    setDefinitiveTechNameDraft(updated.linkedTechnology?.name || '');
    setOmschrijvingDraft(updated.omschrijvingAfhandeling || '');
  };

  const openStickyEditor = (note: StickyNote) => {
    setEditingSticky(note);
    setStatusDraft(note.statusIri || '');
    setDefinitiveTechDraft(note.linkedTechnology?.uri || '');
    setDefinitiveTechNameDraft(note.linkedTechnology?.name || '');
    setOmschrijvingDraft(note.omschrijvingAfhandeling || '');
    setTechSuggestions([]);
    setStickyActionError(null);
  };

  const closeStickyEditor = () => {
    setEditingSticky(null);
    setStickyActionError(null);
    setTechSuggestions([]);
  };

  useEffect(() => {
    if (!editingSticky) {
      return;
    }

    const query = definitiveTechNameDraft.trim();
    if (query.length < 2) {
      setTechSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const data = await apiFetch<TechSuggestion[]>(
          `/api/stickynotes/tech-suggestions?q=${encodeURIComponent(query)}&limit=12`,
        );
        setTechSuggestions(data);
      } catch {
        setTechSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [definitiveTechNameDraft, editingSticky]);

  const patchStickyReview = async (payload: {
    statusIri?: string;
    definitiveTechnologyUri?: string;
    moveCandidateToDefinitiveUri?: string;
    omschrijvingAfhandeling?: string;
  }) => {
    if (!editingSticky) {
      return;
    }

    setSavingSticky(true);
    setStickyActionError(null);
    try {
      const updated = await apiFetch<StickyNote>('/api/stickynotes/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteUri: editingSticky.uri, ...payload }),
      });
      applyUpdatedStickyNote(updated);
    } catch (e: any) {
      setStickyActionError(e?.message || 'Kon sticky note niet bijwerken');
    } finally {
      setSavingSticky(false);
    }
  };

  const downloadTurtle = async () => {
    if (!id) return;
    try {
      const txt = await apiFetchText(`/api/legaltechnologies/${id}/export.ttl`);
      triggerDownload(txt, `${id}.ttl`, 'text/turtle;charset=utf-8');
    } catch (e: any) { setError(e.message); }
  };

  const downloadMarkdown = async () => {
    if (!id) return;
    try {
      const txt = await apiFetchText(`/api/legaltechnologies/${id}/export.md`);
      triggerDownload(txt, `${id}.md`, 'text/markdown;charset=utf-8');
    } catch (e: any) { setError(e.message); }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 text-muted">
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        Laden…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 lt-detail-error-wrap">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>← Terug</button>
      </div>
    );
  }

  if (!tech) return null;

  const subtypeBadge = SUBTYPE_BADGE[tech.subtype ?? ''] ?? 'secondary';
  const statusBadge = STATUS_BADGE[tech.gebruiksstatus] ?? 'secondary';

  return (
    <div className="page-card page-card--xxl lt-detail-page">

      {/* Terug */}
      <a
        href="#"
        className="lt-detail-back-link"
        onClick={e => { e.preventDefault(); navigate(-1); }}
      >
        ← Terug naar overzicht
      </a>

      {/* Header */}
      <div className="lt-detail-header d-flex justify-content-between align-items-start">
        <div>
          <div className="d-flex flex-wrap gap-2 mb-2">
            {tech.subtype && <span className={`badge bg-${subtypeBadge}`}>{tech.subtype}</span>}
            <span className={`badge bg-${statusBadge}`}>{tech.gebruiksstatus || 'Onbekend'}</span>
            {tech.normstatus && <span className="badge bg-secondary">{tech.normstatus}</span>}
          </div>
          <h2 className="mb-1 fw-bold text-primary">{tech.naam}</h2>
          <div className="text-muted small">
            {tech.abbrevation && <span>{tech.abbrevation}</span>}
            {tech.abbrevation && tech.versienummer && <span> · </span>}
            {tech.versienummer && <span>versie {tech.versienummer}</span>}
            {tech.versiedatum && <span> ({tech.versiedatum})</span>}
          </div>
          {tech.bronverwijzing && tech.bronverwijzing.filter(b => b.locatie).length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-3 small">
              {tech.bronverwijzing.filter(b => b.locatie).map((b, i) => (
                <a key={i} href={b.locatie} target="_blank" rel="noopener noreferrer" className="text-primary">
                  {b.titel || b.locatie}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="d-flex gap-2 flex-shrink-0 ms-3 mt-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary lt-detail-action-btn"
            disabled
          >
            ⊙ Details
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary lt-detail-action-btn"
            onClick={() => navigate(`/legaltechnologies/${encodeURIComponent(id!)}/edit`)}
          >
            ✎ Bewerken
          </button>
        </div>
      </div>

      {/* Twee kolommen */}
      <div className="row g-4 lt-detail-main-row">

        {/* Links: secties */}
        <div className="col-12">

          {/* Omschrijving + Documentatie */}
          <Section title="Omschrijving" id="omschrijving">
            <p className="lh-lg">{tech.omschrijving || <span className="text-muted">–</span>}</p>
            {tech.documentatie && Object.values(tech.documentatie).some(Boolean) && (
              <div className="d-flex flex-column gap-3 mt-1">
                {tech.documentatie.beoogdGebruik && (
                  <div>
                    <div className="fw-semibold mb-1">Beoogd gebruik</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.beoogdGebruik}</p>
                  </div>
                )}
                {tech.documentatie.toegevoegdeWaarde && (
                  <div>
                    <div className="fw-semibold mb-1">Toegevoegde waarde</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.toegevoegdeWaarde}</p>
                  </div>
                )}
                {tech.documentatie.onderdelen && (
                  <div>
                    <div className="fw-semibold mb-1">Onderdelen</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.onderdelen}</p>
                  </div>
                )}
                {tech.documentatie.ontwikkelingEnBeheer && (
                  <div>
                    <div className="fw-semibold mb-1">Ontwikkeling &amp; beheer</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.ontwikkelingEnBeheer}</p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Functionaliteiten */}
          <Section
            title="Functionaliteiten"
            id="functionaliteiten"
            badge={`${tech.geboden_functionaliteit?.filter(Boolean).length ?? 0} item${(tech.geboden_functionaliteit?.filter(Boolean).length ?? 0) !== 1 ? 's' : ''}`}
          >
            <TagList items={tech.geboden_functionaliteit?.filter(Boolean) ?? []} bg="primary" />
            {(tech.technologietype || tech.type_technologie?.filter(Boolean).length) ? (
              <div className="mt-3">
                <div className="fw-semibold small mb-1">Technologietype</div>
                <TagList items={[tech.technologietype ?? '', ...(tech.type_technologie ?? [])].filter(Boolean)} bg="primary" />
              </div>
            ) : null}
          </Section>

          {/* Ondersteuning voor */}
          <Section
            title="Ondersteuning voor"
            id="ondersteuning"
            badge={`${tech.ondersteuning_voor?.length ?? 0} item${(tech.ondersteuning_voor?.length ?? 0) !== 1 ? 's' : ''}`}
          >
            {tech.ondersteuning_voor?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase small fw-semibold">Beschouwingsniveau</th>
                      <th className="text-uppercase small fw-semibold">Modelsoort</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tech.ondersteuning_voor.map((o, i) => (
                      <tr key={i}>
                        <td>{o.beschouwingsniveau || '–'}</td>
                        <td>{o.modelsoort || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted">–</p>}
          </Section>

          {/* Geschikt voor taak */}
          <Section
            title="Geschikt voor taak"
            id="taken"
            badge={`${tech.geschikt_voor_taak?.filter(t => t.taaktype).length ?? 0} taaktype${(tech.geschikt_voor_taak?.filter(t => t.taaktype).length ?? 0) !== 1 ? 'n' : ''}`}
          >
            {tech.geschikt_voor_taak?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {tech.geschikt_voor_taak.map((t, i) => (
                  <div key={i} className="card border-0 bg-light px-3 py-2">
                    <div className="fw-semibold text-primary small">{t.taaktype || '–'}</div>
                    {t.omschrijving && <div className="text-muted small mt-1">{t.omschrijving}</div>}
                  </div>
                ))}
              </div>
            ) : <p className="text-muted">–</p>}
          </Section>

          {/* Bronverwijzingen */}
          <Section
            title="Bronverwijzingen"
            id="bronverwijzingen"
            badge={`${tech.bronverwijzing?.length ?? 0} bron${(tech.bronverwijzing?.length ?? 0) !== 1 ? 'nen' : ''}`}
          >
            {(tech.bronverwijzing?.length ?? 0) > 0 ? (
              <ul className="mb-0">
                {tech.bronverwijzing?.map((b, i) => (
                  <li key={i}>
                    {b.locatie
                      ? <a href={b.locatie} target="_blank" rel="noopener noreferrer" className="text-primary">{b.titel || b.locatie}</a>
                      : b.titel || '–'
                    }
                    {b.verwijzing && <span className="text-muted ms-2 small">{b.verwijzing}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted">–</p>}
          </Section>

          <div className="d-flex gap-2 mt-3 pt-3 border-top">
            <button className="btn btn-sm btn-outline-primary" onClick={downloadTurtle}>Download Turtle</button>
            <button className="btn btn-sm btn-outline-success" onClick={downloadMarkdown}>Download Markdown</button>
          </div>

          <div className="text-muted small mt-3">Bijgewerkt op {tech.bijgewerkt_op || '–'}</div>
        </div>

      </div>

      {editingSticky && (
        <>
          <div
            onClick={closeStickyEditor}
            className="lt-detail-editor-overlay"
          />

          <aside className="lt-detail-editor-drawer">
            <div className="lt-detail-editor-head">
              <div>
                <div className="lt-detail-editor-title">Sticky note bewerken</div>
                <div className="lt-detail-editor-subtitle">
                  {editingSticky.board.name} / {editingSticky.section || 'onbekende sectie'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={closeStickyEditor}
              >
                Sluiten
              </button>
            </div>

            <div className="lt-detail-editor-body">
              <div
                className="lt-detail-editor-note"
                style={stickyNoteColorStyle(editingSticky.color)}
              >
                <div className="mb-2">
                  <span className="lt-detail-sticky-chip" style={stickyStatusChipStyle(editingSticky.status)}>{editingSticky.status}</span>
                </div>
                <div className="lt-detail-editor-note-text">{editingSticky.text}</div>
              </div>

              <section className="lt-detail-sticky-editor-form">
                <div className="fw-semibold mb-2">Aanpassen</div>

                <label className="lt-detail-form-group">
                  <span className="lt-detail-form-label">Status</span>
                  <div className="lt-detail-form-row">
                    <select
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value)}
                      className="form-select form-select-sm"
                      disabled={savingSticky}
                    >
                      <option value="">Kies status</option>
                      {stickyStatuses.map((status) => (
                        <option key={status} value={stickyStatusIriByLabel[status] || ''}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={savingSticky || !statusDraft}
                      onClick={() => patchStickyReview({ statusIri: statusDraft })}
                    >
                      Opslaan
                    </button>
                  </div>
                </label>

                <label className="lt-detail-form-group">
                  <span className="lt-detail-form-label">Definitieve technologie</span>
                  <div className="lt-detail-sticky-suggestion-list">
                    <input
                      value={definitiveTechNameDraft}
                      onChange={(event) => {
                        setDefinitiveTechNameDraft(event.target.value);
                        setDefinitiveTechDraft('');
                      }}
                      className="form-control form-control-sm"
                      placeholder="Typ 2+ letters van technologie naam"
                      disabled={savingSticky}
                    />

                    {loadingSuggestions ? (
                      <div className="lt-detail-loading-inline">Zoeken...</div>
                    ) : techSuggestions.length > 0 ? (
                      <div className="lt-detail-suggestion-list">
                        {techSuggestions.map((suggestion) => (
                          <button
                            type="button"
                            key={suggestion.uri}
                            onClick={() => {
                              setDefinitiveTechDraft(suggestion.uri);
                              setDefinitiveTechNameDraft(suggestion.name || suggestion.uri);
                              setTechSuggestions([]);
                            }}
                            className="lt-detail-suggestion"
                          >
                            <div className="lt-detail-suggestion-name">{suggestion.name}</div>
                            <div className="lt-detail-suggestion-uri">
                              {suggestion.uri}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="lt-detail-form-row">
                      <input
                        value={definitiveTechDraft}
                        onChange={(event) => setDefinitiveTechDraft(event.target.value)}
                        className="form-control form-control-sm"
                        placeholder="Geselecteerde URI (of handmatig invullen)"
                        disabled={savingSticky}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={savingSticky || !definitiveTechDraft.trim()}
                        onClick={() =>
                          patchStickyReview({ definitiveTechnologyUri: definitiveTechDraft.trim() })
                        }
                      >
                        Opslaan
                      </button>
                    </div>
                  </div>
                </label>

                {editingSticky.candidateTechnologies.length > 0 && (
                  <div>
                    <div className="lt-detail-subkicker mb-2">Kandidaat definitief maken</div>
                    <div className="lt-detail-sticky-candidate-list">
                      {editingSticky.candidateTechnologies.map((candidate) => (
                        <div key={`${editingSticky.uri}-${candidate.uri}`} className="lt-detail-candidate-card">
                          <div className="lt-detail-candidate-name">
                            {candidate.name || 'Kandidaat'}
                          </div>
                          <div className="lt-detail-candidate-uri">
                            {candidate.uri}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            disabled={savingSticky}
                            onClick={() =>
                              patchStickyReview({
                                moveCandidateToDefinitiveUri: candidate.uri,
                              })
                            }
                          >
                            Maak definitief
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="lt-detail-form-group">
                  <span className="lt-detail-form-label">Omschrijving afhandeling</span>
                  <textarea
                    value={omschrijvingDraft}
                    onChange={(event) => setOmschrijvingDraft(event.target.value)}
                    className="form-control form-control-sm"
                    rows={4}
                    placeholder="Beschrijf hoe deze sticky note is afgehandeld..."
                    disabled={savingSticky}
                  />
                  <div className="lt-detail-actions-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={savingSticky}
                      onClick={() =>
                        patchStickyReview({ omschrijvingAfhandeling: omschrijvingDraft })
                      }
                    >
                      Opslaan
                    </button>
                  </div>
                </label>

                {stickyActionError && (
                  <div className="alert alert-danger py-2 px-3 mt-2 mb-0">{stickyActionError}</div>
                )}
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

