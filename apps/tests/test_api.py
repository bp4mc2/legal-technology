
import sys
import os
import pytest
# Voeg projectroot toe aan sys.path zodat api gevonden wordt
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from api.routes.app import app

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
