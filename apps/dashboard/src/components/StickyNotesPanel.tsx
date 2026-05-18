import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';

type TechRef = {
  uri: string;
  name: string;
};

type TechSuggestion = {
  uri: string;
  name: string;
};

type StickyNote = {
  uri: string;
  noteId: string;
  text: string;
  statusIri: string;
  status: string;
  section: string;
  color: string;
  omschrijvingAfhandeling: string;
  board: { uri: string; name: string };
  taaktype: { uri: string; name: string };
  linkedTechnology: TechRef;
  candidateTechnologies: TechRef[];
};

type EnumerationValue = string | { label?: string; iri?: string; value?: string };

type EnumerationResponse = {
  name: string;
  values: EnumerationValue[];
};

const STATUS_COLORS: Record<string, string> = {
  Opgenomen: '#16a34a',
  'Geen Juridische Technologie': '#6b7280',
  Uitzoeken: '#d97706',
  'Nader Te Bepalen': '#2563eb',
};

const statusChipStyle = (status: string): React.CSSProperties => ({
  ['--lt-sticky-status-bg' as any]: STATUS_COLORS[status] || '#6b7280',
});

const noteColorStyle = (color?: string): React.CSSProperties => ({
  ['--lt-sticky-note-bg' as any]: color || '#fde68a',
});


