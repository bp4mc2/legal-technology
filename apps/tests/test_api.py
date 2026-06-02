
import sys
import os
import pytest
from unittest.mock import Mock
# Voeg projectroot toe aan sys.path zodat api gevonden wordt
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from api.routes.app import app
import api.routes.legal_technology as legal_technology_routes
import api.routes.product as product_routes
import api.routes.sticky_notes as sticky_notes_routes
import api.routes.definition as definition_routes
import api.routes.organisation as organisation_routes
import api.services.graphdb_service as graphdb_service
import api.services.access_policy as access_policy

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
    response = client.get('/api/legaltechnologies/search?q=test', headers={'X-User-Role': 'Viewer'})
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_add_and_get(client, monkeypatch):
    monkeypatch.setattr(graphdb_service, '_enum_lookup', lambda *args, **kwargs: '<http://example.com/mock-concept>')
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
    response = client.post('/api/legaltechnologies', json=data, headers={'X-User-Role': 'Proposer'})
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

def test_add_legal_technology_all_fields(client, monkeypatch):
    monkeypatch.setattr(graphdb_service, '_enum_lookup', lambda *args, **kwargs: '<http://example.com/mock-concept>')
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
    response = client.post('/api/legaltechnologies', json=data, headers={'X-User-Role': 'Proposer'})
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

    response = client.post('/api/legaltechnologies/export/sync', headers={'X-User-Role': 'Moderator'})

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


def test_get_technology_documentation_success(client, monkeypatch):
    monkeypatch.setattr(
        legal_technology_routes,
        'get_technology_documentation',
        lambda tech_id: {
            'technology_id': tech_id,
            'section_title': 'Alpha Counsel',
            'content': 'Alpha documentation body',
            'source': 'media/legal-technologies.md#alpha-counsel',
            'correlation_id': 'corr-doc-success',
        },
    )

    response = client.get('/api/legaltechnologies/alpha--v--1.0/documentation')

    assert response.status_code == 200
    assert response.json['technology_id'] == 'alpha--v--1.0'
    assert 'content' in response.json


def test_get_technology_documentation_not_found(client, monkeypatch):
    monkeypatch.setattr(legal_technology_routes, 'get_technology_documentation', lambda tech_id: None)

    response = client.get('/api/legaltechnologies/missing-tech/documentation')

    assert response.status_code == 404
    assert response.json['message'] == 'Documentation section not found'
    assert response.json['source'] == 'media/legal-technologies.md'
    assert response.json['correlation_id']


def test_get_catalog_documentation_success(client, monkeypatch):
    monkeypatch.setattr(
        legal_technology_routes,
        'get_catalog_documentation',
        lambda: {
            'title': 'Juridische technologie catalogus',
            'content': '# Overzicht\n\n# Technologieen',
            'source': 'media/legal-technologies.md',
            'section_count': 42,
        },
    )

    response = client.get('/api/legaltechnologies/documentation/catalog')

    assert response.status_code == 200
    assert response.json['title'] == 'Juridische technologie catalogus'
    assert response.json['section_count'] == 42
    assert response.json['correlation_id']


def test_get_catalog_documentation_not_found(client, monkeypatch):
    monkeypatch.setattr(legal_technology_routes, 'get_catalog_documentation', lambda: None)

    response = client.get('/api/legaltechnologies/documentation/catalog')

    assert response.status_code == 404
    assert response.json['message'] == 'Generated catalog documentation not found'
    assert response.json['source'] == 'media/legal-technologies.md'
    assert response.json['correlation_id']


def test_get_technology_documentation_read_error_returns_structured_503(client, monkeypatch):
    monkeypatch.setattr(
        legal_technology_routes,
        'get_technology_documentation',
        lambda tech_id: (_ for _ in ()).throw(legal_technology_routes.DocumentationReadError('read failed')),
    )

    response = client.get('/api/legaltechnologies/alpha--v--1.0/documentation')

    assert response.status_code == 503
    assert response.json['message'] == 'Generated documentation source is unavailable'
    assert response.json['source'] == 'media/legal-technologies.md'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID']


def test_get_catalog_documentation_read_error_returns_structured_503(client, monkeypatch):
    monkeypatch.setattr(
        legal_technology_routes,
        'get_catalog_documentation',
        lambda: (_ for _ in ()).throw(legal_technology_routes.DocumentationReadError('read failed')),
    )

    response = client.get('/api/legaltechnologies/documentation/catalog')

    assert response.status_code == 503
    assert response.json['message'] == 'Generated catalog documentation source is unavailable'
    assert response.json['source'] == 'media/legal-technologies.md'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID']


