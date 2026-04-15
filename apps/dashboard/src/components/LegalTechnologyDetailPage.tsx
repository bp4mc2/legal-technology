import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, apiFetchText } from '../utils/api';

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

type LegalTechnology = {
  id?: string;
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

function TagList({ items, bg = 'primary' }: { items: string[]; bg?: string }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return <span className="text-muted">–</span>;
  return (
    <div className="d-flex flex-wrap gap-1">
      {visible.map((v, i) => (
        <span key={i} className={`badge bg-${bg} bg-opacity-10 border text-${bg.startsWith('warning') ? 'dark' : bg} fw-normal`}
          style={{ fontSize: '0.8rem' }}>
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
  const [open, setOpen] = useState(true);
  return (
    <div id={id} className="accordion-item mb-3">
      <h2 className="accordion-header">
        <button
          className={`accordion-button ${open ? '' : 'collapsed'} fw-semibold`}
          type="button"
          onClick={() => setOpen(o => !o)}
        >
          <span className="fw-semibold me-2">{title}</span>
          {badge && <span className="badge bg-primary-subtle text-primary-emphasis">{badge}</span>}
        </button>
      </h2>
      <div className={`accordion-collapse collapse ${open ? 'show' : ''}`}>
        <div className="accordion-body">{children}</div>
      </div>
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
  const [tech, setTech] = useState<LegalTechnology | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

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
      <div className="p-3" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>← Terug</button>
      </div>
    );
  }

  if (!tech) return null;

  const subtypeBadge = SUBTYPE_BADGE[tech.subtype ?? ''] ?? 'secondary';
  const statusBadge = STATUS_BADGE[tech.gebruiksstatus] ?? 'secondary';

  const sections = [
    { id: 'omschrijving', label: 'Omschrijving' },
    { id: 'functionaliteiten', label: 'Functionaliteiten' },
    { id: 'ondersteuning', label: 'Ondersteuning voor' },
    { id: 'taken', label: 'Geschikt voor taak' },
    { id: 'documentatie', label: 'Documentatie' },
    { id: 'bronverwijzingen', label: 'Bronverwijzingen' },
  ];

  return (
    <div className="p-3 bg-white rounded shadow-sm">

      {/* Terug */}
      <button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Terug naar overzicht
      </button>

      {/* Header */}
      <div className="border-bottom pb-3 mb-4">
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

      {/* Twee kolommen */}
      <div className="row g-4 align-items-start">

        {/* Links: inhoudsopgave + secties */}
        <div className="col-lg-8">

          {/* Inhoudsopgave */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary bg-opacity-10 text-primary fw-semibold">
              Inhoud
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                {sections.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Omschrijving */}
          <Section title="Omschrijving" id="omschrijving">
            <p className="lh-lg mb-0">{tech.omschrijving || <span className="text-muted">–</span>}</p>
          </Section>

          {/* Functionaliteiten */}
          <Section
            title="Functionaliteiten"
            id="functionaliteiten"
            badge={`${tech.geboden_functionaliteit?.filter(Boolean).length ?? 0} item${(tech.geboden_functionaliteit?.filter(Boolean).length ?? 0) !== 1 ? 's' : ''}`}
          >
            {tech.geboden_functionaliteit?.filter(Boolean).length > 0 ? (
              <ul className="mb-2">
                {tech.geboden_functionaliteit.filter(Boolean).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            ) : <p className="text-muted">–</p>}
            {(tech.technologietype || tech.type_technologie?.filter(Boolean).length) ? (
              <div className="mt-2">
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
                      <th>Beschouwingsniveau</th>
                      <th>Modelsoort</th>
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

          {/* Documentatie */}
          <Section
            title="Documentatie"
            id="documentatie"
            badge={tech.documentatie && Object.values(tech.documentatie).some(Boolean) ? 'beschikbaar' : 'leeg'}
          >
            {tech.documentatie && Object.values(tech.documentatie).some(Boolean) ? (
              <div className="d-flex flex-column gap-3">
                {tech.documentatie.beoogdGebruik && (
                  <div>
                    <div className="fw-semibold small mb-1">Beoogd gebruik</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.beoogdGebruik}</p>
                  </div>
                )}
                {tech.documentatie.toegevoegdeWaarde && (
                  <div>
                    <div className="fw-semibold small mb-1">Toegevoegde waarde</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.toegevoegdeWaarde}</p>
                  </div>
                )}
                {tech.documentatie.onderdelen && (
                  <div>
                    <div className="fw-semibold small mb-1">Onderdelen</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.onderdelen}</p>
                  </div>
                )}
                {tech.documentatie.ontwikkelingEnBeheer && (
                  <div>
                    <div className="fw-semibold small mb-1">Ontwikkeling &amp; beheer</div>
                    <p className="mb-0 lh-lg">{tech.documentatie.ontwikkelingEnBeheer}</p>
                  </div>
                )}
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

        {/* Rechts: Op een oogopslag */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm" style={{ position: 'sticky', top: '1rem' }}>
            <div className="card-header bg-primary text-white fw-semibold small text-uppercase py-2" style={{ letterSpacing: '0.06em' }}>
              Op een oogopslag
            </div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0">
                <tbody>
                  <tr>
                    <th className="text-muted fw-normal small ps-3" style={{ width: '45%' }}>Beoogde gebruikers</th>
                    <td className="small pe-3">{tech.beoogde_gebruikers?.filter(Boolean).join(', ') || '–'}</td>
                  </tr>
                  {tech.technologietype && (
                    <tr>
                      <th className="text-muted fw-normal small ps-3">Technologietype</th>
                      <td className="small pe-3">{tech.technologietype}</td>
                    </tr>
                  )}
                  {(tech.type_technologie?.filter(Boolean).length ?? 0) > 0 && (
                    <tr>
                      <th className="text-muted fw-normal small ps-3">Type technologie</th>
                      <td className="small pe-3">{tech.type_technologie!.filter(Boolean).join(', ')}</td>
                    </tr>
                  )}
                  <tr>
                    <th className="text-muted fw-normal small ps-3">Vorm / subtype</th>
                    <td className="small pe-3">
                      {tech.subtype ? <span className={`badge bg-${subtypeBadge}`}>{tech.subtype}</span> : '–'}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-muted fw-normal small ps-3">Gebruiksstatus</th>
                    <td className="small pe-3">
                      <span className={`badge bg-${statusBadge}`}>{tech.gebruiksstatus || '–'}</span>
                    </td>
                  </tr>
                  <tr>
                    <th className="text-muted fw-normal small ps-3">Licentie</th>
                    <td className="small pe-3">{tech.licentievorm || '–'}</td>
                  </tr>
                  {tech.normstatus && (
                    <tr>
                      <th className="text-muted fw-normal small ps-3">Normstatus</th>
                      <td className="small pe-3">{tech.normstatus}</td>
                    </tr>
                  )}
                  {(tech.beheerder_org || tech.beheerder) && (
                    <tr>
                      <th className="text-muted fw-normal small ps-3">Beheerder</th>
                      <td className="small pe-3">{tech.beheerder_org?.naam || tech.beheerder}</td>
                    </tr>
                  )}
                  {(tech.leverancier_org || tech.leverancier) && (
                    <tr>
                      <th className="text-muted fw-normal small ps-3">Leverancier</th>
                      <td className="small pe-3">{tech.leverancier_org?.naam || tech.leverancier}</td>
                    </tr>
                  )}
                  <tr>
                    <th className="text-muted fw-normal small ps-3">Versie</th>
                    <td className="small pe-3">
                      {tech.versienummer || '–'}
                      {tech.versiedatum && <span className="text-muted ms-1">({tech.versiedatum})</span>}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-muted fw-normal small ps-3">Bijgewerkt op</th>
                    <td className="small pe-3">{tech.bijgewerkt_op || '–'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {tech.geboden_functionaliteit?.filter(Boolean).length > 0 && (
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-header bg-primary bg-opacity-10 text-primary fw-semibold small text-uppercase py-2" style={{ letterSpacing: '0.05em' }}>
                Functionaliteiten
              </div>
              <div className="card-body">
                <TagList items={tech.geboden_functionaliteit} bg="primary" />
              </div>
            </div>
          )}

          {tech.geschikt_voor_taak?.filter(t => t.taaktype).length > 0 && (
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-header bg-success bg-opacity-10 text-success fw-semibold small text-uppercase py-2" style={{ letterSpacing: '0.05em' }}>
                Taaktypes
              </div>
              <div className="card-body">
                <TagList items={tech.geschikt_voor_taak.map(t => t.taaktype).filter(Boolean)} bg="success" />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

