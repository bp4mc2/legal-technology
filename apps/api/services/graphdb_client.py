import requests
import configparser
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config/graphdb.ini')

def get_graphdb_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_PATH)
    host = config.get('graphdb', 'host', fallback='http://localhost:7200')
    repo = config.get('graphdb', 'repository', fallback='legal_technologies')
    return host, repo

def sparql_query(query, graph_uri=None):
    host, repo = get_graphdb_config()
    url = f"{host}/repositories/{repo}"
    headers = {'Accept': 'application/sparql-results+json'}
    params = {'query': query}
    # Do NOT set default-graph-uri for named graph queries; the SPARQL query itself specifies the graph
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

def sparql_update(update, graph_uri=None):
    host, repo = get_graphdb_config()
    url = f"{host}/repositories/{repo}/statements"
    headers = {'Content-Type': 'application/sparql-update'}
    params = {}
    if graph_uri:
        params['context'] = f'<{graph_uri}>'
    response = requests.post(url, data=update.encode('utf-8'), headers=headers, params=params)
    response.raise_for_status()
    return True
