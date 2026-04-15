import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

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

type EnumerationGroup = {
  name: string;
  values: string[];
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

const LegalTechnologyByTasktype: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<LegalTechnology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTasktype, setActiveTasktype] = useState<string | null>(null);

  const [enumGebruikersgroepen, setEnumGebruikersgroepen] = useState<string[]>([]);
  const [enumLicentievormen, setEnumLicentievormen] = useState<string[]>([]);
  const [enumBeschouwingsniveaus, setEnumBeschouwingsniveaus] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [gebruikersgroepFilter, setGebruikersgroepFilter] = useState('');
  const [licentievormFilter, setLicentievormFilter] = useState('');
  const [beschouwingsniveauFilter, setBeschouwingsniveauFilter] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        try {
          const groups = await apiFetch<EnumerationGroup[]>(`/api/legaltechnologies/enumerations`);
          const byName = new Map(groups.map(group => [group.name, group.values ?? []]));
          setEnumGebruikersgroepen((byName.get('Gebruikersgroepen') ?? []).filter(Boolean));
          setEnumLicentievormen((byName.get('Licentievormen') ?? []).filter(Boolean));
          setEnumBeschouwingsniveaus((byName.get('Beschouwingsniveaus') ?? []).filter(Boolean));
        } catch {
          // Keep UI functional if enumeration endpoint is unavailable.
        }

        const summaries = await apiFetch<LegalTechnologySummary[]>(`/api/legaltechnologies/search?q=`);
        const details = await Promise.all(
          summaries
            .filter(summary => !!summary.id)
            .map(async summary => {
              try {
                return await apiFetch<LegalTechnology>(`/api/legaltechnologies/${encodeURIComponent(summary.id!)}`);
              } catch {
                return null;
              }
            }),
        );
        const resolved = details.filter((item): item is LegalTechnology => item !== null);
        setItems(resolved);

        const firstTasktype = resolved
          .flatMap(item => (item.geschikt_voor_taak ?? []).map(entry => entry.taaktype).filter(Boolean))[0] ?? null;
        setActiveTasktype(firstTasktype);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const gebruikersgroepen = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...enumGebruikersgroepen,
            ...items.flatMap(item => (item.beoogde_gebruikers ?? []).filter(Boolean)),
          ],
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items, enumGebruikersgroepen],
  );

  const licentievormen = useMemo(
    () =>
      Array.from(
        new Set([
          ...enumLicentievormen,
          ...items.map(item => item.licentievorm).filter(Boolean),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [items, enumLicentievormen],
  );

  const beschouwingsniveaus = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...enumBeschouwingsniveaus,
            ...items.flatMap(item => (item.ondersteuning_voor ?? []).map(o => o.beschouwingsniveau).filter(Boolean)),
          ],
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items, enumBeschouwingsniveaus],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      const taaktypen = (item.geschikt_voor_taak ?? []).map(t => t.taaktype).filter(Boolean);
      const matchesSearch =
        !q ||
        item.naam?.toLowerCase().includes(q) ||
        item.omschrijving?.toLowerCase().includes(q) ||
        taaktypen.some(taaktype => taaktype.toLowerCase().includes(q));

      const matchesGebruikersgroep =
        !gebruikersgroepFilter ||
        (item.beoogde_gebruikers ?? []).includes(gebruikersgroepFilter);

      const matchesLicentievorm =
        !licentievormFilter || item.licentievorm === licentievormFilter;

      const matchesBeschouwingsniveau =
        !beschouwingsniveauFilter ||
        (item.ondersteuning_voor ?? []).some(
          ov => ov.beschouwingsniveau === beschouwingsniveauFilter,
        );

      return (
        matchesSearch &&
        matchesGebruikersgroep &&
        matchesLicentievorm &&
        matchesBeschouwingsniveau
      );
    });
  }, [items, search, gebruikersgroepFilter, licentievormFilter, beschouwingsniveauFilter]);

  const groupedByTasktype = useMemo(() => {
    const groups: Record<string, LegalTechnology[]> = {};

    filteredItems.forEach(item => {
      const taaktypen = (item.geschikt_voor_taak ?? []).map(t => t.taaktype).filter(Boolean);
      taaktypen.forEach(taaktype => {
        if (!groups[taaktype]) groups[taaktype] = [];
        groups[taaktype].push(item);
      });
    });

    return Object.entries(groups)
      .map(([taaktype, technologies]) => ({
        taaktype,
        technologies: technologies.sort((a, b) => a.naam.localeCompare(b.naam)),
      }))
      .sort((a, b) => a.taaktype.localeCompare(b.taaktype));
  }, [filteredItems]);

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        Laden...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-2 mb-3">
        <div className="col-12 col-lg-4">
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Zoek op naam, omschrijving of taaktype..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-4 col-lg-3">
          <select
            className="form-select form-select-sm"
            value={gebruikersgroepFilter}
            onChange={e => setGebruikersgroepFilter(e.target.value)}
          >
            <option value="">Alle gebruikersgroepen</option>
            {gebruikersgroepen.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-4 col-lg-3">
          <select
            className="form-select form-select-sm"
            value={licentievormFilter}
            onChange={e => setLicentievormFilter(e.target.value)}
          >
            <option value="">Alle licentievormen</option>
            {licentievormen.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-4 col-lg-2">
          <select
            className="form-select form-select-sm"
            value={beschouwingsniveauFilter}
            onChange={e => setBeschouwingsniveauFilter(e.target.value)}
          >
            <option value="">Alle beschouwingsniveaus</option>
            {beschouwingsniveaus.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="small text-muted mb-2">
        {groupedByTasktype.length} taaktype{groupedByTasktype.length !== 1 ? 'n' : ''} gevonden
      </div>

      {groupedByTasktype.length === 0 ? (
        <div className="text-center py-4 text-muted border rounded">
          Geen resultaten voor deze zoek/filter-combinatie.
        </div>
      ) : (
        <div className="accordion" id="tasktypeAccordion">
          {groupedByTasktype.map((group, idx) => {
            const collapseId = `tasktype-collapse-${idx}`;
            const headingId = `tasktype-heading-${idx}`;
            const isOpen = activeTasktype === group.taaktype;
            return (
              <div className="accordion-item" key={group.taaktype}>
                <h2 className="accordion-header" id={headingId}>
                  <button
                    className={`accordion-button ${isOpen ? '' : 'collapsed'}`}
                    type="button"
                    onClick={() => setActiveTasktype(prev => (prev === group.taaktype ? null : group.taaktype))}
                    aria-expanded={isOpen}
                    aria-controls={collapseId}
                  >
                    <span className="fw-semibold me-2">{group.taaktype}</span>
                    <span className="badge bg-primary-subtle text-primary-emphasis">
                      {group.technologies.length} technologie{group.technologies.length !== 1 ? 'ën' : ''}
                    </span>
                  </button>
                </h2>
                <div
                  id={collapseId}
                  className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`}
                  aria-labelledby={headingId}
                >
                  <div className="accordion-body p-0">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Naam</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Licentie</th>
                            <th>Versie</th>
                            <th className="text-end">Acties</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.technologies.map((tech, techIdx) => (
                            <tr key={tech.id || `${group.taaktype}-${techIdx}`}>
                              <td>
                                <div className="fw-semibold">{tech.naam}</div>
                                <small className="text-muted">{tech.abbrevation || tech.id || '-'}</small>
                              </td>
                              <td><SubtypeBadge value={tech.subtype} /></td>
                              <td><StatusBadge value={tech.gebruiksstatus} /></td>
                              <td>{tech.licentievorm || '-'}</td>
                              <td>{tech.versienummer || '-'}</td>
                              <td className="text-end text-nowrap">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => tech.id && navigate(`/legaltechnologies/${encodeURIComponent(tech.id)}`)}
                                  disabled={!tech.id}
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LegalTechnologyByTasktype;
