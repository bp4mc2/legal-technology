from pathlib import Path
import re

from .graphdb_client import sparql_query


GRAPH_URI = "https://data.bp4mc2.org/id/lto"
WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = WORKSPACE_ROOT / "data"
ALL_LEGAL_TECHNOLOGIES_PATH = DATA_DIR / "all-legal-technologies.ttl"
LEGAL_TECHNOLOGY_BUNDLES_DIR = DATA_DIR / "legal-technology-bundles"
LEGAL_TECHNOLOGY_ORGANISATION_BUNDLES_DIR = DATA_DIR / "legal-technology-organisation-bundles"

_DEFAULT_PREFIXES = [
    '@prefix lto: <http://bp4mc2.org/lto#> .',
    '@prefix lt: <http://bp4mc2.org/lt#> .',
    '@prefix dct: <http://purl.org/dc/terms/> .',
    '@prefix foaf: <http://xmlns.com/foaf/0.1/> .',
    '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .',
    '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
    '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
    '',
]


def ensure_export_directories():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LEGAL_TECHNOLOGY_BUNDLES_DIR.mkdir(parents=True, exist_ok=True)
    LEGAL_TECHNOLOGY_ORGANISATION_BUNDLES_DIR.mkdir(parents=True, exist_ok=True)


def _safe_filename(value):
    cleaned = re.sub(r'[^A-Za-z0-9._-]+', '-', str(value or '').strip())
    cleaned = cleaned.strip('-._')
    return cleaned or 'export'


def legal_technology_bundle_path(api_id):
    ensure_export_directories()
    return LEGAL_TECHNOLOGY_BUNDLES_DIR / f'{_safe_filename(api_id)}.ttl'


def organisation_bundle_path(iri):
    ensure_export_directories()
    return LEGAL_TECHNOLOGY_ORGANISATION_BUNDLES_DIR / f'{_safe_filename(str(iri).rstrip('/').split('/')[-1])}.ttl'


def write_named_graph_export(content):
    ensure_export_directories()
    ALL_LEGAL_TECHNOLOGIES_PATH.write_text(content, encoding='utf-8')
    return ALL_LEGAL_TECHNOLOGIES_PATH


def write_legal_technology_bundle(api_id, content):
    path = legal_technology_bundle_path(api_id)
    path.write_text(content, encoding='utf-8')
    return path


def remove_legal_technology_bundle(api_id):
    path = legal_technology_bundle_path(api_id)
    if path.exists():
        path.unlink()
    return path


def write_organisation_bundle(iri, content):
    path = organisation_bundle_path(iri)
    path.write_text(content, encoding='utf-8')
    return path


def remove_organisation_bundle(iri):
    path = organisation_bundle_path(iri)
    if path.exists():
        path.unlink()
    return path


def remove_stale_bundles(directory, active_filenames):
    ensure_export_directories()
    active = {str(name) for name in active_filenames}
    removed = []
    for path in directory.glob('*.ttl'):
        if path.name not in active:
            path.unlink()
            removed.append(path)
    return removed


def _term_to_turtle(term):
    term_type = term.get('type')
    value = term.get('value', '')
    if term_type == 'bnode':
        return f'_:{value}'
    if term_type == 'uri':
        return f'<{value}>'
    if term_type == 'literal':
        escaped = value.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
        lang = term.get('xml:lang')
        datatype = term.get('datatype')
        if lang:
            return f'"{escaped}"@{lang}'
        if datatype:
            return f'"{escaped}"^^<{datatype}>'
        return f'"{escaped}"'
    return f'"{value}"'


def serialize_bindings_to_turtle(bindings, prefixes=None):
    lines = list(prefixes or _DEFAULT_PREFIXES)
    for binding in bindings:
        s = _term_to_turtle(binding.get('s', {}))
        p = _term_to_turtle(binding.get('p', {}))
        o = _term_to_turtle(binding.get('o', {}))
        lines.append(f'{s} {p} {o} .')
    return '\n'.join(lines) + '\n'


def export_named_graph_turtle(graph_uri=GRAPH_URI):
    sparql = f'''
    SELECT DISTINCT ?s ?p ?o WHERE {{
      GRAPH <{graph_uri}> {{
        ?s ?p ?o .
      }}
    }}
    ORDER BY ?s ?p ?o
    '''
    result = sparql_query(sparql)
    bindings = result.get('results', {}).get('bindings', [])
    return serialize_bindings_to_turtle(bindings)