import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  'In gebruik': 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  'Voorstel': 'border border-amber-200 bg-amber-50 text-amber-900',
  'Work in progress': 'border border-sky-200 bg-sky-50 text-sky-900',
};

const SUBTYPE_BADGE: Record<string, string> = {
  Methode: 'border border-blue-200 bg-blue-50 text-blue-800',
  Standaard: 'border border-amber-200 bg-amber-50 text-amber-900',
  Tool: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
};

const DEFAULT_BADGE = 'border border-slate-200 bg-slate-100 text-slate-700';

const BUTTON_SECONDARY_SM =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_PRIMARY_SM =
  'inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_OUTLINE_PRIMARY_SM =
  'inline-flex items-center justify-center rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_OUTLINE_SUCCESS_SM =
  'inline-flex items-center justify-center rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60';

const INPUT_SM =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:bg-slate-100';
const SELECT_SM = INPUT_SM;
const TEXTAREA_SM = INPUT_SM;

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

function TagList({ items, bg = 'primary' }: { items: string[]; bg?: string }) {
  const visible = items.filter(Boolean);
  const tones: Record<string, string> = {
    primary: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    secondary: 'border-slate-200 bg-slate-100 text-slate-700',
  };
  if (!visible.length) return <span className="text-slate-500">–</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((v, i) => (
        <span
          key={i}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            tones[bg] || tones.secondary
          } lt-detail-accent-badge`}
        >
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
    <div id={id} className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lt-detail-section">
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 py-2.5 lt-detail-section-header">
        <span className="font-semibold text-slate-800">{title}</span>
        {badge && (
          <span className="ml-2 inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 lt-detail-section-badge">
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
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
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
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
          iri: data.iri,
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
  }, [id, setActiveTechnology]);

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
      try {
        const technologyUri =
          (tech?.iri || '').trim() ||
          ((id || '').startsWith('http://') || (id || '').startsWith('https://') ? (id || '').trim() : '');

        const endpoint = technologyUri
          ? `/api/stickynotes?technologyUri=${encodeURIComponent(technologyUri)}`
          : '/api/stickynotes';

        const data = await apiFetch<StickyNote[]>(endpoint);
        setStickyNotes(data);
      } catch {
        setStickyNotes([]);
      }
    };

    fetchStickyNotes();
  }, [tech?.id, tech?.iri, id]);

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
      <div className="flex items-center justify-center py-10 text-slate-500">
        <span
          className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
          role="status"
          aria-hidden="true"
        />
        Laden…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 lt-detail-error-wrap">
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
        <button className={BUTTON_SECONDARY_SM} onClick={() => navigate(-1)}>← Terug</button>
      </div>
    );
  }

  if (!tech) return null;

  const subtypeBadge = SUBTYPE_BADGE[tech.subtype ?? ''] ?? DEFAULT_BADGE;
  const statusBadge = STATUS_BADGE[tech.gebruiksstatus] ?? DEFAULT_BADGE;

  return (
    <div className="page-card page-card--xxl lt-detail-page">

      {/* Terug */}
      <a
        href="#"
        className="inline-block text-sm text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lt-detail-back-link"
        onClick={e => { e.preventDefault(); navigate(-1); }}
      >
        ← Terug naar overzicht
      </a>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between lt-detail-header">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {tech.subtype && <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${subtypeBadge}`}>{tech.subtype}</span>}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge}`}>{tech.gebruiksstatus || 'Onbekend'}</span>
            {tech.normstatus && <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{tech.normstatus}</span>}
          </div>
          <h2 className="mb-1 text-2xl font-bold text-blue-700">{tech.naam}</h2>
          <div className="text-sm text-slate-500">
            {tech.abbrevation && <span>{tech.abbrevation}</span>}
            {tech.abbrevation && tech.versienummer && <span> · </span>}
            {tech.versienummer && <span>versie {tech.versienummer}</span>}
            {tech.versiedatum && <span> ({tech.versiedatum})</span>}
          </div>
          {tech.bronverwijzing && tech.bronverwijzing.filter(b => b.locatie).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {tech.bronverwijzing.filter(b => b.locatie).map((b, i) => (
                <a key={i} href={b.locatie} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline-offset-2 hover:underline">
                  {b.titel || b.locatie}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mt-1 flex shrink-0 gap-2 sm:ml-3">
          <button
            type="button"
            className={`${BUTTON_SECONDARY_SM} lt-detail-action-btn`}
            disabled
          >
            ⊙ Details
          </button>
          <button
            type="button"
            className={`${BUTTON_SECONDARY_SM} lt-detail-action-btn`}
            onClick={() => navigate(`/legaltechnologies/${encodeURIComponent(id!)}/edit`)}
          >
            ✎ Bewerken
          </button>
        </div>
      </div>

      {/* Twee kolommen */}
      <div className="grid grid-cols-1 gap-4 lt-detail-main-row">

        {/* Links: secties */}
        <div>

          {/* Omschrijving + Documentatie */}
          <Section title="Omschrijving" id="omschrijving">
            <p className="leading-relaxed">{tech.omschrijving || <span className="text-slate-500">–</span>}</p>
            {tech.documentatie && Object.values(tech.documentatie).some(Boolean) && (
              <div className="mt-1 flex flex-col gap-3">
                {tech.documentatie.beoogdGebruik && (
                  <div>
                    <div className="mb-1 font-semibold">Beoogd gebruik</div>
                    <p className="mb-0 leading-relaxed">{tech.documentatie.beoogdGebruik}</p>
                  </div>
                )}
                {tech.documentatie.toegevoegdeWaarde && (
                  <div>
                    <div className="mb-1 font-semibold">Toegevoegde waarde</div>
                    <p className="mb-0 leading-relaxed">{tech.documentatie.toegevoegdeWaarde}</p>
                  </div>
                )}
                {tech.documentatie.onderdelen && (
                  <div>
                    <div className="mb-1 font-semibold">Onderdelen</div>
                    <p className="mb-0 leading-relaxed">{tech.documentatie.onderdelen}</p>
                  </div>
                )}
                {tech.documentatie.ontwikkelingEnBeheer && (
                  <div>
                    <div className="mb-1 font-semibold">Ontwikkeling &amp; beheer</div>
                    <p className="mb-0 leading-relaxed">{tech.documentatie.ontwikkelingEnBeheer}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    to={`/documentation?section=catalogus&technology=${encodeURIComponent(tech.id || id || '')}`}
                    className={BUTTON_OUTLINE_PRIMARY_SM}
                  >
                    Open catalogussectie
                  </Link>
                  <Link
                    to="/documentation?section=ontologie"
                    className={BUTTON_SECONDARY_SM}
                  >
                    Open ontologie
                  </Link>
                </div>
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
                <div className="mb-1 text-sm font-semibold">Technologietype</div>
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
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Beschouwingsniveau</th>
                      <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Modelsoort</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tech.ondersteuning_voor.map((o, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2">{o.beschouwingsniveau || '–'}</td>
                        <td className="px-3 py-2">{o.modelsoort || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-slate-500">–</p>}
          </Section>

          {/* Geschikt voor taak */}
          <Section
            title="Geschikt voor taak"
            id="taken"
            badge={`${tech.geschikt_voor_taak?.filter(t => t.taaktype).length ?? 0} taaktype${(tech.geschikt_voor_taak?.filter(t => t.taaktype).length ?? 0) !== 1 ? 'n' : ''}`}
          >
            {tech.geschikt_voor_taak?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {tech.geschikt_voor_taak.map((t, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-sm font-semibold text-blue-700">{t.taaktype || '–'}</div>
                    {t.omschrijving && <div className="mt-1 text-sm text-slate-500">{t.omschrijving}</div>}
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500">–</p>}
          </Section>

          {/* Bronverwijzingen */}
          <Section
            title="Bronverwijzingen"
            id="bronverwijzingen"
            badge={`${tech.bronverwijzing?.length ?? 0} bron${(tech.bronverwijzing?.length ?? 0) !== 1 ? 'nen' : ''}`}
          >
            {(tech.bronverwijzing?.length ?? 0) > 0 ? (
              <ul className="mb-0 list-disc space-y-1 pl-5">
                {tech.bronverwijzing?.map((b, i) => (
                  <li key={i}>
                    {b.locatie
                      ? <a href={b.locatie} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline-offset-2 hover:underline">{b.titel || b.locatie}</a>
                      : b.titel || '–'
                    }
                    {b.verwijzing && <span className="ml-2 text-sm text-slate-500">{b.verwijzing}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-500">–</p>}
          </Section>

          <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
            <button className={BUTTON_OUTLINE_PRIMARY_SM} onClick={downloadTurtle}>Download Turtle</button>
            <button className={BUTTON_OUTLINE_SUCCESS_SM} onClick={downloadMarkdown}>Download Markdown</button>
          </div>

          <div className="mt-3 text-sm text-slate-500">Bijgewerkt op {tech.bijgewerkt_op || '–'}</div>
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
                className={BUTTON_SECONDARY_SM}
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
                <div className="mb-2 font-semibold">Aanpassen</div>

                <label className="lt-detail-form-group">
                  <span className="lt-detail-form-label">Status</span>
                  <div className="lt-detail-form-row">
                    <select
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value)}
                      className={SELECT_SM}
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
                      className={BUTTON_PRIMARY_SM}
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
                      className={INPUT_SM}
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
                        className={INPUT_SM}
                        placeholder="Geselecteerde URI (of handmatig invullen)"
                        disabled={savingSticky}
                      />
                      <button
                        type="button"
                        className={BUTTON_PRIMARY_SM}
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
                    <div className="mb-2 lt-detail-subkicker">Kandidaat definitief maken</div>
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
                            className={BUTTON_OUTLINE_PRIMARY_SM}
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
                    className={TEXTAREA_SM}
                    rows={4}
                    placeholder="Beschrijf hoe deze sticky note is afgehandeld..."
                    disabled={savingSticky}
                  />
                  <div className="lt-detail-actions-end">
                    <button
                      type="button"
                      className={BUTTON_PRIMARY_SM}
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
                  <div className="mb-0 mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{stickyActionError}</div>
                )}
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