def test_get_technology_documentation_is_deterministic_for_identical_requests(client, monkeypatch):
    monkeypatch.setattr(
        legal_technology_routes,
        'get_technology_documentation',
        lambda tech_id: {
            'technology_id': tech_id,
            'section_title': 'Alpha Counsel',
            'content': 'Alpha documentation body',
            'source': 'media/legal-technologies.md#alpha-counsel',
        },
    )

    first = client.get('/api/legaltechnologies/alpha--v--1.0/documentation')
    second = client.get('/api/legaltechnologies/alpha--v--1.0/documentation')

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json['technology_id'] == second.json['technology_id']
    assert first.json['section_title'] == second.json['section_title']
    assert first.json['content'] == second.json['content']
    assert first.json['source'] == second.json['source']


def test_list_products_returns_product_concepts(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'list_products',
        lambda: [
            {
                'id': 'uitvoeringsspecificaties',
                'iri': 'http://bp4mc2.org/lto#Uitvoeringsspecificaties',
                'label': 'Uitvoeringsspecificaties',
            }
        ],
    )

    response = client.get('/api/products')

    assert response.status_code == 200
    assert response.json == [
        {
            'id': 'uitvoeringsspecificaties',
            'iri': 'http://bp4mc2.org/lto#Uitvoeringsspecificaties',
            'label': 'Uitvoeringsspecificaties',
        }
    ]


def test_get_product_traceability_returns_grouped_input_output_relations(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'get_product_traceability',
        lambda product_id: {
            'product': {
                'id': product_id,
                'iri': 'http://bp4mc2.org/lto#Uitvoeringsspecificaties',
                'label': 'Uitvoeringsspecificaties',
            },
            'relations': {
                'input': [
                    {
                        'task_id': 'begripdefinieren',
                        'task_iri': 'http://bp4mc2.org/ltt#BegripDefinieren',
                        'task_label': 'Begrip definieren',
                        'predicate': 'http://bp4mc2.org/lto#inputVoorTaak',
                        'relation_kind': 'input',
                    }
                ],
                'output': [
                    {
                        'task_id': 'regelmodelopstellen',
                        'task_iri': 'http://bp4mc2.org/ltt#RegelmodelOpstellen',
                        'task_label': 'Regelmodel opstellen',
                        'predicate': 'http://bp4mc2.org/lto#uitvoerVanTaak',
                        'relation_kind': 'output',
                    }
                ],
            },
        },
    )

    response = client.get('/api/products/uitvoeringsspecificaties/traceability')

    assert response.status_code == 200
    assert response.json['product']['id'] == 'uitvoeringsspecificaties'
    assert response.json['relations']['input'][0]['task_iri'] == 'http://bp4mc2.org/ltt#BegripDefinieren'
    assert response.json['relations']['output'][0]['task_iri'] == 'http://bp4mc2.org/ltt#RegelmodelOpstellen'


def test_get_product_traceability_returns_empty_groups_for_products_without_relations(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'get_product_traceability',
        lambda product_id: {
            'product': {
                'id': product_id,
                'iri': 'http://bp4mc2.org/lto#LeegProduct',
                'label': 'Leeg product',
            },
            'relations': {
                'input': [],
                'output': [],
            },
        },
    )

    response = client.get('/api/products/leeg-product/traceability')

    assert response.status_code == 200
    assert response.json['product']['id'] == 'leeg-product'
    assert response.json['relations']['input'] == []
    assert response.json['relations']['output'] == []


