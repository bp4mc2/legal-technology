import requests
import configparser
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config/graphdb.ini')


class GraphDBClientError(Exception):
    """Normalized GraphDB client error for consistent API error handling."""

    def __init__(self, operation, host, repository, message, original_error=None):
        super().__init__(message)
        self.operation = operation
        self.host = host
        self.repository = repository
        self.message = message
        self.original_error = original_error

    def to_response_payload(self):
        return {
            "code": "graphdb_unavailable",
            "message": self.message,
            "operation": self.operation,
            "host": self.host,
            "repository": self.repository,
        }


def escape_sparql_literal(value):
    """Escape dynamic string input for safe use in SPARQL quoted literals."""
    if value is None:
        return ""

    return (
        str(value)
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
    )

def get_graphdb_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_PATH)
    host = config.get('graphdb', 'host', fallback='http://localhost:7200')
    repo = config.get('graphdb', 'repository', fallback='legal_technologies')
    return host, repo


def _build_query_fallback_result(operation, host, repository, message):
    return {
        "head": {"vars": []},
        "results": {"bindings": []},
        "_fallback": {
            "code": "graphdb_unavailable",
            "message": message,
            "operation": operation,
            "host": host,
            "repository": repository,
        },
    }


def _raise_graphdb_client_error(operation, host, repository, error):
    raise GraphDBClientError(
        operation=operation,
        host=host,
        repository=repository,
        message=f"GraphDB {operation} failed: {error}",
        original_error=error,
    ) from error

def sparql_query(query, graph_uri=None, timeout_seconds=None):
    host, repo = get_graphdb_config()
    url = f"{host}/repositories/{repo}"
    headers = {'Accept': 'application/sparql-results+json'}
    params = {'query': query}
    # Do NOT set default-graph-uri for named graph queries; the SPARQL query itself specifies the graph
    try:
        response = requests.get(url, params=params, headers=headers, timeout=timeout_seconds)
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, ValueError) as error:
        return _build_query_fallback_result(
            operation="query",
            host=host,
            repository=repo,
            message=f"GraphDB query fallback applied: {error}",
        )

def sparql_update(update, graph_uri=None):
    host, repo = get_graphdb_config()
    url = f"{host}/repositories/{repo}/statements"
    headers = {'Content-Type': 'application/sparql-update'}
    params = {}
    if graph_uri:
        params['context'] = f'<{graph_uri}>'
    try:
        response = requests.post(url, data=update.encode('utf-8'), headers=headers, params=params)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as error:
        _raise_graphdb_client_error("update", host, repo, error)
