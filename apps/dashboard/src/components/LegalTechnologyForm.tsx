


import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

type Enumeration = {
  name: string;
  values: string[];
};

type Organisation = {
  iri: string;
  naam: string;
  contactinformatie: string;
};

type Documentatie = {
  beoogdGebruik: string;
  toegevoegdeWaarde: string;
  onderdelen: string;
  ontwikkelingEnBeheer: string;
};

type Versiebeschrijving = {
  versienummer: string;
  versiedatum: string;
};

type Bronverwijzing = {
  titel: string;
  locatie: string;
  verwijzing: string;
};
type LegalTechnology = {
  subtype?: 'Methode' | 'Standaard' | 'Tool';
  id?: string;
  abbrevation?: string;
  versienummer?: string;
  versiedatum?: string;
  versiebeschrijving: Versiebeschrijving;
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
  leverancier?: string;
  type_technologie?: string[];
};

type EditLegalTechnology = Omit<Partial<LegalTechnology>, 'documentatie'> & {
  documentatie?: Partial<Documentatie> | null;
};

const normalizeDateValue = (value?: string) => {
  if (!value) {
    return '';
  }
  return value.slice(0, 10);
};

const initialState: LegalTechnology = {
  subtype: 'Methode',
  abbrevation: '',
  versienummer: '1.0',
  versiedatum: '',
  versiebeschrijving: {
    versienummer: '1.0',
    versiedatum: '',
  },
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
  beheerder: '',
  leverancier: '',
  type_technologie: [''],
};

const withFallbackArray = <T,>(arr: T[] | undefined, fallback: T): T[] => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [fallback];
  }
  return arr;
};

const normalizeOndersteuning = (
  arr: { beschouwingsniveau: string; modelsoort: string }[] | undefined,
): { beschouwingsniveau: string; modelsoort: string }[] => {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter(item => {
    const besch = (item?.beschouwingsniveau || '').trim();
    const model = (item?.modelsoort || '').trim();
    return Boolean(besch || model);
  });
};

const normalizeTaakinvulling = (
  arr: { omschrijving: string; taaktype: string }[] | undefined,
): { omschrijving: string; taaktype: string }[] => {
  if (!Array.isArray(arr)) {
    return [];
  }
  const unique = new Set<string>();
  const cleaned: { omschrijving: string; taaktype: string }[] = [];
  for (const item of arr) {
    const omschrijving = (item?.omschrijving || '').trim();
    const taaktype = (item?.taaktype || '').trim();
    if (!omschrijving && !taaktype) {
      continue;
    }
    const key = `${omschrijving}||${taaktype}`;
    if (unique.has(key)) {
      continue;
    }
    unique.add(key);
    cleaned.push({ omschrijving, taaktype });
  }
  return cleaned;
};

const normalizeForForm = (tech: EditLegalTechnology): LegalTechnology => {
  const versiebeschrijving = tech.versiebeschrijving ?? {
    versienummer: tech.versienummer ?? initialState.versiebeschrijving.versienummer,
    versiedatum: normalizeDateValue(tech.versiedatum),
  };

  return {
    ...initialState,
    ...tech,
    subtype: tech.subtype ?? initialState.subtype,
    versienummer: tech.versienummer ?? versiebeschrijving.versienummer,
    versiedatum: normalizeDateValue(tech.versiedatum ?? versiebeschrijving.versiedatum),
    versiebeschrijving: {
      versienummer: versiebeschrijving.versienummer || initialState.versiebeschrijving.versienummer,
      versiedatum: normalizeDateValue(versiebeschrijving.versiedatum),
    },
    documentatie: {
      ...initialState.documentatie,
      ...(tech.documentatie ?? {}),
    },
    beheerder: tech.beheerder ?? '',
    leverancier: tech.leverancier ?? '',
    geboden_functionaliteit: withFallbackArray(tech.geboden_functionaliteit, ''),
    beoogde_gebruikers: withFallbackArray(tech.beoogde_gebruikers, ''),
    ondersteuning_voor: normalizeOndersteuning(tech.ondersteuning_voor),
    geschikt_voor_taak: normalizeTaakinvulling(tech.geschikt_voor_taak),
    bronverwijzing: withFallbackArray(tech.bronverwijzing, { titel: '', locatie: '', verwijzing: '' }),
    type_technologie: withFallbackArray(tech.type_technologie, ''),
  };
};

