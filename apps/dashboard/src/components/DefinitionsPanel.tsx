import React, { useEffect, useState } from 'react';

interface Definition {
  uri: string;
  label: string;
  definition: string;
  language?: string;
  altLabel?: string[];
  scopeNote?: string[];
  editorialNote?: string[];
  related?: { uri: string; label: string }[];
  broaderGeneric?: { uri: string; label: string }[];
  narrowerGeneric?: { uri: string; label: string }[];
}

const API_URL = '/api/definitions';

const DefinitionsPanel: React.FC = () => {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDef, setNewDef] = useState<Partial<Definition>>({
    altLabel: [],
    scopeNote: [],
    editorialNote: [],
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDef, setSelectedDef] = useState<Definition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDefinitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Kon definities niet ophalen');
      const data = await res.json();
      setDefinitions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewDef({ ...newDef, [e.target.name]: e.target.value });
  };

  const handleArrayInputChange = (field: string, index: number, value: string) => {
    const arr = (newDef[field as keyof Definition] as string[]) || [];
    arr[index] = value;
    setNewDef({ ...newDef, [field]: [...arr] });
  };

  const handleAddArrayField = (field: string) => {
    const arr = (newDef[field as keyof Definition] as string[]) || [];
    setNewDef({ ...newDef, [field]: [...arr, ''] });
  };

  const handleRemoveArrayField = (field: string, index: number) => {
    const arr = (newDef[field as keyof Definition] as string[]) || [];
    setNewDef({ ...newDef, [field]: arr.filter((_, i) => i !== index) });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!newDef.uri || !newDef.label || !newDef.definition) {
      setError('Label, definitie en URI zijn verplicht');
      return;
    }

    try {
      const payload = {
        uri: newDef.uri,
        label: newDef.label,
        definition: newDef.definition,
        language: newDef.language || 'nl',
        altLabel: (newDef.altLabel as string[])?.filter(a => a.trim()) || [],
        scopeNote: (newDef.scopeNote as string[])?.filter(s => s.trim()) || [],
        editorialNote: (newDef.editorialNote as string[])?.filter(e => e.trim()) || [],
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Toevoegen mislukt');
      setSuccess('Definitie toegevoegd!');
      setNewDef({ altLabel: [], scopeNote: [], editorialNote: [] });
      setShowForm(false);
      fetchDefinitions();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (uri: string) => {
    if (!window.confirm('Weet je zeker dat je deze definitie wilt verwijderen?')) return;
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(uri)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Verwijderen mislukt');
      setDefinitions(definitions => definitions.filter(d => d.uri !== uri));
      setSelectedDef(null);
      setSuccess('Definitie verwijderd!');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filteredDefinitions = definitions.filter(d =>
    d.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const relatedDefinition = (uri: string) => definitions.find(d => d.uri === uri);

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2>📚 Definities (SKOS)</h2>
          <button onClick={() => { setShowForm(true); setNewDef({ altLabel: [], scopeNote: [], editorialNote: [] }); }} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            + Toevoegen
          </button>
        </div>

        <input
          type="text"
          placeholder="Zoek in definities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '1rem',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 14,
          }}
        />

        {loading && <p>Laden...</p>}
        {error && <p style={{ color: 'red', backgroundColor: '#ffe6e6', padding: 12, borderRadius: 4 }}>{error}</p>}
        {success && <p style={{ color: 'green', backgroundColor: '#e6ffe6', padding: 12, borderRadius: 4 }}>{success}</p>}
      </div>

      {showForm && (
        <div style={{ marginBottom: '2rem', background: '#f9f9f9', padding: 16, borderRadius: 8, border: '2px solid #ddd' }}>
          <h3>Nieuwe Definitie Toevoegen</h3>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>URI *</label>
              <input
                name="uri"
                placeholder="bijv. http://bp4mc2.org/lt#MijnConcept"
                value={newDef.uri || ''}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd' }}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Label (Voorkeurslabel) *</label>
              <input
                name="label"
                placeholder="Concept label"
                value={newDef.label || ''}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd' }}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Definitie *</label>
              <textarea
                name="definition"
                placeholder="Omschrijving van het concept"
                value={newDef.definition || ''}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd', minHeight: 80 }}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Alternatieve labels</label>
              {(newDef.altLabel as string[])?.map((alt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={alt}
                    onChange={(e) => handleArrayInputChange('altLabel', idx, e.target.value)}
                    placeholder="Alternatief label"
                    style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #ddd' }}
                  />
                  <button type="button" onClick={() => handleRemoveArrayField('altLabel', idx)} style={{ padding: '8px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => handleAddArrayField('altLabel')} style={{ fontSize: 12, padding: '4px 8px', cursor: 'pointer', background: '#e8f4f8', border: '1px solid #b3d9e8', borderRadius: 4 }}>+ Voeg toe</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Reikwijdte (Scope)</label>
              {(newDef.scopeNote as string[])?.map((scope, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <textarea
                    value={scope}
                    onChange={(e) => handleArrayInputChange('scopeNote', idx, e.target.value)}
                    placeholder="Reikwijdte informatie"
                    style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #ddd', minHeight: 60 }}
                  />
                  <button type="button" onClick={() => handleRemoveArrayField('scopeNote', idx)} style={{ padding: '8px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => handleAddArrayField('scopeNote')} style={{ fontSize: 12, padding: '4px 8px', cursor: 'pointer', background: '#e8f4f8', border: '1px solid #b3d9e8', borderRadius: 4 }}>+ Voeg toe</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Redactionele opmerking</label>
              {(newDef.editorialNote as string[])?.map((edit, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <textarea
                    value={edit}
                    onChange={(e) => handleArrayInputChange('editorialNote', idx, e.target.value)}
                    placeholder="Redactionele opmerking"
                    style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #ddd', minHeight: 60 }}
                  />
                  <button type="button" onClick={() => handleRemoveArrayField('editorialNote', idx)} style={{ padding: '8px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => handleAddArrayField('editorialNote')} style={{ fontSize: 12, padding: '4px 8px', cursor: 'pointer', background: '#e8f4f8', border: '1px solid #b3d9e8', borderRadius: 4 }}>+ Voeg toe</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Taal</label>
              <select
                name="language"
                value={newDef.language || 'nl'}
                onChange={(e) => setNewDef({ ...newDef, language: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd' }}
              >
                <option value="nl">Nederlands (nl)</option>
                <option value="en">English (en)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Toevoegen
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Definition List */}
        <div>
          <h3>Definities ({filteredDefinitions.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredDefinitions.map(def => (
              <li
                key={def.uri}
                onClick={() => setSelectedDef(def)}
                style={{
                  marginBottom: 12,
                  background: selectedDef?.uri === def.uri ? '#e3f2fd' : '#fff',
                  borderRadius: 8,
                  boxShadow: '0 1px 4px #0001',
                  padding: 12,
                  cursor: 'pointer',
                  border: selectedDef?.uri === def.uri ? '2px solid #2196f3' : '1px solid #ddd',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{def.label}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{def.definition.substring(0, 80)}...</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Definition Details */}
        {selectedDef && (
          <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, border: '2px solid #2196f3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <h3>{selectedDef.label}</h3>
              <button onClick={() => handleDelete(selectedDef.uri)} style={{ padding: '6px 12px', color: 'white', backgroundColor: '#dc3545', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Verwijderen
              </button>
            </div>

            {/* Definition */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>📖 Definitie</div>
              <div style={{ padding: 10, backgroundColor: '#fff', borderLeft: '4px solid #2196f3', borderRadius: 4 }}>
                {selectedDef.definition}
              </div>
            </div>

            {/* URI */}
            <div style={{ marginBottom: 16, fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#666' }}>URI</div>
              <code style={{ backgroundColor: '#e8e8e8', padding: 4, borderRadius: 4, wordBreak: 'break-all' }}>
                {selectedDef.uri}
              </code>
            </div>

            {/* Alternative Labels */}
            {selectedDef.altLabel && selectedDef.altLabel.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>🔀 Alternatieve Labels</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedDef.altLabel.map((alt, idx) => (
                    <span key={idx} style={{ backgroundColor: '#fff3cd', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scope Note */}
            {selectedDef.scopeNote && selectedDef.scopeNote.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>🎯 Reikwijdte</div>
                {selectedDef.scopeNote.map((scope, idx) => (
                  <div key={idx} style={{ padding: 10, backgroundColor: '#fff', borderLeft: '4px solid #ff9800', borderRadius: 4, marginBottom: 8 }}>
                    {scope}
                  </div>
                ))}
              </div>
            )}

            {/* Editorial Note */}
            {selectedDef.editorialNote && selectedDef.editorialNote.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>📝 Redactionele Opmerking</div>
                {selectedDef.editorialNote.map((edit, idx) => (
                  <div key={idx} style={{ padding: 10, backgroundColor: '#fff', borderLeft: '4px solid #9c27b0', borderRadius: 4, marginBottom: 8 }}>
                    {edit}
                  </div>
                ))}
              </div>
            )}

            {/* Related Concepts */}
            {selectedDef.related && selectedDef.related.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>🔗 Gerelateerde Concepten</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedDef.related.map((rel) => (
                    <button
                      key={rel.uri}
                      onClick={() => setSelectedDef(relatedDefinition(rel.uri) || selectedDef)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e3f2fd',
                        border: '1px solid #2196f3',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {rel.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Broader Concepts */}
            {selectedDef.broaderGeneric && selectedDef.broaderGeneric.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>⬆️ Bredere Concepten</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedDef.broaderGeneric.map((broader) => (
                    <button
                      key={broader.uri}
                      onClick={() => setSelectedDef(relatedDefinition(broader.uri) || selectedDef)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3e5f5',
                        border: '1px solid #9c27b0',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {broader.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Narrower Concepts */}
            {selectedDef.narrowerGeneric && selectedDef.narrowerGeneric.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>⬇️ Specifiekere Concepten</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedDef.narrowerGeneric.map((narrower) => (
                    <button
                      key={narrower.uri}
                      onClick={() => setSelectedDef(relatedDefinition(narrower.uri) || selectedDef)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3e5f5',
                        border: '1px solid #9c27b0',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {narrower.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language */}
            {selectedDef.language && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 16, borderTop: '1px solid #ddd', paddingTop: 12 }}>
                Taal: <strong>{selectedDef.language}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefinitionsPanel;