const StickyNotesPanel: React.FC = () => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allStatuses, setAllStatuses] = useState<{ label: string; iri: string }[]>([]);
  const [allStatusIriByLabel, setAllStatusIriByLabel] = useState<Record<string, string>>({});

  const [search, setSearch] = useState('');
  const [boardFilter, setBoardFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [linkFilter, setLinkFilter] = useState<'all' | 'linked' | 'candidates' | 'unlinked'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'whiteboard'>('table');

  const [selectedNote, setSelectedNote] = useState<StickyNote | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [definitiveTechDraft, setDefinitiveTechDraft] = useState('');
  const [definitiveTechNameDraft, setDefinitiveTechNameDraft] = useState('');
  const [omschrijvingDraft, setOmschrijvingDraft] = useState('');
  const [draggedNote, setDraggedNote] = useState<StickyNote | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [techSuggestions, setTechSuggestions] = useState<TechSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Ophalen van alle mogelijke statussen uit enumeratie endpoint
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const data = await apiFetch<EnumerationResponse>(
          '/api/legaltechnologies/enumerations/StickyNoteStatussen'
        );
        const normalized = (data.values || []).reduce<{ label: string; iri: string }[]>((acc, item) => {
          if (typeof item === 'string') {
            acc.push({ label: item, iri: '' });
            return acc;
          }

          const label = (item.label || item.value || '').trim();
          if (!label) {
            return acc;
          }

          acc.push({ label, iri: (item.iri || '').trim() });
          return acc;
        }, []);

        setAllStatuses(normalized);
        const mapping: Record<string, string> = {};
        normalized.forEach((s) => {
          if (s.iri) {
            mapping[s.label] = s.iri;
          }
        });
        setAllStatusIriByLabel(mapping);
      } catch (e) {
        console.warn('Kon StickyNoteStatussen niet ophalen via enumerations endpoint', e);
        // fallback: geen statussen
        setAllStatuses([]);
        setAllStatusIriByLabel({});
      }
    };
    fetchStatuses();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<StickyNote[]>('/api/stickynotes');
        setNotes(data);
      } catch (e: any) {
        setError(e?.message || 'Kon sticky notes niet ophalen');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const boards = useMemo(
    () => Array.from(new Set(notes.map((n) => n.board.name).filter(Boolean))).sort(),
    [notes],
  );


  // Toon altijd alle statussen uit enumeratie, niet alleen uit sticky notes
  const statuses = useMemo(
    () => allStatuses.map((s) => s.label),
    [allStatuses]
  );


  // Gebruik mapping uit enumeratie endpoint, met fallback op reeds geladen notes
  const statusIriByLabel = useMemo(() => {
    const mapping: Record<string, string> = { ...allStatusIriByLabel };
    notes.forEach((note) => {
      if (note.status && note.statusIri && !mapping[note.status]) {
        mapping[note.status] = note.statusIri;
      }
    });
    return mapping;
  }, [allStatusIriByLabel, notes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return notes.filter((note) => {
      if (boardFilter !== 'all' && note.board.name !== boardFilter) {
        return false;
      }

      if (statusFilter !== 'all' && note.status !== statusFilter) {
        return false;
      }

      const linked = Boolean(note.linkedTechnology?.uri);
      const hasCandidates = note.candidateTechnologies.length > 0;

      if (linkFilter === 'linked' && !linked) {
        return false;
      }
      if (linkFilter === 'candidates' && !hasCandidates) {
        return false;
      }
      if (linkFilter === 'unlinked' && (linked || hasCandidates)) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack = [
        note.text,
        note.section,
        note.status,
        note.board.name,
        note.taaktype?.name || '',
        note.linkedTechnology?.name || '',
        ...note.candidateTechnologies.map((c) => c.name || c.uri),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [notes, search, boardFilter, statusFilter, linkFilter]);

  const summary = useMemo(() => {
    const linkedCount = filtered.filter((n) => Boolean(n.linkedTechnology?.uri)).length;
    const candidateCount = filtered.filter((n) => n.candidateTechnologies.length > 0).length;
    const unresolvedCount = filtered.filter(
      (n) => !n.linkedTechnology?.uri && n.candidateTechnologies.length === 0,
    ).length;

    return {
      total: filtered.length,
      linkedCount,
      candidateCount,
      unresolvedCount,
    };
  }, [filtered]);

  const applyUpdatedNote = (updated: StickyNote) => {
    setNotes((prev) => prev.map((note) => (note.uri === updated.uri ? updated : note)));
    setSelectedNote(updated);
    setStatusDraft(updated.statusIri || '');
    setDefinitiveTechDraft(updated.linkedTechnology?.uri || '');
    setDefinitiveTechNameDraft(updated.linkedTechnology?.name || '');
    setOmschrijvingDraft(updated.omschrijvingAfhandeling || '');
  };

  const openDrawer = (note: StickyNote) => {
    setSelectedNote(note);
    setStatusDraft(note.statusIri || '');
    setDefinitiveTechDraft(note.linkedTechnology?.uri || '');
    setDefinitiveTechNameDraft(note.linkedTechnology?.name || '');
    setOmschrijvingDraft(note.omschrijvingAfhandeling || '');
    setTechSuggestions([]);
    setActionError(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedNote(null);
    setActionError(null);
    setTechSuggestions([]);
  };

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const query = definitiveTechNameDraft.trim();
    if (query.length < 2) {
      setTechSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const data = await apiFetch<TechSuggestion[]>(
          `/api/stickynotes/tech-suggestions?q=${encodeURIComponent(query)}&limit=12`,
        );
        setTechSuggestions(data);
      } catch {
        setTechSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [definitiveTechNameDraft, drawerOpen]);

  const whiteboardGroups = useMemo(() => {
    const boardMap = new Map<string, Map<string, { uri: string; notes: StickyNote[] }>>();
    filtered.forEach((note) => {
      const boardName = note.board.name || 'Onbekende groep';
      const taaktypeName = note.taaktype?.name || note.section || 'Onbekend taaktype';
      const taaktypeUri = note.taaktype?.uri || '';
      if (!boardMap.has(boardName)) {
        boardMap.set(boardName, new Map());
      }
      const colMap = boardMap.get(boardName)!;
      if (!colMap.has(taaktypeName)) {
        colMap.set(taaktypeName, { uri: taaktypeUri, notes: [] });
      }
      colMap.get(taaktypeName)!.notes.push(note);
    });

    return Array.from(boardMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([boardName, columns]) => ({
        boardName,
        columns: Array.from(columns.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([taaktypeName, { uri, notes }]) => ({ taaktypeName, taaktypeUri: uri, notes })),
      }));
  }, [filtered]);

  const patchReview = async (payload: {
    statusIri?: string;
    definitiveTechnologyUri?: string;
    moveCandidateToDefinitiveUri?: string;
    omschrijvingAfhandeling?: string;
    taaktypeIri?: string;
  }) => {
    if (!selectedNote) {
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const updated = await apiFetch<StickyNote>('/api/stickynotes/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteUri: selectedNote.uri, ...payload }),
      });
      applyUpdatedNote(updated);
    } catch (e: any) {
      setActionError(e?.message || 'Kon review-actie niet uitvoeren');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Sticky notes laden...</div>;
  }

  if (error) {
    return <div className="lt-sticky-error">{error}</div>;
  }

  return (
    <div className="lt-panel-shell lt-sticky-shell">
      <div className="lt-sticky-summary-grid">
        <div className="lt-sticky-summary-card">
          <div className="lt-sticky-summary-label">Totaal</div>
          <div className="lt-sticky-summary-value">{summary.total}</div>
        </div>
        <div className="lt-sticky-summary-card">
          <div className="lt-sticky-summary-label">Gekoppeld</div>
          <div className="lt-sticky-summary-value">{summary.linkedCount}</div>
        </div>
        <div className="lt-sticky-summary-card">
          <div className="lt-sticky-summary-label">Kandidaten</div>
          <div className="lt-sticky-summary-value">{summary.candidateCount}</div>
        </div>
        <div className="lt-sticky-summary-card">
          <div className="lt-sticky-summary-label">Nog open</div>
          <div className="lt-sticky-summary-value">{summary.unresolvedCount}</div>
        </div>
      </div>

      <div className="lt-sticky-filters">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op tekst, sectie, status, technologie..."
          className="form-control form-control-sm"
        />

        <select
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value)}
          className="form-select form-select-sm"
        >
          <option value="all">Alle boards</option>
          {boards.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select form-select-sm"
        >
          <option value="all">Alle statussen</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={linkFilter}
          onChange={(e) => setLinkFilter(e.target.value as 'all' | 'linked' | 'candidates' | 'unlinked')}
          className="form-select form-select-sm"
        >
          <option value="all">Alle koppelingen</option>
          <option value="linked">Definitief gekoppeld</option>
          <option value="candidates">Met kandidaten</option>
          <option value="unlinked">Zonder link</option>
        </select>
      </div>

      <div className="lt-sticky-view-toggle">
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
        >
          Tabel
        </button>
        <button
          type="button"
          onClick={() => setViewMode('whiteboard')}
          className={`btn btn-sm ${viewMode === 'whiteboard' ? 'btn-primary' : 'btn-outline-primary'}`}
        >
          Whiteboard
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="lt-sticky-table-wrap">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                <th className="lt-sticky-cell">Sticky</th>
                <th className="lt-sticky-cell">Board / Sectie</th>
                <th className="lt-sticky-cell">Status</th>
                <th className="lt-sticky-cell">Koppeling</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((note) => (
                <tr
                  key={note.uri}
                  className="lt-sticky-click-row"
                  onClick={() => openDrawer(note)}
                  title="Klik voor detail en review"
                >
                  <td className="lt-sticky-cell lt-sticky-cell--text">
                    <div className="lt-sticky-note-line">
                      <span title={note.color || 'geen kleur'} className="lt-sticky-dot" style={noteColorStyle(note.color)} />
                      <div className="lt-sticky-note-text">{note.text}</div>
                    </div>
                  </td>
                  <td className="lt-sticky-cell lt-sticky-cell--board">
                    <div>{note.board.name}</div>
                    <div className="lt-sticky-subtle">{note.section || 'onbekend'}</div>
                  </td>
                  <td className="lt-sticky-cell lt-sticky-cell--status">
                    <span className="lt-sticky-status-chip" style={statusChipStyle(note.status)}>{note.status}</span>
                  </td>
                  <td className="lt-sticky-cell lt-sticky-cell--link">
                    {note.linkedTechnology?.uri ? (
                      <div>
                        <div className="lt-sticky-strong">Definitief</div>
                        <div className="lt-sticky-subtle">
                          {note.linkedTechnology.name || note.linkedTechnology.uri}
                        </div>
                      </div>
                    ) : note.candidateTechnologies.length > 0 ? (
                      <div>
                        <div className="lt-sticky-strong">Kandidaten</div>
                        <div className="lt-sticky-subtle">{note.candidateTechnologies.length}</div>
                      </div>
                    ) : (
                      <span className="lt-sticky-empty">Geen koppeling</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="lt-sticky-whiteboard">
          {whiteboardGroups.map((group) => (
            <section key={group.boardName} className="lt-sticky-board">
              <h4 className="lt-sticky-board-title">{group.boardName}</h4>
              <div className="lt-sticky-board-columns">
                {group.columns.map((column) => {
                  const dropKey = `${group.boardName}||${column.taaktypeUri}`;
                  const isOver = dragOverKey === dropKey;
                  return (
                  <div
                    key={`${group.boardName}-${column.taaktypeName}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverKey(dropKey); }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverKey(null);
                      }
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOverKey(null);
                      if (!draggedNote || draggedNote.taaktype?.uri === column.taaktypeUri) return;
                      const moving = draggedNote;
                      // optimistic update
                      setNotes((prev) =>
                        prev.map((n) =>
                          n.uri === moving.uri
                            ? { ...n, taaktype: { uri: column.taaktypeUri, name: column.taaktypeName } }
                            : n,
                        ),
                      );
                      try {
                        const updated = await apiFetch<StickyNote>('/api/stickynotes/review', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ noteUri: moving.uri, taaktypeIri: column.taaktypeUri }),
                        });
                        setNotes((prev) => prev.map((n) => (n.uri === updated.uri ? updated : n)));
                      } catch {
                        // rollback
                        setNotes((prev) => prev.map((n) => (n.uri === moving.uri ? moving : n)));
                      }
                    }}
                    className={`lt-sticky-column-dropzone${isOver ? ' is-over' : ''}`}
                  >
                    <div className="lt-sticky-column-title">{column.taaktypeName}</div>
                    <div className="lt-sticky-column-list">
                      {column.notes.map((note) => (
                        <button
                          type="button"
                          key={note.uri}
                          draggable
                          onDragStart={(e) => {
                            setDraggedNote(note);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => setDraggedNote(null)}
                          onClick={() => openDrawer(note)}
                          className="lt-sticky-card"
                          style={noteColorStyle(note.color)}
                          title="Klik voor detail en review"
                        >
                          <div className="lt-sticky-card-head">
                            <span className="lt-sticky-card-label">{note.section || 'onbekende sectie'}</span>
                            <span className="lt-sticky-status-chip" style={statusChipStyle(note.status)}>{note.status}</span>
                          </div>
                          <div className="lt-sticky-card-text">{note.text}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {drawerOpen && selectedNote && (
        <>
          <div onClick={closeDrawer} className="lt-sticky-overlay" />
          <aside className="lt-sticky-drawer">
            <div className="lt-sticky-drawer-head">
              <div>
                <div className="lt-sticky-drawer-title">Sticky details</div>
                <div className="lt-sticky-drawer-subtitle">
                  {selectedNote.board.name} / {selectedNote.section || 'onbekende sectie'}
                </div>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeDrawer}>
                Sluiten
              </button>
            </div>

            <div className="lt-sticky-drawer-body">
              <div className="lt-sticky-color-panel" style={noteColorStyle(selectedNote.color)}>
                <div className="lt-sticky-linked-block">
                  <span className="lt-sticky-status-chip" style={statusChipStyle(selectedNote.status)}>{selectedNote.status}</span>
                </div>
                <div className="lt-sticky-note-text">{selectedNote.text}</div>
              </div>

              <section className="lt-sticky-panel">
                <div className="lt-sticky-panel-title">Review workflow</div>

                <label className="lt-sticky-form-group">
                  <span className="lt-sticky-form-label">Mark status</span>
                  <div className="lt-sticky-form-row">
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      className="form-select form-select-sm"
                      disabled={saving}
                    >
                      <option value="">Kies status</option>
                      {statuses.map((status) => (
                        <option key={status} value={statusIriByLabel[status] || ''}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={saving || !statusDraft}
                      onClick={() => patchReview({ statusIri: statusDraft })}
                    >
                      Opslaan
                    </button>
                  </div>
                </label>

                <label className="lt-sticky-form-group">
                  <span className="lt-sticky-form-label">Set definitive technology (autocomplete op naam)</span>
                  <div className="lt-sticky-panel">
                    <input
                      value={definitiveTechNameDraft}
                      onChange={(e) => {
                        setDefinitiveTechNameDraft(e.target.value);
                        setDefinitiveTechDraft('');
                      }}
                      className="form-control form-control-sm"
                      placeholder="Typ 2+ letters van technologie naam"
                      disabled={saving}
                    />
                    {loadingSuggestions ? (
                      <div className="lt-sticky-loading-text">Zoeken...</div>
                    ) : techSuggestions.length > 0 ? (
                      <div className="lt-sticky-suggestions">
                        {techSuggestions.map((suggestion) => (
                          <button
                            type="button"
                            key={suggestion.uri}
                            onClick={() => {
                              setDefinitiveTechDraft(suggestion.uri);
                              setDefinitiveTechNameDraft(suggestion.name || suggestion.uri);
                              setTechSuggestions([]);
                            }}
                            className="lt-sticky-suggestion"
                          >
                            <div className="lt-sticky-suggestion-name">{suggestion.name}</div>
                            <div className="lt-sticky-suggestion-uri">
                              {suggestion.uri}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div className="lt-sticky-form-row">
                      <input
                        value={definitiveTechDraft}
                        onChange={(e) => setDefinitiveTechDraft(e.target.value)}
                        className="form-control form-control-sm"
                        placeholder="Geselecteerde URI (of handmatig invullen)"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={saving || !definitiveTechDraft.trim()}
                        onClick={() =>
                          patchReview({ definitiveTechnologyUri: definitiveTechDraft.trim() })
                        }
                      >
                        Opslaan
                      </button>
                    </div>
                  </div>
                </label>

                {selectedNote.candidateTechnologies.length > 0 && (
                  <div className="lt-sticky-candidates">
                    <div className="lt-sticky-candidate-title">
                      Move candidate to definitive
                    </div>
                    <div className="lt-sticky-candidate-list">
                      {selectedNote.candidateTechnologies.map((candidate) => (
                        <div key={`${selectedNote.uri}-${candidate.uri}`} className="lt-sticky-candidate-card">
                          <div className="lt-sticky-strong">
                            {candidate.name || 'Kandidaat'}
                          </div>
                          <div className="lt-sticky-uri">{candidate.uri}</div>
                          <div className="lt-sticky-candidate-actions">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              disabled={saving}
                              onClick={() =>
                                patchReview({
                                  moveCandidateToDefinitiveUri: candidate.uri,
                                })
                              }
                            >
                              Maak definitief
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {actionError && (
                  <div className="lt-sticky-action-error">
                    {actionError}
                  </div>
                )}
              </section>

              <section className="lt-sticky-panel">
                <div className="lt-sticky-panel-title">Omschrijving afhandeling</div>
                <div className="lt-sticky-panel">
                  <textarea
                    value={omschrijvingDraft}
                    onChange={(e) => setOmschrijvingDraft(e.target.value)}
                    className="form-control form-control-sm"
                    rows={4}
                    placeholder="Beschrijf hoe deze sticky note is afgehandeld..."
                    disabled={saving}
                  />
                  <div className="lt-sticky-actions-right">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={saving}
                      onClick={() => patchReview({ omschrijvingAfhandeling: omschrijvingDraft })}
                    >
                      Opslaan
                    </button>
                  </div>
                </div>
              </section>

              <section className="lt-sticky-panel">
                <div className="lt-sticky-panel-title">Koppelingen</div>
                <div className="lt-sticky-linked-block">
                  <div className="lt-sticky-linked-label">Definitief</div>
                  {selectedNote.linkedTechnology?.uri ? (
                    <div>
                      <div className="lt-sticky-strong">{selectedNote.linkedTechnology.name || '-'}</div>
                      <div className="lt-sticky-uri">
                        {selectedNote.linkedTechnology.uri}
                      </div>
                    </div>
                  ) : (
                    <div className="lt-sticky-empty">Geen definitieve koppeling</div>
                  )}
                </div>

                <div>
                  <div className="lt-sticky-linked-label">
                    Kandidaten (URI)
                  </div>
                  {selectedNote.candidateTechnologies.length > 0 ? (
                    <ul className="lt-sticky-linked-list">
                      {selectedNote.candidateTechnologies.map((candidate) => (
                        <li key={`${selectedNote.uri}-candidate-${candidate.uri}`}>
                          <div className="lt-sticky-strong">{candidate.name || 'Kandidaat'}</div>
                          <div className="lt-sticky-uri">{candidate.uri}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="lt-sticky-empty">Geen kandidaten</div>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default StickyNotesPanel;
