import pytest
import requests

from api.services import graphdb_client


def test_sparql_query_returns_structured_fallback_on_connection_error(monkeypatch):
    monkeypatch.setattr(graphdb_client, "get_graphdb_config", lambda: ("http://localhost:7200", "legal_technologies"))

    def fake_get(*args, **kwargs):
        raise requests.exceptions.ConnectionError("connection reset")

    monkeypatch.setattr(graphdb_client.requests, "get", fake_get)

    result = graphdb_client.sparql_query("SELECT * WHERE { ?s ?p ?o }")

    assert result["head"] == {"vars": []}
    assert result["results"] == {"bindings": []}
    assert result["_fallback"]["code"] == "graphdb_unavailable"
    assert result["_fallback"]["operation"] == "query"
    assert result["_fallback"]["repository"] == "legal_technologies"


def test_sparql_update_raises_graphdb_client_error_on_connection_error(monkeypatch):
    monkeypatch.setattr(graphdb_client, "get_graphdb_config", lambda: ("http://localhost:7200", "legal_technologies"))

    def fake_post(*args, **kwargs):
        raise requests.exceptions.ConnectionError("connection reset")

    monkeypatch.setattr(graphdb_client.requests, "post", fake_post)

    with pytest.raises(graphdb_client.GraphDBClientError) as exc_info:
        graphdb_client.sparql_update("INSERT DATA { <x> <y> <z> }")

    assert exc_info.value.operation == "update"
    assert exc_info.value.host == "http://localhost:7200"
    assert exc_info.value.repository == "legal_technologies"
