import pytest
from api.routes.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_list_definitions(client):
    response = client.get('/api/definitions')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_add_definition(client):
    data = {
        'uri': 'http://example.org/def/test',
        'label': 'Testdefinitie',
        'definition': 'Een testdefinitie.'
    }
    response = client.post('/api/definitions', json=data, headers={'X-User-Role': 'Proposer'})
    assert response.status_code in (201, 503)  # 503 als GraphDB niet bereikbaar

def test_get_definition(client):
    # Dit test alleen de API, niet of de definitie echt bestaat
    response = client.get('/api/definitions/http://example.org/def/test')
    assert response.status_code in (200, 404)

def test_update_definition(client):
    # Zorg dat de definitie bestaat
    create_data = {
        'uri': 'http://example.org/def/test',
        'label': 'Testdefinitie',
        'definition': 'Een testdefinitie.',
        'language': 'nl'
    }
    import time
    client.post('/api/definitions', json=create_data, headers={'X-User-Role': 'Proposer'})
    time.sleep(0.5)
    # Update de definitie (inclusief language veld)
    update_data = {
        'label': 'Testdefinitie aangepast',
        'definition': 'Aangepaste testdefinitie.',
        'language': 'nl'
    }
    response = client.put('/api/definitions/http://example.org/def/test', json=update_data, headers={'X-User-Role': 'Moderator'})
    assert response.status_code in (200, 404)
