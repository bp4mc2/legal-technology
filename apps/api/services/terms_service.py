"""
Service voor SKOS-definities (terms.ttl) in een aparte named graph.
"""
from typing import List, Dict, Optional
from collections import defaultdict
from .graphdb_client import sparql_query, sparql_update

TERMS_GRAPH = 'http://bp4mc2.org/lt#'


def _extract_definitions_from_bindings(bindings: List[Dict]) -> List[Dict]:
  """Extract and aggregate definitions from SPARQL bindings."""
  definitions_map: Dict[str, Dict] = defaultdict(lambda: {
    'uri': '',
    'label': '',
    'definition': '',
    'language': None,
    'altLabel': [],
    'scopeNote': [],
    'editorialNote': [],
    'related': [],
    'broaderGeneric': [],
    'narrowerGeneric': []
  })
  
  for b in bindings:
    uri = b['concept']['value']
    if uri not in definitions_map:
      definitions_map[uri]['uri'] = uri
      definitions_map[uri]['label'] = b.get('label', {}).get('value', '')
      definitions_map[uri]['definition'] = b.get('definition', {}).get('value', '')
      definitions_map[uri]['language'] = b.get('lang', {}).get('value', None)
    
    # Add optional multi-valued properties
    if 'alt' in b and b['alt']['value']:
      alt_val = b['alt']['value']
      if alt_val not in definitions_map[uri]['altLabel']:
        definitions_map[uri]['altLabel'].append(alt_val)
    
    if 'scope' in b and b['scope']['value']:
      scope_val = b['scope']['value']
      if scope_val not in definitions_map[uri]['scopeNote']:
        definitions_map[uri]['scopeNote'].append(scope_val)
    
    if 'editorial' in b and b['editorial']['value']:
      edit_val = b['editorial']['value']
      if edit_val not in definitions_map[uri]['editorialNote']:
        definitions_map[uri]['editorialNote'].append(edit_val)
    
    if 'related' in b and b['related']['value']:
      related_concept = {'uri': b['related']['value'], 'label': b.get('relatedLabel', {}).get('value', 'N/A')}
      if related_concept not in definitions_map[uri]['related']:
        definitions_map[uri]['related'].append(related_concept)
    
    if 'broader' in b and b['broader']['value']:
      broader_concept = {'uri': b['broader']['value'], 'label': b.get('broaderLabel', {}).get('value', 'N/A')}
      if broader_concept not in definitions_map[uri]['broaderGeneric']:
        definitions_map[uri]['broaderGeneric'].append(broader_concept)
    
    if 'narrower' in b and b['narrower']['value']:
      narrower_concept = {'uri': b['narrower']['value'], 'label': b.get('narrowerLabel', {}).get('value', 'N/A')}
      if narrower_concept not in definitions_map[uri]['narrowerGeneric']:
        definitions_map[uri]['narrowerGeneric'].append(narrower_concept)
  
  return list(definitions_map.values())


def list_definitions() -> List[Dict]:
  """Haal alle SKOS-definities op met volledige SKOS properties."""
  sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX skosthes: <http://purl.org/iso25964/skos-thes#>
    SELECT ?concept ?label ?definition ?lang ?alt ?scope ?editorial ?related ?relatedLabel ?broader ?broaderLabel ?narrower ?narrowerLabel WHERE {{
      GRAPH <{TERMS_GRAPH}> {{
        ?concept a skos:Concept ;
                 skos:prefLabel ?label ;
                 skos:definition ?definition .
        BIND(lang(?label) AS ?lang)
        OPTIONAL {{ ?concept skos:altLabel ?alt . }}
        OPTIONAL {{ ?concept skos:scopeNote ?scope . }}
        OPTIONAL {{ ?concept skos:editorialNote ?editorial . }}
        OPTIONAL {{ ?concept skos:related ?related . ?related skos:prefLabel ?relatedLabel . }}
        OPTIONAL {{ ?concept skosthes:broaderGeneric ?broader . ?broader skos:prefLabel ?broaderLabel . }}
        OPTIONAL {{ ?concept skosthes:narrowerGeneric ?narrower . ?narrower skos:prefLabel ?narrowerLabel . }}
      }}
    }}
    ORDER BY ?concept
  '''
  result = sparql_query(sparql, TERMS_GRAPH)
  bindings = result.get('results', {}).get('bindings', [])
  return _extract_definitions_from_bindings(bindings)



def add_definition(data: Dict) -> Dict:
  """Add a new SKOS definition with optional properties."""
  uri = data.get('uri')
  label = data.get('label')
  definition = data.get('definition')
  language = data.get('language', 'nl')
  altLabel = data.get('altLabel', [])
  scopeNote = data.get('scopeNote', [])
  editorialNote = data.get('editorialNote', [])
  
  if not (uri and label and definition):
    raise ValueError('uri, label and definition are required')
  
  # Build the triple with optional properties
  triples = f'''<{uri}> a skos:Concept ;
    skos:prefLabel """{label}"""@{language} ;
    skos:definition """{definition}"""@{language}'''
  
  for alt in altLabel:
    escaped_alt = alt.replace('"', '\\"')
    triples += f' ;\n    skos:altLabel """{escaped_alt}"""@{language}'
  
  for scope in scopeNote:
    escaped_scope = scope.replace('"', '\\"')
    triples += f' ;\n    skos:scopeNote """{escaped_scope}"""@{language}'
  
  for edit in editorialNote:
    escaped_edit = edit.replace('"', '\\"')
    triples += f' ;\n    skos:editorialNote """{escaped_edit}"""@{language}'
  
  triples += ' .'
  
  sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    INSERT DATA {{
      GRAPH <{TERMS_GRAPH}> {{
        {triples}
      }}
    }}
  '''
  sparql_update(sparql, TERMS_GRAPH)
  
  return {
    'uri': uri,
    'label': label,
    'definition': definition,
    'language': language,
    'altLabel': altLabel,
    'scopeNote': scopeNote,
    'editorialNote': editorialNote,
    'related': [],
    'broaderGeneric': [],
    'narrowerGeneric': []
  }



