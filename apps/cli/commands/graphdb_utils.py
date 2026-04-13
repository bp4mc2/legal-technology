import requests
import click
import configparser
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config/graphdb.ini')

def get_graphdb_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_PATH)
    host = config.get('graphdb', 'host', fallback='http://localhost:7200')
    repo = config.get('graphdb', 'repository', fallback='legal_technologies')
    return host, repo

def upload_ttl_to_graphdb(file_path, host, repo, graph_uri=None):
    url = f"{host}/repositories/{repo}/statements"
    headers = {'Content-Type': 'text/turtle'}
    params = {}
    if graph_uri:
        params['context'] = f'<{graph_uri}>'
    with open(file_path, 'rb') as f:
        data = f.read()
    response = requests.post(url, data=data, headers=headers, params=params)
    if response.status_code not in (200, 204):
        raise click.ClickException(f"Fout bij uploaden: {response.status_code} {response.text}")
    return True

def clear_graphdb(host, repo):
    url = f"{host}/repositories/{repo}/statements"
    response = requests.delete(url)
    if response.status_code not in (200, 204):
        raise click.ClickException(f"Fout bij leegmaken: {response.status_code} {response.text}")
    return True

def extract_graphdb(host, repo, out_file):
    url = f"{host}/repositories/{repo}/statements?format=text/turtle"
    response = requests.get(url)
    if response.status_code != 200:
        raise click.ClickException(f"Fout bij exporteren: {response.status_code} {response.text}")
    with open(out_file, 'wb') as f:
        f.write(response.content)
    return True
