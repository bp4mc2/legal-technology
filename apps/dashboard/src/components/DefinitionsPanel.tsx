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

const emptyDefinition = {
  altLabel: [],
  scopeNote: [],
  editorialNote: [],
};

const DefinitionsPanel: React.FC = () => {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDef, setNewDef] = useState<Partial<Definition>>(emptyDefinition);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDef, setSelectedDef] = useState<Definition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDefinitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Kon definities niet ophalen');
      }
      const data = await response.json();
      setDefinitions(data);
    } catch (caughtError: any) {
      setError(caughtError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewDef({ ...newDef, [event.target.name]: event.target.value });
  };

  const handleArrayInputChange = (field: keyof Definition, index: number, value: string) => {
    const currentValues = ([...(newDef[field] as string[] | undefined ?? [])]);
    currentValues[index] = value;
    setNewDef({ ...newDef, [field]: currentValues });
  };

  const handleAddArrayField = (field: keyof Definition) => {
    const currentValues = ([...(newDef[field] as string[] | undefined ?? [])]);
    setNewDef({ ...newDef, [field]: [...currentValues, ''] });
  };

  const handleRemoveArrayField = (field: keyof Definition, index: number) => {
    const currentValues = ([...(newDef[field] as string[] | undefined ?? [])]);
    setNewDef({
      ...newDef,
      [field]: currentValues.filter((_, currentIndex) => currentIndex !== index),
    });
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
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
        altLabel: (newDef.altLabel || []).filter((item) => item.trim()),
        scopeNote: (newDef.scopeNote || []).filter((item) => item.trim()),
        editorialNote: (newDef.editorialNote || []).filter((item) => item.trim()),
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Toevoegen mislukt');
      }

      setSuccess('Definitie toegevoegd!');
      setNewDef(emptyDefinition);
      setShowForm(false);
      await fetchDefinitions();
    } catch (caughtError: any) {
      setError(caughtError.message);
    }
  };

  const handleDelete = async (uri: string) => {
    if (!window.confirm('Weet je zeker dat je deze definitie wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(uri)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Verwijderen mislukt');
      }
      setDefinitions((currentDefinitions) => currentDefinitions.filter((definition) => definition.uri !== uri));
      setSelectedDef(null);
      setSuccess('Definitie verwijderd!');
    } catch (caughtError: any) {
      setError(caughtError.message);
    }
  };

  const filteredDefinitions = definitions.filter((definition) =>
    definition.label.toLowerCase().includes(searchTerm.toLowerCase())
    || definition.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const relatedDefinition = (uri: string) => definitions.find((definition) => definition.uri === uri);

  const resetForm = () => {
    setShowForm(false);
    setNewDef(emptyDefinition);
  };

  return (
    <div className="lt-panel-shell lt-defs-page">
      <div className="lt-defs-header">
        <div className="lt-defs-titlebar">
          <h2 className="lt-defs-page-title">📚 Definities (SKOS)</h2>
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setNewDef(emptyDefinition);
            }}
            className="lt-defs-add-btn"
          >
            + Toevoegen
          </button>
        </div>

        <input
          type="text"
          placeholder="Zoek in definities..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="lt-defs-search"
        />

        {loading && <p>Laden...</p>}
        {error && <p className="lt-defs-message lt-defs-message--error">{error}</p>}
        {success && <p className="lt-defs-message lt-defs-message--success">{success}</p>}
      </div>

      {showForm && (
        <div className="lt-defs-form">
          <h3 className="lt-defs-form-title">Nieuwe Definitie Toevoegen</h3>
          <form onSubmit={handleAdd}>
            <div className="lt-defs-field">
              <label className="lt-defs-label">URI *</label>
              <input
                type="text"
                name="uri"
                value={newDef.uri || ''}
                onChange={handleInputChange}
                required
                placeholder="https://example.org/concept/1"
                className="lt-defs-input"
              />
            </div>

            <div className="lt-defs-field">
              <label className="lt-defs-label">Label (Voorkeurslabel) *</label>
              <input
                type="text"
                name="label"
                value={newDef.label || ''}
                onChange={handleInputChange}
                required
                placeholder="Concept label"
                className="lt-defs-input"
              />
            </div>

            <div className="lt-defs-field">
              <label className="lt-defs-label">Definitie *</label>
              <textarea
                name="definition"
                value={newDef.definition || ''}
                onChange={handleInputChange}
                required
                placeholder="Beschrijving van het concept"
                className="lt-defs-textarea lt-defs-textarea--short"
              />
            </div>

            <div className="lt-defs-field">
              <label className="lt-defs-label">Alternatieve labels</label>
              {(newDef.altLabel || []).map((label, index) => (
                <div key={`${label}-${index}`} className="lt-defs-array-row">
                  <input
                    type="text"
                    value={label}
                    onChange={(event) => handleArrayInputChange('altLabel', index, event.target.value)}
                    placeholder="Alternatief label"
                    className="lt-defs-input lt-defs-array-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayField('altLabel', index)}
                    className="lt-defs-remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => handleAddArrayField('altLabel')} className="lt-defs-add-small-btn">+ Voeg toe</button>
            </div>

            <div className="lt-defs-field">
              <label className="lt-defs-label">Reikwijdte (Scope)</label>
              {(newDef.scopeNote || []).map((note, index) => (
                <div key={`${note}-${index}`} className="lt-defs-array-row">
                  <textarea
                    value={note}
                    onChange={(event) => handleArrayInputChange('scopeNote', index, event.target.value)}
                    placeholder="Reikwijdte"
                    className="lt-defs-textarea lt-defs-array-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayField('scopeNote', index)}
                    className="lt-defs-remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => handleAddArrayField('scopeNote')} className="lt-defs-add-small-btn">+ Voeg toe</button>
            </div>

            <div className="lt-defs-field">
              <label className="lt-defs-label">Redactionele opmerking</label>
              {(newDef.editorialNote || []).map((note, index) => (
                <div key={`${note}-${index}`} className="lt-defs-array-row">
                  <textarea
                    value={note}
                    onChange={(event) => handleArrayInputChange('editorialNote', index, event.target.value)}
                    placeholder="Opmerking"
                    className="lt-defs-textarea lt-defs-array-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArrayField('editorialNote', index)}
                    className="lt-defs-remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => handleAddArrayField('editorialNote')} className="lt-defs-add-small-btn">+ Voeg toe</button>
            </div>

            <div className="lt-defs-field">
              <label className="lt-defs-label">Taal</label>
              <input
                type="text"
                name="language"
                value={newDef.language || 'nl'}
                onChange={handleInputChange}
                placeholder="nl"
                className="lt-defs-input"
              />
            </div>

            <div className="lt-defs-actions">
              <button type="submit" className="lt-defs-submit-btn">Opslaan</button>
              <button type="button" onClick={resetForm} className="lt-defs-cancel-btn">Annuleren</button>
            </div>
          </form>
        </div>
      )}

      <div className="lt-defs-layout">
        <div>
          <h3>Definities ({filteredDefinitions.length})</h3>
          <ul className="lt-defs-list">
            {filteredDefinitions.map((definition) => (
              <li
                key={definition.uri}
                onClick={() => setSelectedDef(definition)}
                className={`lt-defs-list-item${selectedDef?.uri === definition.uri ? ' is-selected' : ''}`}
              >
                <div className="lt-defs-list-title">{definition.label}</div>
                <div className="lt-defs-list-desc">{definition.definition.substring(0, 80)}...</div>
              </li>
            ))}
          </ul>
        </div>

        {selectedDef && (
          <div className="lt-defs-detail">
            <div className="lt-defs-detail-head">
              <h3 className="lt-defs-detail-title">{selectedDef.label}</h3>
              <button type="button" onClick={() => handleDelete(selectedDef.uri)} className="lt-defs-delete-btn">Verwijderen</button>
            </div>

            <div className="lt-defs-block">
              <div className="lt-defs-block-title">📖 Definitie</div>
              <div className="lt-defs-def-box">{selectedDef.definition}</div>
            </div>

            <div className="lt-defs-block">
              <div className="lt-defs-uri-label">URI</div>
              <code className="lt-defs-code">{selectedDef.uri}</code>
            </div>

            {selectedDef.altLabel && selectedDef.altLabel.length > 0 && (
              <div className="lt-defs-block">
                <div className="lt-defs-block-title">🔀 Alternatieve Labels</div>
                <div className="lt-defs-chip-group">
                  {selectedDef.altLabel.map((label) => (
                    <span key={label} className="lt-defs-tag">{label}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedDef.scopeNote && selectedDef.scopeNote.length > 0 && (
              <div className="lt-defs-block">
                <div className="lt-defs-block-title">🎯 Reikwijdte</div>
                {selectedDef.scopeNote.map((note) => (
                  <div key={note} className="lt-defs-scope-box">{note}</div>
                ))}
              </div>
            )}

            {selectedDef.editorialNote && selectedDef.editorialNote.length > 0 && (
              <div className="lt-defs-block">
                <div className="lt-defs-block-title">📝 Redactionele Opmerking</div>
                {selectedDef.editorialNote.map((note) => (
                  <div key={note} className="lt-defs-edit-box">{note}</div>
                ))}
              </div>
            )}

            {selectedDef.related && selectedDef.related.length > 0 && (
              <div className="lt-defs-block">
                <div className="lt-defs-block-title">🔗 Gerelateerde Concepten</div>
                <div className="lt-defs-chip-group">
                  {selectedDef.related.map((relatedItem) => (
                    <button
                      key={relatedItem.uri}
                      type="button"
                      onClick={() => {
                        const definition = relatedDefinition(relatedItem.uri);
                        if (definition) {
                          setSelectedDef(definition);
                        }
                      }}
                      className="lt-defs-related-btn lt-defs-related-btn--related"
                    >
                      {relatedItem.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDef.broaderGeneric && selectedDef.broaderGeneric.length > 0 && (
              <div className="lt-defs-block">
                <div className="lt-defs-block-title">⬆️ Bredere Concepten</div>
                <div className="lt-defs-chip-group">
                  {selectedDef.broaderGeneric.map((broaderItem) => (
                    <button
                      key={broaderItem.uri}
                      type="button"
                      onClick={() => {
                        const definition = relatedDefinition(broaderItem.uri);
                        if (definition) {
                          setSelectedDef(definition);
                        }
                      }}
                      className="lt-defs-related-btn lt-defs-related-btn--broader"
                    >
                      {broaderItem.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDef.narrowerGeneric && selectedDef.narrowerGeneric.length > 0 && (
              <div className="lt-defs-block">
                <div className="lt-defs-block-title">⬇️ Specifiekere Concepten</div>
                <div className="lt-defs-chip-group">
                  {selectedDef.narrowerGeneric.map((narrowerItem) => (
                    <button
                      key={narrowerItem.uri}
                      type="button"
                      onClick={() => {
                        const definition = relatedDefinition(narrowerItem.uri);
                        if (definition) {
                          setSelectedDef(definition);
                        }
                      }}
                      className="lt-defs-related-btn lt-defs-related-btn--narrower"
                    >
                      {narrowerItem.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDef.language && (
              <div className="lt-defs-footer">
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
