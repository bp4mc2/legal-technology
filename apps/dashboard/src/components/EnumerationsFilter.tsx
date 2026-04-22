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
    <div>
      <h3 style={{ color: '#6d4c41', fontWeight: 600, margin: 0 }}>Enumeraties</h3>
      {loading && <p>Laden...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && enums.length > 0 && (
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {enums.map(enumGroup => (
            <li key={enumGroup.name} style={{ marginBottom: 8 }}>
              <strong>{enumGroup.name}:</strong>
              <span style={{ marginLeft: 8, color: '#666', fontSize: '0.9em' }}>
                ({enumGroup.values.length})
              </span>
              <span style={{ marginLeft: 8 }}>
                {enumGroup.values.map(val => (
                  <span
                    key={val}
                    style={{
                      display: 'inline-block',
                      background: '#eee',
                      color: '#222',
                      borderRadius: 4,
                      padding: '2px 8px',
                      marginRight: 6,
                      fontSize: '0.95em',
                    }}
                  >
                    {val}
                  </span>
                ))}
                {enumGroup.values.length === 0 && (
                  <span style={{ color: '#777', fontStyle: 'italic' }}>Geen waarden</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EnumerationsFilter;
