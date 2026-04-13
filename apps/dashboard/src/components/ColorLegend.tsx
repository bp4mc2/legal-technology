import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const colorMap: Record<string, string> = {
  'In gebruik': '#43a047',
  'Niet in gebruik': '#e53935',
  'Volledig open': '#1976d2',
  'Proprietary': '#fbc02d',
  'Documentautomatisering': '#8e24aa',
  'Geautomatiseerd beslissen': '#3949ab',
  'Compliance ondersteuning': '#00897b',
  'Normstatus: concept': '#ffb300',
  'Normstatus: vastgesteld': '#388e3c',
  'Technologietype: platform': '#6d4c41',
  'Technologietype: tool': '#039be5',
  // Add more mappings as needed for new ontology values
};

type Enumeration = {
  name: string;
  values: string[];
};

const ColorLegend: React.FC = () => {
  const [enums, setEnums] = useState<Enumeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Enumeration[]>('/api/legaltechnologies/enumerations')
      .then(data => {
        // Ensure all expected enums are present
        const expectedEnums = [
          "Functionaliteiten", "Technologietypen", "Taaktypen", "Normstatussen", "Gebruiksstatussen", "Licentievormen", "Gebruikersgroepen"
        ];
        const enumsMap: Record<string, string[]> = {};
        data.forEach(e => { enumsMap[e.name] = e.values; });
        const result: Enumeration[] = expectedEnums.map(name => ({ name, values: enumsMap[name] || [] }));
        // Add any extra enums
        data.forEach(e => {
          if (!expectedEnums.includes(e.name)) result.push(e);
        });
        setEnums(result);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3 style={{ color: '#f9a825', fontWeight: 600, margin: 0 }}>Kleurenlegenda</h3>
      {loading && <p>Laden...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && enums.length > 0 && (
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {enums.map(enumGroup => (
            <li key={enumGroup.name} style={{ marginBottom: 8 }}>
              <strong>{enumGroup.name}:</strong>
              <span style={{ marginLeft: 8 }}>
                {enumGroup.values.map(val => (
                  <span
                    key={val}
                    style={{
                      display: 'inline-block',
                      background: colorMap[val] || '#eee',
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
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ColorLegend;