// Use a simple event system for demo purposes.
// Keep the latest payload so conditionally mounted forms can still prefill.
const listeners: ((tech: EditLegalTechnology) => void)[] = [];
let lastSelectedTech: EditLegalTechnology | null = null;
export function selectForEdit(tech: EditLegalTechnology) {
  lastSelectedTech = tech;
  listeners.forEach(fn => fn(tech));
}


type LegalTechnologyFormProps = {
  onSuccess?: () => void;
};


const LegalTechnologyForm: React.FC<LegalTechnologyFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<LegalTechnology>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enums, setEnums] = useState<Enumeration[]>([]);
  const [enumsLoading, setEnumsLoading] = useState(true);
  const [enumsError, setEnumsError] = useState<string | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [organisationsLoading, setOrganisationsLoading] = useState(true);
  const [organisationsError, setOrganisationsError] = useState<string | null>(null);

  useEffect(() => {
    // Load enumerations
    apiFetch<Enumeration[]>('/api/legaltechnologies/enumerations')
      .then(setEnums)
      .catch(e => setEnumsError(e.message))
      .finally(() => setEnumsLoading(false));

    // Load organisations
    apiFetch<Organisation[]>('/api/organisations')
      .then(setOrganisations)
      .catch(e => setOrganisationsError(e.message))
      .finally(() => setOrganisationsLoading(false));
  }, []);

  useEffect(() => {
    const fn = (tech: EditLegalTechnology) => {
      setForm(normalizeForForm(tech));
      setSuccess(null);
      setError(null);
    };

    // Replay latest selection in case the form mounted after selectForEdit was called.
    if (lastSelectedTech) {
      fn(lastSelectedTech);
    }

    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleVersiebeschrijvingChange = (field: keyof Versiebeschrijving, value: string) => {
    setForm(f => {
      const nextVersiebeschrijving = {
        ...f.versiebeschrijving,
        [field]: field === 'versiedatum' ? normalizeDateValue(value) : value,
      };

      return {
        ...f,
        versienummer: nextVersiebeschrijving.versienummer,
        versiedatum: nextVersiebeschrijving.versiedatum,
        versiebeschrijving: nextVersiebeschrijving,
      };
    });
  };

  // For multi-select type_technologie
  const handleTypeTechnologieChange = (idx: number, value: string) => {
    setForm(f => {
      const arr = [...(f.type_technologie || [])];
      arr[idx] = value;
      return { ...f, type_technologie: arr };
    });
  };
  const handleAddTypeTechnologie = () => {
    setForm(f => ({ ...f, type_technologie: [...(f.type_technologie || []), ''] }));
  };
  const handleRemoveTypeTechnologie = (idx: number) => {
    setForm(f => {
      const arr = [...(f.type_technologie || [])];
      arr.splice(idx, 1);
      return { ...f, type_technologie: arr };
    });
  };


  // Add/remove for array fields (except ondersteuning_voor and geschikt_voor_taak)
  const handleArrayChange = (key: keyof LegalTechnology, idx: number, value: string) => {
    if (key === 'ondersteuning_voor' || key === 'geschikt_voor_taak') return;
    setForm(f => {
      const arr = Array.isArray(f[key]) ? [...(f[key] as string[])] : [];
      arr[idx] = value;
      return { ...f, [key]: arr };
    });
  };

  const handleAddArrayItem = (key: keyof LegalTechnology) => {
    if (key === 'ondersteuning_voor' || key === 'geschikt_voor_taak') return;
    setForm(f => {
      const arr = Array.isArray(f[key]) ? [...(f[key] as string[])] : [];
      arr.push('');
      return { ...f, [key]: arr };
    });
  };

  const handleRemoveArrayItem = (key: keyof LegalTechnology, idx: number) => {
    if (key === 'ondersteuning_voor' || key === 'geschikt_voor_taak') return;
    setForm(f => {
      const arr = Array.isArray(f[key]) ? [...(f[key] as string[])] : [];
      arr.splice(idx, 1);
      return { ...f, [key]: arr };
    });
  };

  // Special handlers for geschikt_voor_taak
  const handleTaakinvullingChange = (idx: number, field: 'omschrijving' | 'taaktype', value: string) => {
    setForm(f => {
      const arr = [...f.geschikt_voor_taak];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...f, geschikt_voor_taak: arr };
    });
  };

  const handleAddTaakinvulling = () => {
    setForm(f => ({ ...f, geschikt_voor_taak: [...f.geschikt_voor_taak, { omschrijving: '', taaktype: '' }] }));
  };

  const handleRemoveTaakinvulling = (idx: number) => {
    setForm(f => {
      const arr = [...f.geschikt_voor_taak];
      arr.splice(idx, 1);
      return { ...f, geschikt_voor_taak: arr };
    });
  };

  // Special handlers for ondersteuning_voor
  const handleOndersteuningChange = (idx: number, field: 'beschouwingsniveau' | 'modelsoort', value: string) => {
    setForm(f => {
      const arr = [...f.ondersteuning_voor];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...f, ondersteuning_voor: arr };
    });
  };

  const handleAddOndersteuning = () => {
    setForm(f => ({ ...f, ondersteuning_voor: [...f.ondersteuning_voor, { beschouwingsniveau: '', modelsoort: '' }] }));
  };

  const handleRemoveOndersteuning = (idx: number) => {
    setForm(f => {
      const arr = [...f.ondersteuning_voor];
      arr.splice(idx, 1);
      return { ...f, ondersteuning_voor: arr };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...form,
        versienummer: form.versiebeschrijving.versienummer,
        versiedatum: form.versiebeschrijving.versiedatum,
        versiebeschrijving: {
          versienummer: form.versiebeschrijving.versienummer,
          versiedatum: form.versiebeschrijving.versiedatum,
        },
      };

      if (form.id) {
        await apiFetch<LegalTechnology>(`/api/legaltechnologies/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Bewerkt!');
      } else {
        await apiFetch<LegalTechnology>('/api/legaltechnologies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Toegevoegd!');
      }
      setForm(initialState);
      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-sm">

      {/* Form header */}
      <div className="d-flex align-items-start justify-content-between mb-4 pb-3 border-bottom">
        <div>
          <h4 className="mb-0 fw-semibold text-primary">
            {form.id ? 'Juridische technologie bewerken' : 'Nieuwe juridische technologie'}
          </h4>
          {form.id && (
            <small className="text-muted font-monospace">{form.id}</small>
          )}
        </div>
        {form.id && (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle px-3 py-2">
            {form.subtype ?? 'JuridischeTechnologie'}
          </span>
        )}
      </div>

      {/* Type selector — segmented button group */}
      <div className="mb-4">
        <label className="form-label fw-semibold">Type</label>
        <div className="btn-group w-100" role="group" aria-label="Type juridische technologie">
          {(['Methode', 'Standaard', 'Tool'] as const).map(type => (
            <React.Fragment key={type}>
              <input
                type="radio"
                className="btn-check"
                name="subtype"
                id={`subtype-${type}`}
                value={type}
                checked={form.subtype === type}
                onChange={handleChange}
              />
              <label className="btn btn-outline-primary" htmlFor={`subtype-${type}`}>
                {type}
              </label>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Section: Identificatie & versie */}
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Identificatie</span>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="abbrevation" className="form-label">
                Afkorting <span className="text-muted fw-normal small">(voor IRI)</span>
              </label>
              <input
                id="abbrevation"
                name="abbrevation"
                className="form-control font-monospace"
                placeholder="bijv. ecli"
                value={form.abbrevation || ''}
                onChange={handleChange}
              />
              <div className="form-text">Wordt gebruikt voor de technologie-IRI.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Versiebeschrijving</span>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="versiebeschrijving-versienummer" className="form-label">Versienummer</label>
              <input
                id="versiebeschrijving-versienummer"
                className="form-control"
                placeholder="bijv. 1.0"
                value={form.versiebeschrijving.versienummer}
                onChange={e => handleVersiebeschrijvingChange('versienummer', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="versiebeschrijving-versiedatum" className="form-label">Versiedatum</label>
              <input
                id="versiebeschrijving-versiedatum"
                type="date"
                className="form-control"
                value={form.versiebeschrijving.versiedatum}
                onChange={e => handleVersiebeschrijvingChange('versiedatum', e.target.value)}
              />
              <div className="form-text">Wordt als ISO-datum verzonden in de versiebeschrijving.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Algemeen */}
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Algemeen</span>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="naam" className="form-label">
              Naam <span className="text-danger">*</span>
            </label>
            <input
              id="naam"
              name="naam"
              className="form-control"
              placeholder="Naam van de technologie"
              value={form.naam}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="omschrijving" className="form-label">
              Omschrijving <span className="text-danger">*</span>
            </label>
            <textarea
              id="omschrijving"
              name="omschrijving"
              className="form-control"
              rows={3}
              placeholder="Korte beschrijving van de technologie"
              value={form.omschrijving}
              onChange={handleChange}
              required
            />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                Gebruiksstatus <span className="text-danger">*</span>
              </label>
              {enumsLoading ? (
                <div className="form-control-plaintext text-muted small">Laden...</div>
              ) : enumsError ? (
                <div className="alert alert-danger p-2 small">{enumsError}</div>
              ) : (
                <select
                  name="gebruiksstatus"
                  className="form-select"
                  value={form.gebruiksstatus}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecteer...</option>
                  {enums.find(e => e.name.toLowerCase().includes('gebruiksstatus'))?.values.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Licentievorm <span className="text-danger">*</span>
              </label>
              {enumsLoading ? (
                <div className="form-control-plaintext text-muted small">Laden...</div>
              ) : enumsError ? (
                <div className="alert alert-danger p-2 small">{enumsError}</div>
              ) : (
                <select
                  name="licentievorm"
                  className="form-select"
                  value={form.licentievorm}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecteer...</option>
                  {enums.find(e => e.name.toLowerCase().includes('licentievorm'))?.values.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-md-4">
              <label htmlFor="bijgewerkt_op" className="form-label">Bijgewerkt op</label>
              <input
                id="bijgewerkt_op"
                name="bijgewerkt_op"
                type="date"
                className="form-control"
                value={form.bijgewerkt_op}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Functionaliteiten & Gebruikers */}
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Functionaliteiten &amp; Gebruikers</span>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Geboden functionaliteit(en)</label>
              {form.geboden_functionaliteit.map((val, idx) => (
                <div key={idx} className="input-group mb-2">
                  <select
                    className="form-select"
                    value={val}
                    onChange={e => handleArrayChange('geboden_functionaliteit', idx, e.target.value)}
                  >
                    <option value="">Selecteer...</option>
                    {enums.find(e => e.name.toLowerCase().includes('functionaliteit'))?.values.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    title="Verwijder"
                    onClick={() => handleRemoveArrayItem('geboden_functionaliteit', idx)}
                  >&#x2715;</button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleAddArrayItem('geboden_functionaliteit')}
              >+ Toevoegen</button>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Beoogde gebruiker(s)</label>
              {form.beoogde_gebruikers.map((val, idx) => (
                <div key={idx} className="input-group mb-2">
                  <select
                    className="form-select"
                    value={val}
                    onChange={e => handleArrayChange('beoogde_gebruikers', idx, e.target.value)}
                  >
                    <option value="">Selecteer...</option>
                    {enums.find(e => e.name.toLowerCase().includes('gebruikersgroep'))?.values.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    title="Verwijder"
                    onClick={() => handleRemoveArrayItem('beoogde_gebruikers', idx)}
                  >&#x2715;</button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleAddArrayItem('beoogde_gebruikers')}
              >+ Toevoegen</button>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Ondersteuning */}
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Ondersteuning</span>
        </div>
        <div className="card-body">
          {form.ondersteuning_voor.map((val, idx) => (
            <div key={idx} className="border rounded p-3 mb-2 bg-light">
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <label className="form-label small mb-1">Beschouwingsniveau</label>
                  <select
                    className="form-select form-select-sm"
                    value={val.beschouwingsniveau}
                    onChange={e => handleOndersteuningChange(idx, 'beschouwingsniveau', e.target.value)}
                  >
                    <option value="">Selecteer...</option>
                    {enums.find(e => e.name.toLowerCase().includes('beschouwingsniveau'))?.values.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label small mb-1">Modelsoort</label>
                  <select
                    className="form-select form-select-sm"
                    value={val.modelsoort}
                    onChange={e => handleOndersteuningChange(idx, 'modelsoort', e.target.value)}
                  >
                    <option value="">Selecteer...</option>
                    {enums.find(e => e.name.toLowerCase().includes('modelsoort'))?.values.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveOndersteuning(idx)}
                  >Verwijder</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddOndersteuning}>
            + Voeg ondersteuning toe
          </button>
        </div>
      </div>

      {/* Subtype-specific: Methode */}
      {form.subtype === 'Methode' && (
        <div className="card mb-3 border-info">
          <div className="card-header d-flex align-items-center gap-2 py-2 bg-info bg-opacity-10">
            <span className="fw-semibold text-info-emphasis">Methode-specifieke velden</span>
          </div>
          <div className="card-body">
            <label className="form-label">Beheerder</label>
            {organisationsLoading ? (
              <p className="text-muted small">Laden...</p>
            ) : organisationsError ? (
              <div className="alert alert-danger p-2 small">{organisationsError}</div>
            ) : (
              <select
                className="form-select"
                value={form.beheerder || ''}
                onChange={e => setForm(f => ({ ...f, beheerder: e.target.value }))}
              >
                <option value="">-- Selecteer organisatie --</option>
                {organisations.map(org => (
                  <option key={org.iri} value={org.iri}>{org.naam}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Subtype-specific: Standaard */}
      {form.subtype === 'Standaard' && (
        <div className="card mb-3 border-warning">
          <div className="card-header d-flex align-items-center gap-2 py-2 bg-warning bg-opacity-10">
            <span className="fw-semibold text-warning-emphasis">Standaard-specifieke velden</span>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Beheerder</label>
              {organisationsLoading ? (
                <p className="text-muted small">Laden...</p>
              ) : organisationsError ? (
                <div className="alert alert-danger p-2 small">{organisationsError}</div>
              ) : (
                <select
                  className="form-select"
                  value={form.beheerder || ''}
                  onChange={e => setForm(f => ({ ...f, beheerder: e.target.value }))}
                >
                  <option value="">-- Selecteer organisatie --</option>
                  {organisations.map(org => (
                    <option key={org.iri} value={org.iri}>{org.naam}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="form-label">Normstatus</label>
              <select
                name="normstatus"
                className="form-select"
                value={form.normstatus || ''}
                onChange={handleChange}
              >
                <option value="">Selecteer normstatus</option>
                {enums.find(e => e.name.toLowerCase().includes('normstatus'))?.values.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Subtype-specific: Tool */}
      {form.subtype === 'Tool' && (
        <div className="card mb-3 border-success">
          <div className="card-header d-flex align-items-center gap-2 py-2 bg-success bg-opacity-10">
            <span className="fw-semibold text-success-emphasis">Tool-specifieke velden</span>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Leverancier</label>
              {organisationsLoading ? (
                <p className="text-muted small">Laden...</p>
              ) : organisationsError ? (
                <div className="alert alert-danger p-2 small">{organisationsError}</div>
              ) : (
                <select
                  className="form-select"
                  value={form.leverancier || ''}
                  onChange={e => setForm(f => ({ ...f, leverancier: e.target.value }))}
                >
                  <option value="">-- Selecteer organisatie --</option>
                  {organisations.map(org => (
                    <option key={org.iri} value={org.iri}>{org.naam}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="form-label">Type technologie(en)</label>
              {(form.type_technologie || ['']).map((val, idx) => (
                <div key={idx} className="input-group mb-2">
                  <select
                    className="form-select"
                    value={val}
                    onChange={e => handleTypeTechnologieChange(idx, e.target.value)}
                  >
                    <option value="">Selecteer type technologie</option>
                    {enums.find(e => e.name.toLowerCase().includes('technologietype'))?.values.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => handleRemoveTypeTechnologie(idx)}
                  >&#x2715;</button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddTypeTechnologie}>
                + Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section: Taakinvulling */}
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Taakinvulling(en)</span>
        </div>
        <div className="card-body">
          {form.geschikt_voor_taak.map((val, idx) => (
            <div key={idx} className="border rounded p-3 mb-2 bg-light">
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <label className="form-label small mb-1">Omschrijving</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={val.omschrijving}
                    onChange={e => handleTaakinvullingChange(idx, 'omschrijving', e.target.value)}
                    placeholder="Omschrijving van de taak"
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label small mb-1">Taaktype</label>
                  <select
                    className="form-select form-select-sm"
                    value={val.taaktype}
                    onChange={e => handleTaakinvullingChange(idx, 'taaktype', e.target.value)}
                  >
                    <option value="">Selecteer...</option>
                    {enums.find(e => e.name.toLowerCase().includes('taaktype'))?.values.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveTaakinvulling(idx)}
                  >Verwijder</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddTaakinvulling}>
            + Voeg taakinvulling toe
          </button>
        </div>
      </div>

      {/* Section: Documentatie */}
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Documentatie</span>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Beoogd gebruik</label>
            <textarea
              className="form-control"
              rows={4}
              value={form.documentatie.beoogdGebruik}
              onChange={e => setForm(f => ({ ...f, documentatie: { ...f.documentatie, beoogdGebruik: e.target.value } }))}
              placeholder="Beschrijf het beoogde gebruik (markdown ondersteund)"
            />
            <div className="form-text">Markdown wordt ondersteund.</div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Toegevoegde waarde</label>
              <input
                className="form-control"
                value={form.documentatie.toegevoegdeWaarde}
                onChange={e => setForm(f => ({ ...f, documentatie: { ...f.documentatie, toegevoegdeWaarde: e.target.value } }))}
                placeholder="Toegevoegde waarde"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Onderdelen</label>
              <input
                className="form-control"
                value={form.documentatie.onderdelen}
                onChange={e => setForm(f => ({ ...f, documentatie: { ...f.documentatie, onderdelen: e.target.value } }))}
                placeholder="Onderdelen"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Ontwikkeling &amp; beheer</label>
              <input
                className="form-control"
                value={form.documentatie.ontwikkelingEnBeheer}
                onChange={e => setForm(f => ({ ...f, documentatie: { ...f.documentatie, ontwikkelingEnBeheer: e.target.value } }))}
                placeholder="Ontwikkeling en beheer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Bronverwijzingen */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center gap-2 py-2 bg-light">
          <span className="text-primary">&#9670;</span>
          <span className="fw-semibold">Bronverwijzing(en)</span>
        </div>
        <div className="card-body">
          {form.bronverwijzing.map((bron, idx) => (
            <div key={idx} className="border rounded p-3 mb-2 bg-light">
              <div className="row g-2">
                <div className="col-md-3">
                  <label className="form-label small mb-1">Titel</label>
                  <input
                    className="form-control form-control-sm"
                    value={bron.titel}
                    onChange={e => setForm(f => {
                      const arr = [...f.bronverwijzing];
                      arr[idx] = { ...arr[idx], titel: e.target.value };
                      return { ...f, bronverwijzing: arr };
                    })}
                    placeholder="Titel"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small mb-1">Locatie (URL)</label>
                  <input
                    className="form-control form-control-sm"
                    type="url"
                    value={bron.locatie}
                    onChange={e => setForm(f => {
                      const arr = [...f.bronverwijzing];
                      arr[idx] = { ...arr[idx], locatie: e.target.value };
                      return { ...f, bronverwijzing: arr };
                    })}
                    placeholder="https://..."
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small mb-1">Bibliografische verwijzing</label>
                  <input
                    className="form-control form-control-sm"
                    value={bron.verwijzing}
                    onChange={e => setForm(f => {
                      const arr = [...f.bronverwijzing];
                      arr[idx] = { ...arr[idx], verwijzing: e.target.value };
                      return { ...f, bronverwijzing: arr };
                    })}
                    placeholder="Bijv. APA-stijl"
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end justify-content-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setForm(f => {
                      const arr = [...f.bronverwijzing];
                      arr.splice(idx, 1);
                      return { ...f, bronverwijzing: arr.length ? arr : [{ titel: '', locatie: '', verwijzing: '' }] };
                    })}
                  >Verwijder</button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setForm(f => ({ ...f, bronverwijzing: [...f.bronverwijzing, { titel: '', locatie: '', verwijzing: '' }] }))}
          >+ Voeg bronverwijzing toe</button>
        </div>
      </div>

      {/* Action bar */}
      <div className="d-flex align-items-center gap-2 pt-3 border-top">
        <button type="submit" className="btn btn-success px-4" disabled={loading}>
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Bezig...</>
          ) : form.id ? 'Wijzigingen opslaan' : 'Technologie toevoegen'}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setForm(initialState)}
          disabled={loading}
        >Annuleren</button>
      </div>

      {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
      {success && <div className="alert alert-success mt-3 mb-0">{success}</div>}
    </form>
  );
};

export default LegalTechnologyForm;
