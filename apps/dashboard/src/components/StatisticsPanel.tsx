import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

type Stats = {
  count: number;
  by_subtype?: {
    Methode?: number;
    Standaard?: number;
    Tool?: number;
  };
  newly_added?: Array<{
    id: string;
    naam: string;
    versiedatum?: string;
  }>;
  last_edited?: Array<{
    id: string;
    naam: string;
    bijgewerkt_op?: string;
  }>;
};

const StatisticsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Stats>('/api/legaltechnologies/stats')
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3 style={{ color: '#00897b', fontWeight: 600, margin: 0 }}>Statistieken</h3>
      {loading && <p>Laden...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {stats && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            <li><strong>Totaal aantal technologieën:</strong> {stats.count}</li>
            <li><strong>Methode:</strong> {stats.by_subtype?.Methode ?? 0}</li>
            <li><strong>Standaard:</strong> {stats.by_subtype?.Standaard ?? 0}</li>
            <li><strong>Tool:</strong> {stats.by_subtype?.Tool ?? 0}</li>
          </ul>

          <div>
            <strong>Nieuw toegevoegd</strong>
            <ul style={{ margin: '0.5rem 0 0 1rem' }}>
              {(stats.newly_added || []).map(item => (
                <li key={item.id}>{item.naam} {item.versiedatum ? `(${item.versiedatum})` : ''}</li>
              ))}
              {(!stats.newly_added || stats.newly_added.length === 0) && <li>Geen gegevens</li>}
            </ul>
          </div>

          <div>
            <strong>Laatst bewerkt</strong>
            <ul style={{ margin: '0.5rem 0 0 1rem' }}>
              {(stats.last_edited || []).map(item => (
                <li key={item.id}>{item.naam} {item.bijgewerkt_op ? `(${item.bijgewerkt_op})` : ''}</li>
              ))}
              {(!stats.last_edited || stats.last_edited.length === 0) && <li>Geen gegevens</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
