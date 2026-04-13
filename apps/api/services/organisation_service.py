"""Service for managing lto:Organisatie resources."""

from .graphdb_client import sparql_query, sparql_update
import uuid


def list_organisations():
    """List all organisations from GraphDB."""
    sparql = '''
    PREFIX lto: <http://bp4mc2.org/lto#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?iri ?naam ?contactinformatie WHERE {
        ?iri a lto:Organisatie ;
             lto:naamOrganisatie ?naam ;
             lto:contactinformatie ?contactinformatie .
    }
    ORDER BY ?naam
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        organizations = []
        for b in bindings:
            iri = b.get('iri', {}).get('value', '')
            naam = b.get('naam', {}).get('value', '')
            contact = b.get('contactinformatie', {}).get('value', '')
            if iri:
                organizations.append({
                    'iri': iri,
                    'naam': naam,
                    'contactinformatie': contact
                })
        return organizations
    except Exception as e:
        print(f"[DEBUG] Exception in list_organisations: {e}")
        return []


def get_organisation(iri):
    """Get a single organisation by IRI."""
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?naam ?contactinformatie WHERE {{
        <{iri}> a lto:Organisatie ;
                lto:naamOrganisatie ?naam ;
                lto:contactinformatie ?contactinformatie .
    }}
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        if not bindings:
            return None
        b = bindings[0]
        return {
            'iri': iri,
            'naam': b.get('naam', {}).get('value', ''),
            'contactinformatie': b.get('contactinformatie', {}).get('value', '')
        }
    except Exception as e:
        print(f"[DEBUG] Exception in get_organisation: {e}")
        return None


def add_organisation(data):
    """Add a new organisation to GraphDB."""
    graph_uri = "https://data.bp4mc2.org/id/lto"
    base_uri = "https://data.bp4mc2.org/id/lto/organisatie/"
    org_id = str(uuid.uuid4())
    org_iri = f"{base_uri}{org_id}"

    naam = data.get("naam", "")
    contact = data.get("contactinformatie", "")

    insert = f'''
    INSERT DATA {{ GRAPH <{graph_uri}> {{
        <{org_iri}> a <http://bp4mc2.org/lto#Organisatie> ;
                    <http://bp4mc2.org/lto#naamOrganisatie> "{naam}" ;
                    <http://bp4mc2.org/lto#contactinformatie> "{contact}" .
    }} }}
    '''
    try:
        sparql_update(insert, graph_uri=graph_uri)
        return {
            'iri': org_iri,
            'naam': naam,
            'contactinformatie': contact
        }
    except Exception as e:
        print(f"[DEBUG] Exception in add_organisation: {e}")
        raise


def update_organisation(iri, data):
    """Update an organisation in GraphDB."""
    graph_uri = "https://data.bp4mc2.org/id/lto"
    
    # Get current values first
    current = get_organisation(iri)
    if not current:
        return None

    naam = data.get("naam", current["naam"])
    contact = data.get("contactinformatie", current["contactinformatie"])

    # Delete old triples and insert new ones
    delete = f'''
    DELETE DATA {{ GRAPH <{graph_uri}> {{
        <{iri}> <http://bp4mc2.org/lto#naamOrganisatie> "{current["naam"]}" ;
                <http://bp4mc2.org/lto#contactinformatie> "{current["contactinformatie"]}" .
    }} }}
    '''

    insert = f'''
    INSERT DATA {{ GRAPH <{graph_uri}> {{
        <{iri}> <http://bp4mc2.org/lto#naamOrganisatie> "{naam}" ;
                <http://bp4mc2.org/lto#contactinformatie> "{contact}" .
    }} }}
    '''
    try:
        sparql_update(delete, graph_uri=graph_uri)
        sparql_update(insert, graph_uri=graph_uri)
        return {
            'iri': iri,
            'naam': naam,
            'contactinformatie': contact
        }
    except Exception as e:
        print(f"[DEBUG] Exception in update_organisation: {e}")
        raise


def delete_organisation(iri):
    """Delete an organisation from GraphDB."""
    graph_uri = "https://data.bp4mc2.org/id/lto"
    
    # Get current values first for the delete statement
    current = get_organisation(iri)
    if not current:
        return None

    delete = f'''
    DELETE DATA {{ GRAPH <{graph_uri}> {{
        <{iri}> a <http://bp4mc2.org/lto#Organisatie> ;
                <http://bp4mc2.org/lto#naamOrganisatie> "{current["naam"]}" ;
                <http://bp4mc2.org/lto#contactinformatie> "{current["contactinformatie"]}" .
    }} }}
    '''
    try:
        sparql_update(delete, graph_uri=graph_uri)
        return current
    except Exception as e:
        print(f"[DEBUG] Exception in delete_organisation: {e}")
        raise


def _term_to_turtle(term):
    term_type = term.get('type')
    value = term.get('value', '')
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


def export_organisation_turtle(iri):
    """Export one organisation and inbound references as Turtle."""
    org = get_organisation(iri)
    if not org:
        return None

    graph_uri = "https://data.bp4mc2.org/id/lto"
    sparql = f'''
    SELECT DISTINCT ?s ?p ?o WHERE {{
      GRAPH <{graph_uri}> {{
        {{ BIND(<{iri}> AS ?s) . ?s ?p ?o . }}
        UNION
        {{ ?s ?p <{iri}> . BIND(<{iri}> AS ?o) }}
      }}
    }}
    ORDER BY ?s ?p ?o
    '''
    result = sparql_query(sparql)
    bindings = result.get('results', {}).get('bindings', [])

    lines = [
        '@prefix lto: <http://bp4mc2.org/lto#> .',
        '@prefix lt: <http://bp4mc2.org/lt#> .',
        ''
    ]
    for b in bindings:
        s = _term_to_turtle(b.get('s', {}))
        p = _term_to_turtle(b.get('p', {}))
        o = _term_to_turtle(b.get('o', {}))
        lines.append(f'{s} {p} {o} .')
    return '\n'.join(lines) + '\n'
