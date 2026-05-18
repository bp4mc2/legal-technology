import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

type Enumeration = {
  name: string;
  values: string[];
};


const expectedEnums = [
  'Functionaliteiten',
  'Technologietypen',
  'Taaktypen',
  'Normstatussen',
  'Gebruiksstatussen',
  'Licentievormen',
  'Gebruikersgroepen',
  'Beschouwingsniveaus',
  'Modelsoorten',
];

const normalizeEnumerations = (data: Enumeration[]): Enumeration[] => {
  const enumsMap: Record<string, string[]> = {};
  data.forEach(e => {
    const uniqueValues = Array.from(new Set((e.values || []).filter(Boolean)));
    enumsMap[e.name] = uniqueValues;
  });

  const result: Enumeration[] = expectedEnums.map(name => ({ name, values: enumsMap[name] || [] }));
  data.forEach(e => {
    if (!expectedEnums.includes(e.name)) {
      result.push({ name: e.name, values: Array.from(new Set((e.values || []).filter(Boolean))) });
    }
  });

  return result;
};

const EnumerationsFilter: React.FC = () => {
  const [enums, setEnums] = useState<Enumeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Enumeration[]>('/api/legaltechnologies/enumerations')
      .then(data => setEnums(normalizeEnumerations(data)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="lt-panel-shell lt-enum-panel">
      <h3 className="lt-enum-title lt-enum-title--brown">Enumeraties</h3>
      {loading && <p>Laden...</p>}
      {error && <p className="text-danger mb-0">{error}</p>}
      {!loading && enums.length > 0 && (
        <ul className="lt-enum-list">
          {enums.map(enumGroup => (
            <li key={enumGroup.name} className="lt-enum-item">
              <div className="lt-enum-item-head">
                <strong>{enumGroup.name}</strong>
                <span className="lt-enum-count">
                ({enumGroup.values.length})
                </span>
              </div>
              <div className="lt-enum-chip-row">
                {enumGroup.values.map(val => (
                  <span key={val} className="lt-enum-chip">{val}</span>
                ))}
                {enumGroup.values.length === 0 && (
                  <span className="lt-enum-empty">Geen waarden</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EnumerationsFilter;
