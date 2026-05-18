
import sys
import os
import pytest
from unittest.mock import Mock
# Voeg projectroot toe aan sys.path zodat api gevonden wordt
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from api.routes.app import app
import api.routes.legal_technology as legal_technology_routes
import api.routes.sticky_notes as sticky_notes_routes
import api.services.graphdb_service as graphdb_service

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'

def test_search_empty(client):
    response = client.get('/api/legaltechnologies/search?q=test')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_add_and_get(client):
    # Test add with all required fields
    data = {
        'naam': 'TestTech',
        'omschrijving': 'Omschrijving',
        'gebruiksstatus': 'In gebruik',
        'licentievorm': 'Volledig open',
        'geboden_functionaliteit': ['Functionaliteit 1'],
        'beoogde_gebruikers': ['Gebruiker 1'],
        'bijgewerkt_op': '2024-01-01',
        'ondersteuning_voor': [
            {'beschouwingsniveau': 'Semantisch', 'modelsoort': 'Descriptief'}
        ],
        'geschikt_voor_taak': [
            {'omschrijving': 'Automatisch genereren van documenten', 'taaktype': 'OpstellenRegeltekst'}
        ],
        'documentatie': {
            'beoogdGebruik': 'Beschrijving voorbeeld',
            'toegevoegdeWaarde': 'Toegevoegde waarde',
            'onderdelen': 'Onderdelen',
            'ontwikkelingEnBeheer': 'Beheertekst'
        },
        'bronverwijzing': [
            {'titel': 'Whitepaper', 'locatie': 'https://example.com', 'verwijzing': 'Whitepaper 2024'}
        ],
        'technologietype': 'DSL',
        'taaktype': 'OpstellenRegeltekst'
    }
    response = client.post('/api/legaltechnologies', json=data)
    assert response.status_code == 201
    # Test get (returns None in placeholder)
    response = client.get('/api/legaltechnologies/1')
    assert response.status_code in (200, 404)

def test_enumerations(client):
    response = client.get('/api/legaltechnologies/enumerations')
    assert response.status_code == 200
    assert isinstance(response.json, list)
    # Check structure: each item should have 'name' and 'values'
    for enum in response.json:
        assert 'name' in enum
        assert 'values' in enum
        assert isinstance(enum['values'], list)

def test_get_specific_enumeration(client):
    # Try a known enumeration name (case-sensitive, e.g. 'Gebruiksstatussen')
    response = client.get('/api/legaltechnologies/enumerations/Gebruiksstatussen')
    assert response.status_code in (200, 404)  # 404 if not present in test DB
    if response.status_code == 200:
        assert 'name' in response.json
        assert 'values' in response.json
        assert isinstance(response.json['values'], list)

def test_add_legal_technology_all_fields(client):
    # Test adding a legal technology with all required fields
    data = {
        'naam': 'TestTech',
        'omschrijving': 'Omschrijving',
        'gebruiksstatus': 'In gebruik',
        'licentievorm': 'Volledig open',
        'geboden_functionaliteit': ['Functionaliteit 1'],
        'beoogde_gebruikers': ['Gebruiker 1'],
        'bijgewerkt_op': '2024-01-01',
        'ondersteuning_voor': [
            {'beschouwingsniveau': 'Semantisch', 'modelsoort': 'Descriptief'}
        ],
        'geschikt_voor_taak': [
            {'omschrijving': 'Automatisch genereren van documenten', 'taaktype': 'OpstellenRegeltekst'}
        ],
        'documentatie': {
            'beoogdGebruik': 'Beschrijving voorbeeld',
            'toegevoegdeWaarde': 'Toegevoegde waarde',
            'onderdelen': 'Onderdelen',
            'ontwikkelingEnBeheer': 'Beheertekst'
        },
        'bronverwijzing': [
            {'titel': 'Whitepaper', 'locatie': 'https://example.com', 'verwijzing': 'Whitepaper 2024'}
        ],
        'technologietype': 'DSL',
        'taaktype': 'OpstellenRegeltekst'
    }
    response = client.post('/api/legaltechnologies', json=data)
    assert response.status_code == 201
    assert 'naam' in response.json
    assert response.json['naam'] == 'TestTech'

def test_stats(client):
    response = client.get('/api/stats')
    assert response.status_code == 200
    assert 'count' in response.json


def test_export_named_graph_route(client, monkeypatch):
    monkeypatch.setattr(legal_technology_routes, 'export_named_graph_download', lambda: '@prefix lto: <http://bp4mc2.org/lto#> .\n')

    response = client.get('/api/legaltechnologies/export/all.ttl')

    assert response.status_code == 200
    assert response.data.decode('utf-8').startswith('@prefix lto:')
    assert 'all-legal-technologies.ttl' in response.headers['Content-Disposition']


def test_sync_named_graph_route(client, monkeypatch):
    monkeypatch.setattr(
        legal_technology_routes,
        'sync_named_graph_exports',
        lambda: {'named_graph_path': 'data/all-legal-technologies.ttl', 'legal_technology_bundles': 1, 'organisation_bundles': 1},
    )

    response = client.post('/api/legaltechnologies/export/sync')

    assert response.status_code == 200
    assert response.json['named_graph_path'] == 'data/all-legal-technologies.ttl'


def test_add_legal_technology_triggers_export_sync(monkeypatch):
    sync_mock = Mock()
    monkeypatch.setattr(graphdb_service, 'sparql_update', lambda *args, **kwargs: None)
    monkeypatch.setattr(graphdb_service, '_sync_exports_after_legal_technology_change', sync_mock)

    result = graphdb_service.add_legal_technology({
        'naam': 'TestTech',
        'omschrijving': 'Omschrijving',
        'gebruiksstatus': 'In gebruik',
        'licentievorm': 'Volledig open',
        'bijgewerkt_op': '2024-01-01',
        'beheerder': 'https://data.bp4mc2.org/id/lto/organisatie/org-1',
    })

    assert result['id']
    sync_mock.assert_called_once()


def test_delete_legal_technology_triggers_export_sync(monkeypatch):
    sync_mock = Mock()
    monkeypatch.setattr(graphdb_service, 'sparql_update', lambda *args, **kwargs: None)
    monkeypatch.setattr(graphdb_service, '_sync_exports_after_legal_technology_change', sync_mock)
    monkeypatch.setattr(
        graphdb_service,
        'get_legal_technology',
        lambda _id: {
            'id': _id,
            'beheerder': 'https://data.bp4mc2.org/id/lto/organisatie/org-1',
            'leverancier': None,
        },
    )

    result = graphdb_service.delete_legal_technology('testtech--v--1.0')

    assert result['id'] == 'testtech--v--1.0'
    sync_mock.assert_called_once()


def test_sticky_notes_technology_uri_filter_forwarded(client, monkeypatch):
    captured = {}

    def _fake_list_sticky_notes(**kwargs):
        captured.update(kwargs)
        return []

    monkeypatch.setattr(sticky_notes_routes, 'list_sticky_notes', _fake_list_sticky_notes)

    response = client.get(
        '/api/stickynotes?technologyUri=https%3A%2F%2Fdata.bp4mc2.org%2Fid%2Flto%2Flegaltech%2Fmim%2Fv%2F1.0'
    )

    assert response.status_code == 200
    assert captured.get('technology_uri') == 'https://data.bp4mc2.org/id/lto/legaltech/mim/v/1.0'
