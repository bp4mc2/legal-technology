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

type StickyNoteStatsItem = {
  status: string;
  board?: {
    name?: string;
  };
  linkedTechnology: {
    uri: string;
    name: string;
  };
  candidateTechnologies: Array<{
    uri: string;
    name: string;
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

const stickyStatusStyles: Record<string, string> = {
  Opgenomen: 'bg-success-subtle text-success-emphasis',
  'Geen Juridische Technologie': 'bg-secondary-subtle text-secondary-emphasis',
  Uitzoeken: 'bg-warning-subtle text-warning-emphasis',
  'Nader Te Bepalen': 'bg-primary-subtle text-primary-emphasis',
};

const StatisticsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteStatsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Stats>('/api/legaltechnologies/stats'),
      apiFetch<StickyNoteStatsItem[]>('/api/stickynotes'),
    ])
      .then(([statsResult, stickyNotesResult]) => {
        setStats(statsResult);
        setStickyNotes(stickyNotesResult);
      })
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

  const stickyNotesCount = stickyNotes.length;
  const linkedCount = stickyNotes.filter(n => Boolean(n.linkedTechnology?.uri)).length;
  const withCandidatesCount = stickyNotes.filter(
    n => !n.linkedTechnology?.uri && (n.candidateTechnologies?.length ?? 0) > 0
  ).length;
  const unresolvedCount = stickyNotesCount - linkedCount - withCandidatesCount;

  const linkedPercentage =
    stickyNotesCount > 0 ? Math.round((linkedCount / stickyNotesCount) * 100) : 0;
  const withCandidatesPercentage =
    stickyNotesCount > 0 ? Math.round((withCandidatesCount / stickyNotesCount) * 100) : 0;
  const unresolvedPercentage =
    stickyNotesCount > 0 ? Math.round((unresolvedCount / stickyNotesCount) * 100) : 0;

  const stickyStatusCounts = stickyNotes.reduce<Record<string, number>>((acc, note) => {
    const key = note.status || 'Onbekend';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const stickyStatusItems = Object.entries(stickyStatusCounts)
    .map(([key, value]) => ({
      key,
      value,
      percentage: stickyNotesCount > 0 ? Math.round((value / stickyNotesCount) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const boardTrendItems = Object.entries(
    stickyNotes.reduce<Record<string, { total: number; linked: number; withCandidates: number }>>(
      (acc, note) => {
        const boardName = note.board?.name?.trim() || 'Onbekend board';
        if (!acc[boardName]) {
          acc[boardName] = { total: 0, linked: 0, withCandidates: 0 };
        }
        acc[boardName].total += 1;

        if (note.linkedTechnology?.uri) {
          acc[boardName].linked += 1;
        } else if ((note.candidateTechnologies?.length ?? 0) > 0) {
          acc[boardName].withCandidates += 1;
        }
        return acc;
      },
      {}
    )
  )
    .map(([board, value]) => {
      const linkedPct = value.total > 0 ? Math.round((value.linked / value.total) * 100) : 0;
      const withCandidatesPct =
        value.total > 0 ? Math.round((value.withCandidates / value.total) * 100) : 0;
      return {
        board,
        total: value.total,
        linked: value.linked,
        withCandidates: value.withCandidates,
        linkedPct,
        withCandidatesPct,
      };
    })
    .sort((a, b) => b.linkedPct - a.linkedPct);

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
          <section className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h4 className="mb-0 fw-semibold text-primary">Juridische technologieën</h4>
            </div>
            <div className="card-body d-grid gap-3">
              <div className="row g-3">
                <div className="col-lg-4">
                  <div className="card border-0 h-100 bg-primary text-white">
                    <div className="card-body">
                      <div className="text-uppercase small opacity-75 mb-2">Totaal</div>
                      <div className="display-5 fw-bold lh-1">{stats.count}</div>
                      <div className="small mt-2 opacity-75">Juridische technologieën geregistreerd</div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-8">
                  <div className="card border h-100">
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
                  <div className="card border h-100">
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
                  <div className="card border h-100">
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
          </section>

          <section className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h4 className="mb-0 fw-semibold text-success">Sticky notes en whiteboards</h4>
            </div>
            <div className="card-body d-grid gap-3">
              <div className="row g-3">
                <div className="col-lg-6">
                  <div className="card border h-100 bg-success text-white">
                    <div className="card-body">
                      <div className="text-uppercase small opacity-75 mb-2">Sticky Notes</div>
                      <div className="display-5 fw-bold lh-1">{stickyNotesCount}</div>
                      <div className="small mt-2 opacity-75">Notities op alle whiteboards</div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="card border h-100 bg-dark text-white">
                    <div className="card-body">
                      <div className="text-uppercase small opacity-75 mb-2">Gekoppeld</div>
                      <div className="display-5 fw-bold lh-1">{linkedPercentage}%</div>
                      <div className="small mt-2 opacity-75">{linkedCount} van {stickyNotesCount} notities gekoppeld</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-lg-5">
                  <div className="card border h-100">
                    <div className="card-header bg-white border-0">
                      <div className="fw-semibold text-primary">Koppelstatus</div>
                    </div>
                    <div className="card-body d-grid gap-3">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge bg-success-subtle text-success-emphasis">Definitief gekoppeld</span>
                          <span className="small text-muted">{linkedCount} ({linkedPercentage}%)</span>
                        </div>
                        <div className="progress" style={{ height: 10 }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${linkedPercentage}%` }}
                            aria-valuenow={linkedPercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge bg-warning-subtle text-warning-emphasis">Met kandidaten</span>
                          <span className="small text-muted">{withCandidatesCount} ({withCandidatesPercentage}%)</span>
                        </div>
                        <div className="progress" style={{ height: 10 }}>
                          <div
                            className="progress-bar bg-warning"
                            role="progressbar"
                            style={{ width: `${withCandidatesPercentage}%` }}
                            aria-valuenow={withCandidatesPercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge bg-secondary-subtle text-secondary-emphasis">Nog niet gekoppeld</span>
                          <span className="small text-muted">{unresolvedCount} ({unresolvedPercentage}%)</span>
                        </div>
                        <div className="progress" style={{ height: 10 }}>
                          <div
                            className="progress-bar bg-secondary"
                            role="progressbar"
                            style={{ width: `${unresolvedPercentage}%` }}
                            aria-valuenow={unresolvedPercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="card border h-100">
                    <div className="card-header bg-white border-0">
                      <div className="fw-semibold text-primary">Verdeling naar status</div>
                    </div>
                    <div className="card-body d-grid gap-3">
                      {stickyStatusItems.length > 0 ? (
                        stickyStatusItems.map(item => {
                          const style = stickyStatusStyles[item.key] ?? 'bg-light text-dark';
                          return (
                            <div key={item.key}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className={`badge ${style}`}>{item.key}</span>
                                <span className="small text-muted">{item.value} ({item.percentage}%)</span>
                              </div>
                              <div className="progress" style={{ height: 10 }}>
                                <div
                                  className="progress-bar bg-primary"
                                  role="progressbar"
                                  style={{ width: `${item.percentage}%` }}
                                  aria-valuenow={item.percentage}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted small">Geen sticky notes gevonden</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-lg-12">
                  <div className="card border h-100">
                    <div className="card-header bg-white border-0">
                      <div className="fw-semibold text-primary">Trend: voortgang per board</div>
                    </div>
                    <div className="card-body">
                      {boardTrendItems.length > 0 ? (
                        <div className="d-grid gap-3">
                          {boardTrendItems.map(item => (
                            <div key={item.board}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="fw-semibold">{item.board}</div>
                                <div className="small text-muted">
                                  {item.linkedPct}% gekoppeld · {item.withCandidatesPct}% met kandidaten · {item.total} notities
                                </div>
                              </div>
                              <div className="progress" style={{ height: 12 }}>
                                <div
                                  className="progress-bar bg-success"
                                  role="progressbar"
                                  style={{ width: `${item.linkedPct}%` }}
                                  aria-valuenow={item.linkedPct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  title="Definitief gekoppeld"
                                />
                                <div
                                  className="progress-bar bg-warning"
                                  role="progressbar"
                                  style={{ width: `${item.withCandidatesPct}%` }}
                                  aria-valuenow={item.withCandidatesPct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  title="Met kandidaten"
                                />
                              </div>
                            </div>
                          ))}
                          <div className="small text-muted">
                            Groen = definitief gekoppeld, geel = kandidaatfase.
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted small">Geen trendgegevens beschikbaar</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