def test_get_product_traceability_not_found_returns_structured_404(client, monkeypatch):
    monkeypatch.setattr(product_routes, 'get_product_traceability', lambda product_id: None)

    response = client.get('/api/products/onbekend-product/traceability')

    assert response.status_code == 404
    assert response.json['message'] == 'Product traceability not found'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_list_products_timeout_returns_structured_503(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'list_products',
        lambda: (_ for _ in ()).throw(TimeoutError('graphdb timeout')),
    )

    response = client.get('/api/products')

    assert response.status_code == 503
    assert response.json['message'] == 'Product catalog is unavailable'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_get_product_traceability_timeout_returns_structured_503(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'get_product_traceability',
        lambda product_id: (_ for _ in ()).throw(TimeoutError('graphdb timeout')),
    )

    response = client.get('/api/products/uitvoeringsspecificaties/traceability')

    assert response.status_code == 503
    assert response.json['message'] == 'Product traceability is unavailable'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_get_product_contribution_chain_success(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'get_product_contribution_chain',
        lambda product_id: {
            'product': {
                'id': product_id,
                'iri': 'http://bp4mc2.org/lto#Regelmodel',
                'label': 'Regelmodel',
            },
            'chains': {
                'input': [
                    {
                        'task_id': 'regelvalideren',
                        'task_iri': 'http://bp4mc2.org/ltt#RegelValideren',
                        'task_label': 'Regel valideren',
                        'predicate': 'http://bp4mc2.org/lto#inputVoorTaak',
                        'relation_kind': 'input',
                        'missing_node': False,
                        'missing_reason': None,
                        'technologies': [
                            {
                                'id': 'mim--v--1.0.0',
                                'iri': 'https://data.bp4mc2.org/id/lto/legaltech/mim/v/1.0.0',
                                'label': 'MIM',
                                'evidence_links': [
                                    {
                                        'title': 'MIM source',
                                        'location': 'https://example.org/mim',
                                        'reference': 'ref-1',
                                    }
                                ],
                            }
                        ],
                    }
                ],
                'output': [],
            },
            'partial_data': False,
        },
    )

    response = client.get('/api/products/regelmodel/contribution-chain')

    assert response.status_code == 200
    assert response.json['product']['id'] == 'regelmodel'
    assert response.json['partial_data'] is False
    assert response.json['chains']['input'][0]['technologies'][0]['evidence_links'][0]['location'] == 'https://example.org/mim'


def test_get_product_contribution_chain_partial_data_marks_missing_nodes(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'get_product_contribution_chain',
        lambda product_id: {
            'product': {
                'id': product_id,
                'iri': 'http://bp4mc2.org/lto#Regelmodel',
                'label': 'Regelmodel',
            },
            'chains': {
                'input': [
                    {
                        'task_id': 'regelvalideren',
                        'task_iri': 'http://bp4mc2.org/ltt#RegelValideren',
                        'task_label': 'Regel valideren',
                        'predicate': 'http://bp4mc2.org/lto#inputVoorTaak',
                        'relation_kind': 'input',
                        'missing_node': True,
                        'missing_reason': 'No contributing technologies linked to this task.',
                        'technologies': [],
                    }
                ],
                'output': [],
            },
            'partial_data': True,
        },
    )

    response = client.get('/api/products/regelmodel/contribution-chain')

    assert response.status_code == 200
    assert response.json['partial_data'] is True
    assert response.json['chains']['input'][0]['missing_node'] is True
    assert response.json['chains']['input'][0]['missing_reason'] == 'No contributing technologies linked to this task.'


def test_get_product_contribution_chain_not_found_returns_structured_404(client, monkeypatch):
    monkeypatch.setattr(product_routes, 'get_product_contribution_chain', lambda product_id: None)

    response = client.get('/api/products/onbekend-product/contribution-chain')

    assert response.status_code == 404
    assert response.json['message'] == 'Product contribution chain not found'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_get_product_contribution_chain_timeout_returns_structured_503(client, monkeypatch):
    monkeypatch.setattr(
        product_routes,
        'get_product_contribution_chain',
        lambda product_id: (_ for _ in ()).throw(TimeoutError('graphdb timeout')),
    )

    response = client.get('/api/products/regelmodel/contribution-chain')

    assert response.status_code == 503
    assert response.json['message'] == 'Product contribution chain is unavailable'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']




def test_add_legal_technology_denied_for_viewer(client):
    data = {
        'naam': 'TestTech',
        'omschrijving': 'Omschrijving',
        'gebruiksstatus': 'In gebruik',
        'licentievorm': 'Volledig open',
        'geboden_functionaliteit': ['Functionaliteit 1'],
        'beoogde_gebruikers': ['Gebruiker 1'],
        'bijgewerkt_op': '2024-01-01',
        'ondersteuning_voor': [{'beschouwingsniveau': 'Semantisch', 'modelsoort': 'Descriptief'}],
        'geschikt_voor_taak': [{'omschrijving': 'Automatisch genereren van documenten', 'taaktype': 'OpstellenRegeltekst'}],
        'documentatie': {'beoogdGebruik': 'Beschrijving voorbeeld'},
        'technologietype': 'DSL',
        'taaktype': 'OpstellenRegeltekst'
    }
    response = client.post('/api/legaltechnologies', json=data, headers={'X-User-Role': 'Viewer'})
    assert response.status_code == 403
    assert response.json['message'] == 'You do not have permission for this action. Try an allowed action or contact a moderator.'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_search_allowed_for_viewer(client):
    response = client.get('/api/legaltechnologies/search?q=test', headers={'X-User-Role': 'Viewer'})
    assert response.status_code == 200
    assert isinstance(response.json, list)


