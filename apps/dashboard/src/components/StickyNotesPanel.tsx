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

const STATUS_COLORS: Record<string, string> = {
  Opgenomen: '#16a34a',
  'Geen Juridische Technologie': '#6b7280',
  Uitzoeken: '#d97706',
  'Nader Te Bepalen': '#2563eb',
};

const statusChipStyle = (status: string): React.CSSProperties => ({
  background: STATUS_COLORS[status] || '#6b7280',
  color: '#fff',
  borderRadius: 999,
  padding: '0.2rem 0.55rem',
  fontSize: '0.78rem',
  fontWeight: 700,
  display: 'inline-block',
});

const StickyNotesPanel: React.FC = () => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const statuses = useMemo(
    () => Array.from(new Set(notes.map((n) => n.status).filter(Boolean))).sort(),
    [notes],
  );

  const statusIriByLabel = useMemo(() => {
    const mapping: Record<string, string> = {};
    notes.forEach((note) => {
      if (note.status && note.statusIri && !mapping[note.status]) {
        mapping[note.status] = note.statusIri;
      }
    });
    return mapping;
  }, [notes]);

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
    return <div style={{ color: '#b00020' }}>{error}</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ background: '#f5f6fa', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Totaal</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{summary.total}</div>
        </div>
        <div style={{ background: '#f5f6fa', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Gekoppeld</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{summary.linkedCount}</div>
        </div>
        <div style={{ background: '#f5f6fa', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Kandidaten</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{summary.candidateCount}</div>
        </div>
        <div style={{ background: '#f5f6fa', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Nog open</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{summary.unresolvedCount}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op tekst, sectie, status, technologie..."
          style={{ padding: '0.5rem 0.6rem', borderRadius: 6, border: '1px solid #c9ced6' }}
        />

        <select
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value)}
          style={{ padding: '0.5rem 0.6rem', borderRadius: 6, border: '1px solid #c9ced6' }}
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
          style={{ padding: '0.5rem 0.6rem', borderRadius: 6, border: '1px solid #c9ced6' }}
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
          style={{ padding: '0.5rem 0.6rem', borderRadius: 6, border: '1px solid #c9ced6' }}
        >
          <option value="all">Alle koppelingen</option>
          <option value="linked">Definitief gekoppeld</option>
          <option value="candidates">Met kandidaten</option>
          <option value="unlinked">Zonder link</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
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
        <div style={{ overflowX: 'auto' }}>
          <table className="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ padding: '0.5rem' }}>Sticky</th>
                <th style={{ padding: '0.5rem' }}>Board / Sectie</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Koppeling</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((note) => (
                <tr
                  key={note.uri}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openDrawer(note)}
                  title="Klik voor detail en review"
                >
                  <td style={{ padding: '0.5rem', minWidth: 420 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span
                        title={note.color || 'geen kleur'}
                        style={{
                          width: 12,
                          height: 12,
                          minWidth: 12,
                          borderRadius: 999,
                          marginTop: 4,
                          background: note.color || '#d1d5db',
                          border: '1px solid #9ca3af',
                          display: 'inline-block',
                        }}
                      />
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{note.text}</div>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem', minWidth: 220 }}>
                    <div>{note.board.name}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.75 }}>{note.section || 'onbekend'}</div>
                  </td>
                  <td style={{ padding: '0.5rem', minWidth: 170 }}>
                    <span style={statusChipStyle(note.status)}>{note.status}</span>
                  </td>
                  <td style={{ padding: '0.5rem', minWidth: 320 }}>
                    {note.linkedTechnology?.uri ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>Definitief</div>
                        <div style={{ fontSize: '0.9rem' }}>
                          {note.linkedTechnology.name || note.linkedTechnology.uri}
                        </div>
                      </div>
                    ) : note.candidateTechnologies.length > 0 ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>Kandidaten</div>
                        <div style={{ fontSize: '0.9rem' }}>{note.candidateTechnologies.length}</div>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.7 }}>Geen koppeling</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {whiteboardGroups.map((group) => (
            <section
              key={group.boardName}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '0.8rem',
                background: '#f8fafc',
              }}
            >
              <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '1rem' }}>{group.boardName}</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(Math.max(group.columns.length, 1), 4)}, minmax(220px, 1fr))`,
                  gap: '0.75rem',
                  alignItems: 'start',
                }}
              >
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
                    style={{
                      borderRadius: 8,
                      padding: '0.35rem',
                      transition: 'background 0.15s',
                      background: isOver ? 'rgba(59,130,246,0.10)' : 'transparent',
                      outline: isOver ? '2px dashed #3b82f6' : '2px dashed transparent',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.83rem',
                        fontWeight: 700,
                        marginBottom: '0.45rem',
                        color: '#334155',
                      }}
                    >
                      {column.taaktypeName}
                    </div>
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
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
                          style={{
                            textAlign: 'left',
                            border: '1px solid rgba(0,0,0,0.15)',
                            borderRadius: 8,
                            background: note.color || '#fde68a',
                            padding: '0.65rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            minHeight: 150,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem',
                            cursor: 'pointer',
                          }}
                          title="Klik voor detail en review"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                              {note.section || 'onbekende sectie'}
                            </span>
                            <span style={statusChipStyle(note.status)}>{note.status}</span>
                          </div>
                          <div
                            style={{
                              whiteSpace: 'pre-wrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 6,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.33,
                            }}
                          >
                            {note.text}
                          </div>
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
          <div
            onClick={closeDrawer}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.26)',
              zIndex: 1100,
            }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              width: 'min(520px, 96vw)',
              background: '#fff',
              zIndex: 1200,
              boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '0.9rem 1rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Sticky details</div>
                <div style={{ fontSize: '0.88rem', opacity: 0.8 }}>
                  {selectedNote.board.name} / {selectedNote.section || 'onbekende sectie'}
                </div>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeDrawer}>
                Sluiten
              </button>
            </div>

            <div style={{ padding: '1rem', overflowY: 'auto', display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  background: selectedNote.color || '#fde68a',
                  border: '1px solid rgba(0,0,0,0.16)',
                  borderRadius: 8,
                  padding: '0.85rem',
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={statusChipStyle(selectedNote.status)}>{selectedNote.status}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{selectedNote.text}</div>
              </div>

              <section>
                <div style={{ fontWeight: 700, marginBottom: '0.45rem' }}>Review workflow</div>

                <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.7rem' }}>
                  <span style={{ fontSize: '0.88rem' }}>Mark status</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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

                <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.7rem' }}>
                  <span style={{ fontSize: '0.88rem' }}>Set definitive technology (autocomplete op naam)</span>
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
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
                      <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>Zoeken...</div>
                    ) : techSuggestions.length > 0 ? (
                      <div
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          maxHeight: 180,
                          overflowY: 'auto',
                          background: '#fff',
                        }}
                      >
                        {techSuggestions.map((suggestion) => (
                          <button
                            type="button"
                            key={suggestion.uri}
                            onClick={() => {
                              setDefinitiveTechDraft(suggestion.uri);
                              setDefinitiveTechNameDraft(suggestion.name || suggestion.uri);
                              setTechSuggestions([]);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 0,
                              borderBottom: '1px solid #f1f5f9',
                              background: '#fff',
                              padding: '0.5rem 0.55rem',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{suggestion.name}</div>
                            <div style={{ fontSize: '0.78rem', opacity: 0.75, wordBreak: 'break-all' }}>
                              {suggestion.uri}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                  <div style={{ marginTop: '0.7rem' }}>
                    <div style={{ fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                      Move candidate to definitive
                    </div>
                    <div style={{ display: 'grid', gap: '0.45rem' }}>
                      {selectedNote.candidateTechnologies.map((candidate) => (
                        <div
                          key={`${selectedNote.uri}-${candidate.uri}`}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: '0.55rem',
                            background: '#fafafa',
                            display: 'grid',
                            gap: '0.25rem',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {candidate.name || 'Kandidaat'}
                          </div>
                          <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{candidate.uri}</div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                  <div style={{ color: '#b00020', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {actionError}
                  </div>
                )}
              </section>

              <section>
                <div style={{ fontWeight: 700, marginBottom: '0.45rem' }}>Omschrijving afhandeling</div>
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  <textarea
                    value={omschrijvingDraft}
                    onChange={(e) => setOmschrijvingDraft(e.target.value)}
                    className="form-control form-control-sm"
                    rows={4}
                    placeholder="Beschrijf hoe deze sticky note is afgehandeld..."
                    disabled={saving}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

              <section>
                <div style={{ fontWeight: 700, marginBottom: '0.45rem' }}>Koppelingen</div>
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.88rem', opacity: 0.8, marginBottom: '0.2rem' }}>Definitief</div>
                  {selectedNote.linkedTechnology?.uri ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>{selectedNote.linkedTechnology.name || '-'}</div>
                      <div style={{ fontSize: '0.84rem', wordBreak: 'break-all' }}>
                        {selectedNote.linkedTechnology.uri}
                      </div>
                    </div>
                  ) : (
                    <div style={{ opacity: 0.7 }}>Geen definitieve koppeling</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.88rem', opacity: 0.8, marginBottom: '0.2rem' }}>
                    Kandidaten (URI)
                  </div>
                  {selectedNote.candidateTechnologies.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {selectedNote.candidateTechnologies.map((candidate) => (
                        <li key={`${selectedNote.uri}-candidate-${candidate.uri}`} style={{ marginBottom: '0.35rem' }}>
                          <div style={{ fontWeight: 600 }}>{candidate.name || 'Kandidaat'}</div>
                          <div style={{ fontSize: '0.84rem', wordBreak: 'break-all' }}>{candidate.uri}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ opacity: 0.7 }}>Geen kandidaten</div>
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
