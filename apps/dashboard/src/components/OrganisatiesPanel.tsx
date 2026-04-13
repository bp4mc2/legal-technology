import React, { useState, useEffect } from 'react';
import { apiFetch, apiFetchText } from '../utils/api';

type Organisation = {
  iri: string;
  naam: string;
  contactinformatie: string;
};

const OrganisatiesPanel: React.FC = () => {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingIri, setEditingIri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    naam: '',
    contactinformatie: ''
  });

  // Load organisations
  useEffect(() => {
    loadOrganisations();
  }, []);

  const loadOrganisations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Organisation[]>('/api/organisations');
      setOrganisations(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setShowForm(true);
    setEditingIri(null);
    setFormData({ naam: '', contactinformatie: '' });
    setSuccess(null);
    setError(null);
  };

  const handleEditClick = (org: Organisation) => {
    setShowForm(true);
    setEditingIri(org.iri);
    setFormData({
      naam: org.naam,
      contactinformatie: org.contactinformatie
    });
    setSuccess(null);
    setError(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIri(null);
    setFormData({ naam: '', contactinformatie: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingIri) {
        // Update
        await apiFetch<Organisation>(`/api/organisations/${encodeURIComponent(editingIri)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        setSuccess('Organisatie bijgewerkt!');
      } else {
        // Create
        await apiFetch<Organisation>('/api/organisations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        setSuccess('Organisatie toegevoegd!');
      }
      setShowForm(false);
      setEditingIri(null);
      setFormData({ naam: '', contactinformatie: '' });
      await loadOrganisations();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (iri: string) => {
    if (!window.confirm('Weet je zeker dat je deze organisatie wilt verwijderen?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch<Organisation>(`/api/organisations/${encodeURIComponent(iri)}`, {
        method: 'DELETE'
      });
      setSuccess('Organisatie verwijderd!');
      await loadOrganisations();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadOrganisationTurtle = async (iri: string) => {
    try {
      const turtle = await apiFetchText(`/api/organisations/${encodeURIComponent(iri)}/export.ttl`);
      const filename = `organisatie-${iri.split('/').pop() || 'export'}.ttl`;
      const blob = new Blob([turtle], { type: 'text/turtle;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="p-3 bg-white rounded shadow-sm">
      <h3 className="mb-3 text-primary">Organisaties</h3>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!showForm ? (
        <>
          <button
            className="btn btn-primary btn-sm mb-3"
            onClick={handleAddClick}
            disabled={loading}
          >
            + Nieuwe organisatie
          </button>

          {loading ? (
            <div className="text-muted">Laden...</div>
          ) : organisations.length === 0 ? (
            <div className="text-muted">Geen organisaties gevonden</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Naam</th>
                    <th>Contactinformatie</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {organisations.map((org) => (
                    <tr key={org.iri}>
                      <td>{org.naam}</td>
                      <td>{org.contactinformatie}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEditClick(org)}
                          disabled={loading}
                        >
                          Bewerk
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => downloadOrganisationTurtle(org.iri)}
                          disabled={loading}
                        >
                          Download TTL
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(org.iri)}
                          disabled={loading}
                        >
                          Verwijder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit} className="border rounded p-3">
          <div className="mb-3">
            <label className="form-label">Naam:</label>
            <input
              type="text"
              className="form-control"
              value={formData.naam}
              onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contactinformatie:</label>
            <input
              type="text"
              className="form-control"
              value={formData.contactinformatie}
              onChange={(e) => setFormData({ ...formData, contactinformatie: e.target.value })}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-success me-2"
              disabled={loading}
            >
              {loading ? 'Bezig...' : editingIri ? 'Bijwerken' : 'Toevoegen'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Annuleren
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OrganisatiesPanel;