def test_sticky_note_review_denied_for_viewer(client, monkeypatch):
    response = client.patch(
        '/api/stickynotes/review',
        json={'noteUri': 'test'},
        headers={'X-User-Role': 'Viewer'}
    )
    assert response.status_code == 403
    assert response.json['message'] == 'You do not have permission for this action. Try an allowed action or contact a moderator.'
    assert response.json['correlation_id']
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_policy_deny_logs_correlation_context_with_sanitized_actor(client, monkeypatch):
    warning_mock = Mock()
    monkeypatch.setattr(app.logger, 'warning', warning_mock)

    with app.test_request_context(
        '/api/legaltechnologies',
        method='POST',
        headers={
            'X-User-Role': 'Viewer',
            'X-Correlation-ID': 'corr-deny-log-1',
        },
    ):
        access_policy.request.environ['HTTP_X_ACTOR_ID'] = 'actor\nwith\tcontrols'
        response, status_code, headers = access_policy.require_action(
            'legal_technology:create',
            'legal_technology',
        )

    assert status_code == 403
    assert response.get_json()['correlation_id'] == 'corr-deny-log-1'
    assert headers['X-Correlation-ID'] == 'corr-deny-log-1'
    warning_mock.assert_called_once()
    args = warning_mock.call_args[0]
    assert args[0] == 'policy_deny action=%s resource=%s role=%s actor_id=%s correlation_id=%s'
    assert args[1] == 'legal_technology:create'
    assert args[2] == 'legal_technology'
    assert args[3] == 'Viewer'
    assert args[4] == 'actorwithcontrols'
    assert args[5] == 'corr-deny-log-1'


def test_definition_create_denied_for_viewer(client):
    payload = {
        'uri': 'http://example.org/term/alpha',
        'label': 'Alpha',
        'definition': 'Alpha definitie',
        'language': 'nl',
    }

    response = client.post('/api/definitions', json=payload, headers={'X-User-Role': 'Viewer'})

    assert response.status_code == 403
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_definition_create_allowed_for_proposer(client, monkeypatch):
    payload = {
        'uri': 'http://example.org/term/alpha',
        'label': 'Alpha',
        'definition': 'Alpha definitie',
        'language': 'nl',
    }
    monkeypatch.setattr(
        definition_routes,
        'add_definition',
        lambda data: {
            'uri': data['uri'],
            'label': data['label'],
            'definition': data['definition'],
            'language': data.get('language', 'nl'),
        },
    )

    response = client.post('/api/definitions', json=payload, headers={'X-User-Role': 'Proposer'})

    assert response.status_code == 201
    assert response.json['label'] == 'Alpha'


def test_definition_update_denied_for_proposer(client):
    response = client.put(
        '/api/definitions/alpha-term',
        json={'label': 'Nieuwe label'},
        headers={'X-User-Role': 'Proposer'},
    )

    assert response.status_code == 403
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_organisation_update_denied_for_proposer(client):
    response = client.put(
        '/api/organisations/http://example.org/org/alpha',
        json={'naam': 'Org Alpha'},
        headers={'X-User-Role': 'Proposer'},
    )

    assert response.status_code == 403
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


def test_organisation_update_allowed_for_moderator(client, monkeypatch):
    monkeypatch.setattr(
        organisation_routes,
        'update_organisation',
        lambda iri, data: {
            'iri': iri,
            'naam': data.get('naam', 'Org Alpha'),
            'contactinformatie': 'alpha@example.org',
        },
    )

    response = client.put(
        '/api/organisations/http://example.org/org/alpha',
        json={'naam': 'Org Alpha'},
        headers={'X-User-Role': 'Moderator'},
    )

    assert response.status_code == 200
    assert response.json['iri'] == 'http://example.org/org/alpha'


def test_organisation_delete_denied_for_moderator(client):
    response = client.delete(
        '/api/organisations/http://example.org/org/alpha',
        headers={'X-User-Role': 'Moderator'},
    )

    assert response.status_code == 403
    assert response.headers['X-Correlation-ID'] == response.json['correlation_id']


