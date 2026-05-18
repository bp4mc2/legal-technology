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
    <div className="lt-panel-shell lt-enum-panel">
      <h3 className="lt-enum-title lt-enum-title--amber">Kleurenlegenda</h3>
      {loading && <p>Laden...</p>}
      {error && <p className="text-danger mb-0">{error}</p>}
      {!loading && enums.length > 0 && (
        <ul className="lt-enum-list">
          {enums.map(enumGroup => (
            <li key={enumGroup.name} className="lt-enum-item">
              <div className="lt-enum-item-head">
                <strong>{enumGroup.name}</strong>
              </div>
              <div className="lt-enum-chip-row">
                {enumGroup.values.map(val => (
                  <span
                    key={val}
                    className="lt-enum-chip lt-enum-chip--legend"
                    style={{ ['--lt-enum-chip-bg' as any]: colorMap[val] || '#eee' }}
                  >
                    {val}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ColorLegend;
