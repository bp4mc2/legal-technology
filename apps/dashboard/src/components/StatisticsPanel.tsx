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

const subtypeStyles: Record<string, { badge: string; bar: string }> = {
  Methode: { badge: 'bg-info-subtle text-info-emphasis', bar: 'bg-info' },
  Standaard: { badge: 'bg-warning-subtle text-warning-emphasis', bar: 'bg-warning' },
  Tool: { badge: 'bg-success-subtle text-success-emphasis', bar: 'bg-success' },
};

const subtypeChartColors: Record<string, string> = {
  Methode: '#0dcaf0',
  Standaard: '#ffc107',
  Tool: '#198754',
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

  const subtypeItems = [
    { key: 'Methode', value: stats?.by_subtype?.Methode ?? 0 },
    { key: 'Standaard', value: stats?.by_subtype?.Standaard ?? 0 },
    { key: 'Tool', value: stats?.by_subtype?.Tool ?? 0 },
  ];

  const subtypeWithPercentage = subtypeItems.map(item => ({
    ...item,
    percentage: stats && stats.count > 0 ? Math.round((item.value / stats.count) * 100) : 0,
  }));

  const donutGradient = (() => {
    if (!stats || stats.count <= 0) return '#e9ecef';
    let start = 0;
    const segments = subtypeWithPercentage
      .filter(item => item.percentage > 0)
      .map(item => {
        const end = Math.min(start + item.percentage, 100);
        const color = subtypeChartColors[item.key] ?? '#6c757d';
        const segment = `${color} ${start}% ${end}%`;
        start = end;
        return segment;
      });
    return segments.length ? `conic-gradient(${segments.join(', ')})` : '#e9ecef';
  })();

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3 className="mb-1 fw-semibold text-primary">Statistieken</h3>
          <div className="text-muted small">Actueel overzicht van juridische technologieën</div>
        </div>
        <div className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2">
          Dashboard
        </div>
      </div>

      {loading && (
        <div className="text-center py-4 text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Laden...
        </div>
      )}

      {error && <div className="alert alert-danger mb-0">{error}</div>}

      {stats && (
        <div className="d-grid gap-3">
          <div className="row g-3">
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100 bg-primary text-white">
                <div className="card-body">
                  <div className="text-uppercase small opacity-75 mb-2">Totaal</div>
                  <div className="display-5 fw-bold lh-1">{stats.count}</div>
                  <div className="small mt-2 opacity-75">Juridische technologieën geregistreerd</div>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pb-0">
                  <div className="fw-semibold text-primary">Verdeling naar subtype</div>
                </div>
                <div className="card-body">
                  <div className="row g-3 align-items-center">
                    <div className="col-md-4">
                      <div className="position-relative mx-auto" style={{ width: 148, height: 148 }}>
                        <div
                          className="w-100 h-100 rounded-circle"
                          style={{ background: donutGradient }}
                          aria-label="Subtype verdeling"
                        />
                        <div
                          className="position-absolute top-50 start-50 translate-middle rounded-circle bg-white border d-flex flex-column align-items-center justify-content-center"
                          style={{ width: 88, height: 88 }}
                        >
                          <div className="fw-bold fs-5 lh-1">{stats.count}</div>
                          <div className="text-muted small">Totaal</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-8 d-grid gap-3">
                      {subtypeWithPercentage.map(item => {
                        const percentage = item.percentage;
                        const style = subtypeStyles[item.key] ?? { badge: 'bg-secondary-subtle text-secondary-emphasis', bar: 'bg-secondary' };
                        return (
                          <div key={item.key}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className={`badge ${style.badge}`}>{item.key}</span>
                              <span className="small text-muted">{item.value} ({percentage}%)</span>
                            </div>
                            <div className="progress" style={{ height: 10 }}>
                              <div
                                className={`progress-bar ${style.bar}`}
                                role="progressbar"
                                style={{ width: `${percentage}%` }}
                                aria-valuenow={percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {subtypeWithPercentage.map(item => (
                      <span key={`legend-${item.key}`} className="badge rounded-pill bg-light text-dark border">
                        <span
                          className="d-inline-block rounded-circle me-1"
                          style={{ width: 8, height: 8, background: subtypeChartColors[item.key] ?? '#6c757d' }}
                        />
                        {item.key}: {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0">
                  <div className="fw-semibold text-primary">Nieuw toegevoegd</div>
                </div>
                <div className="card-body">
                  {(stats.newly_added || []).length > 0 ? (
                    <div className="list-group list-group-flush">
                      {(stats.newly_added || []).map(item => (
                        <div key={item.id} className="list-group-item px-0 d-flex justify-content-between align-items-start border-top-0">
                          <div>
                            <div className="fw-semibold">{item.naam}</div>
                            <div className="small text-muted">{item.id}</div>
                          </div>
                          <span className="badge bg-light text-dark border">{item.versiedatum || 'Onbekend'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small">Geen gegevens</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0">
                  <div className="fw-semibold text-primary">Laatst bewerkt</div>
                </div>
                <div className="card-body">
                  {(stats.last_edited || []).length > 0 ? (
                    <div className="list-group list-group-flush">
                      {(stats.last_edited || []).map(item => (
                        <div key={item.id} className="list-group-item px-0 d-flex justify-content-between align-items-start border-top-0">
                          <div>
                            <div className="fw-semibold">{item.naam}</div>
                            <div className="small text-muted">{item.id}</div>
                          </div>
                          <span className="badge bg-light text-dark border">{item.bijgewerkt_op || 'Onbekend'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small">Geen gegevens</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