def get_definition(id: str) -> Optional[Dict]:
  """Get a SKOS definition with all properties."""
  sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX skosthes: <http://purl.org/iso25964/skos-thes#>
    SELECT ?label ?definition ?lang ?alt ?scope ?editorial ?related ?relatedLabel ?broader ?broaderLabel ?narrower ?narrowerLabel WHERE {{
      GRAPH <{TERMS_GRAPH}> {{
        <{id}> a skos:Concept ;
          skos:prefLabel ?label ;
          skos:definition ?definition .
        BIND(lang(?label) AS ?lang)
        OPTIONAL {{ <{id}> skos:altLabel ?alt . }}
        OPTIONAL {{ <{id}> skos:scopeNote ?scope . }}
        OPTIONAL {{ <{id}> skos:editorialNote ?editorial . }}
        OPTIONAL {{ <{id}> skos:related ?related . ?related skos:prefLabel ?relatedLabel . }}
        OPTIONAL {{ <{id}> skosthes:broaderGeneric ?broader . ?broader skos:prefLabel ?broaderLabel . }}
        OPTIONAL {{ <{id}> skosthes:narrowerGeneric ?narrower . ?narrower skos:prefLabel ?narrowerLabel . }}
      }}
    }}
  '''
  result = sparql_query(sparql, TERMS_GRAPH)
  bindings = result.get('results', {}).get('bindings', [])
  if not bindings:
    return None
  
  definitions = _extract_definitions_from_bindings(bindings)
  return definitions[0] if definitions else None



def update_definition(id: str, data: Dict) -> Dict:
  """Update a SKOS definition with all properties."""
  label = data.get('label')
  definition = data.get('definition')
  language = data.get('language', 'nl')
  altLabel = data.get('altLabel', [])
  scopeNote = data.get('scopeNote', [])
  editorialNote = data.get('editorialNote', [])
  
  if not (label and definition):
    raise ValueError('label en definition zijn verplicht')
  
  # Delete old properties
  sparql_delete = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    DELETE WHERE {{
      GRAPH <{TERMS_GRAPH}> {{
        <{id}> skos:prefLabel ?l ;
               skos:definition ?d ;
               skos:altLabel ?alt ;
               skos:scopeNote ?scope ;
               skos:editorialNote ?edit .
      }}
    }}
  '''
  sparql_update(sparql_delete, TERMS_GRAPH)
  
  # Insert new properties
  triples = f'''<{id}> a skos:Concept ;
    skos:prefLabel """{label}"""@{language} ;
    skos:definition """{definition}"""@{language}'''
  
  for alt in altLabel:
    escaped_alt = alt.replace('"', '\\"')
    triples += f' ;\n    skos:altLabel """{escaped_alt}"""@{language}'
  
  for scope in scopeNote:
    escaped_scope = scope.replace('"', '\\"')
    triples += f' ;\n    skos:scopeNote """{escaped_scope}"""@{language}'
  
  for edit in editorialNote:
    escaped_edit = edit.replace('"', '\\"')
    triples += f' ;\n    skos:editorialNote """{escaped_edit}"""@{language}'
  
  triples += ' .'
  
  sparql_insert = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    INSERT DATA {{
      GRAPH <{TERMS_GRAPH}> {{
        {triples}
      }}
    }}
  '''
  sparql_update(sparql_insert, TERMS_GRAPH)
  
  return {
    'uri': id,
    'label': label,
    'definition': definition,
    'language': language,
    'altLabel': altLabel,
    'scopeNote': scopeNote,
    'editorialNote': editorialNote,
    'related': [],
    'broaderGeneric': [],
    'narrowerGeneric': []
  }


def delete_definition(id: str) -> None:
  """Delete a SKOS definition and all its properties."""
  sparql_delete = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX skosthes: <http://purl.org/iso25964/skos-thes#>
    DELETE WHERE {{
      GRAPH <{TERMS_GRAPH}> {{
        <{id}> ?p ?v .
      }}
    }}
  '''
  sparql_update(sparql_delete, TERMS_GRAPH)
