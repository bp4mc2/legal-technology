# Placeholder service-implementatie voor GraphDB API interactie

import hashlib
from pathlib import Path

from .graphdb_client import sparql_query, sparql_update
from .bundle_export_service import (
    GRAPH_URI,
    ALL_LEGAL_TECHNOLOGIES_PATH,
    LEGAL_TECHNOLOGY_BUNDLES_DIR,
    LEGAL_TECHNOLOGY_ORGANISATION_BUNDLES_DIR,
    export_named_graph_turtle,
    legal_technology_bundle_path,
    organisation_bundle_path,
    remove_legal_technology_bundle,
    remove_stale_bundles,
    write_legal_technology_bundle,
    write_named_graph_export,
    write_organisation_bundle,
)
from datetime import date, datetime


_CONCEPT_LABEL_CACHE = {}
_CONCEPT_IRI_BY_LABEL_CACHE = {}
_LEGALTECH_BASE_IRI = "https://data.bp4mc2.org/id/lto/legaltech"
_SUBTYPE_CLASS_MAP = {
    "Methode": "http://bp4mc2.org/lto#Methode",
    "Standaard": "http://bp4mc2.org/lto#Standaard",
    "Tool": "http://bp4mc2.org/lto#Tool",
}
_CLASS_TO_SUBTYPE = {
    iri: label for label, iri in _SUBTYPE_CLASS_MAP.items()
}
_PRODUCT_SCHEME_IRI = "http://bp4mc2.org/lto#BegrippenkaderProducten"
_PRODUCT_INPUT_PREDICATE_IRI = "http://bp4mc2.org/lto#inputVoorTaak"
_PRODUCT_OUTPUT_PREDICATE_IRI = "http://bp4mc2.org/lto#uitvoerVanTaak"
_PRODUCT_LIST_QUERY_TIMEOUT_SECONDS = 1.8
_PRODUCT_TRACEABILITY_QUERY_TIMEOUT_SECONDS = 1.8
_PRODUCT_CONTRIBUTION_CHAIN_QUERY_TIMEOUT_SECONDS = 1.8


def _split_group_concat(value):
    if not value:
        return []
    return [item for item in value.split('@@') if item]


def _normalize_org_iri(value):
    # Preferred format: a direct IRI string to a reusable lto:Organisatie resource.
    if isinstance(value, str):
        iri = value.strip()
        return iri or None
    if isinstance(value, dict):
        iri = str(value.get('iri', '')).strip()
        return iri or None
    return None


def _extract_concept_identifier(concept_iri):
    if not concept_iri:
        return ''
    return concept_iri.rsplit('#', 1)[-1].rsplit('/', 1)[-1].rsplit(':', 1)[-1]


def _legacy_stable_concept_identifier(concept_iri):
    identifier = _extract_concept_identifier(concept_iri)
    return ''.join(ch.lower() for ch in identifier if ch.isalnum())


def _stable_concept_identifier(concept_iri):
    # Keep IDs human-readable while preventing collisions between similar fragments.
    legacy_id = _legacy_stable_concept_identifier(concept_iri)
    fingerprint = hashlib.sha1(str(concept_iri or '').encode('utf-8')).hexdigest()[:8]
    if legacy_id:
        return f"{legacy_id}-{fingerprint}"
    return f"concept-{fingerprint}"


def _normalize_abbrevation(value):
    raw = str(value or '').strip()
    if not raw:
        return ''
    cleaned = ''.join(ch for ch in raw if ch.isalnum() or ch in ('-', '_'))
    return cleaned.lower()


def _normalize_version(value):
    raw = str(value or '').strip()
    return raw if raw else '1.0.0'


def _normalize_iso_date(value, field_name):
    if value is None:
        return ''
    if isinstance(value, date):
        return value.isoformat()

    raw = str(value).strip()
    if not raw:
        return ''

    # Accept full datetime strings but store as xsd:date.
    date_part = raw[:10]
    try:
        return datetime.strptime(date_part, '%Y-%m-%d').date().isoformat()
    except ValueError as exc:
        raise ValueError(f"{field_name} must be an ISO date (YYYY-MM-DD)") from exc


def _normalize_subtype(value):
    subtype = str(value or '').strip()
    if subtype in _SUBTYPE_CLASS_MAP:
        return subtype
    return "Methode"


def _build_api_id(abbrevation, version):
    return f"{abbrevation}--v--{version}"


def _parse_api_id(api_id):
    token = str(api_id or '').strip()
    if '--v--' in token:
        abbrevation, version = token.split('--v--', 1)
        return _normalize_abbrevation(abbrevation), _normalize_version(version)
    return None, None


def _build_tech_iri(abbrevation, version):
    return f"{_LEGALTECH_BASE_IRI}/{abbrevation}/v/{version}"


def _parse_tech_iri(tech_iri):
    prefix = f"{_LEGALTECH_BASE_IRI}/"
    value = str(tech_iri or '')
    if not value.startswith(prefix):
        return None, None
    tail = value[len(prefix):]
    if '/v/' not in tail:
        return None, None
    abbrevation, version = tail.split('/v/', 1)
    if '/' in version:
        return None, None
    return _normalize_abbrevation(abbrevation), _normalize_version(version)


def _resolve_tech_iri_from_id(api_id):
    abbrevation, version = _parse_api_id(api_id)
    if abbrevation and version:
        return _build_tech_iri(abbrevation, version)
    return f"{_LEGALTECH_BASE_IRI}/{api_id}"


def _get_part_iri(tech_iri, part, unique_suffix):
    return f"{tech_iri}/{part}/{unique_suffix}"


def _get_concept_label(concept_iri):
    if not concept_iri:
        return ''
    # Use the full IRI as cache key to handle both lt: and lto: concepts
    if concept_iri in _CONCEPT_LABEL_CACHE:
        return _CONCEPT_LABEL_CACHE[concept_iri]

    sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?label WHERE {{
        BIND(IRI("{concept_iri}") AS ?concept)
        OPTIONAL {{ ?concept skos:prefLabel ?pref_label . }}
        OPTIONAL {{ ?concept rdfs:label ?rdfs_label . }}
        BIND(COALESCE(STR(?pref_label), STR(?rdfs_label), "") AS ?label)
        FILTER(STRLEN(?label) > 0)
    }}
    LIMIT 1
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        label = bindings[0].get('label', {}).get('value', '') if bindings else ''
        _CONCEPT_LABEL_CACHE[concept_iri] = label
        return label
    except Exception as e:
        print(f"[DEBUG] Exception in _get_concept_label for {concept_iri}:", e)
        return ''


def _get_concept_labels_batch(concept_iris):
    """Resolve multiple concept IRIs to labels in one query and hydrate cache."""
    clean_iris = []
    seen = set()
    for iri in concept_iris or []:
        value = str(iri or '').strip()
        if not value or not value.startswith('http'):
            continue
        if value in seen:
            continue
        seen.add(value)
        clean_iris.append(value)

    if not clean_iris:
        return {}

    values = ' '.join(f'<{iri}>' for iri in clean_iris)
    sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?concept ?label WHERE {{
      VALUES ?concept {{ {values} }}
      OPTIONAL {{ ?concept skos:prefLabel ?pref_label . }}
      OPTIONAL {{ ?concept rdfs:label ?rdfs_label . }}
      BIND(COALESCE(STR(?pref_label), STR(?rdfs_label), "") AS ?label)
    }}
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        labels = {}
        for b in bindings:
            iri = b.get('concept', {}).get('value', '')
            label = b.get('label', {}).get('value', '')
            if iri:
                labels[iri] = label
                _CONCEPT_LABEL_CACHE[iri] = label

        for iri in clean_iris:
            labels.setdefault(iri, _CONCEPT_LABEL_CACHE.get(iri, ''))
        return labels
    except Exception as e:
        print('[DEBUG] Exception in _get_concept_labels_batch:', e)
        return {iri: _CONCEPT_LABEL_CACHE.get(iri, '') for iri in clean_iris}


def _lookup_concept_iri_by_label(label):
    """Reverse lookup: given a Dutch concept label, return '<IRI>' string for use in SPARQL INSERT."""
    if not label:
        return None
    if label in _CONCEPT_IRI_BY_LABEL_CACHE:
        return _CONCEPT_IRI_BY_LABEL_CACHE[label]
    escaped = label.replace('\\', '\\\\').replace('"', '\\"')
    sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?concept WHERE {{
        ?concept a skos:Concept .
        {{ ?concept skos:prefLabel ?pl . FILTER(STR(?pl) = "{escaped}") }}
        UNION
        {{ ?concept rdfs:label ?rl . FILTER(STR(?rl) = "{escaped}") }}
    }}
    LIMIT 1
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        iri = bindings[0].get('concept', {}).get('value', '') if bindings else ''
        value = f'<{iri}>' if iri else None
        _CONCEPT_IRI_BY_LABEL_CACHE[label] = value
        return value
    except Exception:
        return None


def _enum_lookup(enum_map_section, label, *, require_iri=False, field_name='waarde'):
    """Look up a concept label and return either an IRI term or a literal fallback."""
    if label in enum_map_section:
        return enum_map_section[label]
    iri = _lookup_concept_iri_by_label(label)
    if iri:
        return iri
    if require_iri:
        raise ValueError(f"{field_name} must resolve to a concept IRI: {label}")
    return f'"{label}"'


def _get_object_values(subject_iri, predicate):
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT DISTINCT ?value WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        <{subject_iri}> lto:{predicate} ?value .
      }}
    }}
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        return [binding.get('value', {}).get('value', '') for binding in bindings if binding.get('value', {}).get('value', '')]
    except Exception as e:
        print(f"[DEBUG] Exception in _get_object_values for {predicate}:", e)
        return []


def _get_ondersteuning_voor(tech_iri):
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT DISTINCT ?ondersteuning ?beschouwingsniveau ?modelsoort WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        <{tech_iri}> lto:ondersteuningVoor ?ondersteuning .
        OPTIONAL {{ ?ondersteuning lto:beschouwingsniveau ?beschouwingsniveau . }}
        OPTIONAL {{ ?ondersteuning lto:modelsoort ?modelsoort . }}
      }}
    }}
    ORDER BY ?ondersteuning
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        ondersteuning = []
        for binding in bindings:
            beschouwingsniveau = _get_concept_label(binding.get('beschouwingsniveau', {}).get('value', ''))
            modelsoort = _get_concept_label(binding.get('modelsoort', {}).get('value', ''))

            # Ignore structurally present but semantically empty ondersteuning entries.
            if not beschouwingsniveau and not modelsoort:
                continue

            ondersteuning.append({
                'beschouwingsniveau': beschouwingsniveau,
                'modelsoort': modelsoort,
            })
        return ondersteuning
    except Exception as e:
        print('[DEBUG] Exception in _get_ondersteuning_voor:', e)
        return []


def _get_geschikt_voor_taak(tech_iri):
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT DISTINCT ?geschikt ?omschrijving ?taaktype WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        <{tech_iri}> lto:geschiktVoorTaak ?geschikt .
        OPTIONAL {{ ?geschikt lto:omschrijving ?omschrijving . }}
        OPTIONAL {{ ?geschikt lto:taaktype ?taaktype . }}
      }}
    }}
    ORDER BY ?geschikt
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        geschikt = []
        seen = set()
        for binding in bindings:
            taaktype_binding = binding.get('taaktype', {})
            taaktype_type = taaktype_binding.get('type', '')
            taaktype_val = taaktype_binding.get('value', '')
            if taaktype_type == 'uri':
                taaktype_label = _get_concept_label(taaktype_val)
            else:
                # Stored as plain literal (legacy data) — return as-is.
                taaktype_label = taaktype_val
            omschrijving = binding.get('omschrijving', {}).get('value', '')

            # Ignore structurally present but semantically empty taak entries.
            if not omschrijving and not taaktype_label:
                continue

            key = (omschrijving, taaktype_label)
            if key in seen:
                continue
            seen.add(key)

            geschikt.append({
                'omschrijving': omschrijving,
                'taaktype': taaktype_label,
            })
        return geschikt
    except Exception as e:
        print('[DEBUG] Exception in _get_geschikt_voor_taak:', e)
        return []


def _map_legal_technology_results(bindings):
    # Map SPARQL result bindings to legal technology dicts
    results = []
    for b in bindings:
        uri = b.get('tech', {}).get('value', '')
        parsed_abbrev, parsed_versienummer = _parse_tech_iri(uri)
        abbrevation = b.get('abbrevation', {}).get('value', '') or parsed_abbrev or ''
        versienummer = b.get('versienummer', {}).get('value', '') or parsed_versienummer or ''
        versiedatum = b.get('versiedatum', {}).get('value', '') or ''
        id_val = _build_api_id(abbrevation, versienummer) if abbrevation and versienummer else (uri.split('/')[-1] if uri else '')
        gebruiksstatus_iri = b.get('gebruiksstatus', {}).get('value', '')
        licentievorm_iri = b.get('licentievorm', {}).get('value', '')
        subtype_iri = b.get('subtypeClass', {}).get('value', '')
        results.append({
            'id': id_val,
            'subtype': _CLASS_TO_SUBTYPE.get(subtype_iri, ''),
            'versienummer': versienummer,
            'versiedatum': versiedatum,
            'naam': b.get('naam', {}).get('value', ''),
            'omschrijving': b.get('omschrijving', {}).get('value', ''),
            'gebruiksstatus': _get_concept_label(gebruiksstatus_iri),
            'licentievorm': _get_concept_label(licentievorm_iri),
            'bijgewerkt_op': b.get('bijgewerktOp', {}).get('value', ''),
            # Add more fields as needed
        })
    return results

def list_legal_technologies():
    # List all legal technologies
    sparql = '''
    PREFIX lto: <http://bp4mc2.org/lto#>
            SELECT ?tech ?subtypeClass ?abbrevation ?versienummer ?versiedatum ?naam ?omschrijving ?gebruiksstatus ?licentievorm ?bijgewerktOp WHERE {
    VALUES ?subtypeClass { lto:Methode lto:Standaard lto:Tool }
    ?tech a ?subtypeClass ;
            lto:naam ?naam ;
            lto:omschrijving ?omschrijving ;
            lto:gebruiksstatus ?gebruiksstatus ;
            lto:licentievorm ?licentievorm ;
            lto:bijgewerktOp ?bijgewerktOp .
            OPTIONAL { ?tech lto:afkorting ?abbrevation . }
            OPTIONAL {
              ?tech lto:versiebeschrijving ?versie .
              OPTIONAL { ?versie lto:versienummer ?versienummer . }
              OPTIONAL { ?versie lto:versiedatum ?versiedatum . }
            }
    }
    '''
    result = sparql_query(sparql, timeout_seconds=_PRODUCT_LIST_QUERY_TIMEOUT_SECONDS)
    bindings = result.get('results', {}).get('bindings', [])
    return _map_legal_technology_results(bindings)

_GRAPH_URI = GRAPH_URI


def list_products():
    sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT DISTINCT ?product ?label WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        ?product a skos:Concept ;
                 skos:inScheme lto:BegrippenkaderProducten .
        OPTIONAL {{
          ?product skos:prefLabel ?prefLabel .
          FILTER(LANG(?prefLabel) = '' || LANGMATCHES(LANG(?prefLabel), 'nl'))
        }}
        OPTIONAL {{
          ?product rdfs:label ?rdfsLabel .
          FILTER(LANG(?rdfsLabel) = '' || LANGMATCHES(LANG(?rdfsLabel), 'nl'))
        }}
        BIND(COALESCE(STR(?prefLabel), STR(?rdfsLabel), '') AS ?label)
      }}
    }}
    ORDER BY LCASE(STR(?label)) LCASE(STR(?product))
    '''

    result = sparql_query(sparql)
    bindings = result.get('results', {}).get('bindings', [])
    products = []
    seen_iris = set()
    for binding in bindings:
        iri = binding.get('product', {}).get('value', '')
        if not iri or iri in seen_iris:
            continue
        seen_iris.add(iri)
        label = binding.get('label', {}).get('value', '').strip() or _extract_concept_identifier(iri)
        products.append(
            {
                'id': _stable_concept_identifier(iri),
                'iri': iri,
                'label': label,
            }
        )
    return products


def _find_product_by_id(product_id):
    token = str(product_id or '').strip().lower()
    if not token:
        return None

    for product in list_products():
        product_id_value = str(product.get('id', '')).strip().lower()
        product_iri = str(product.get('iri', '')).strip().lower()
        if product_id_value == token or product_iri == token:
            return product

        # Backward compatibility for previously exposed IDs without fingerprint suffix.
        legacy_id = _legacy_stable_concept_identifier(product.get('iri'))
        if legacy_id and legacy_id == ''.join(ch.lower() for ch in token if ch.isalnum()):
            return product

    return None


def get_product_traceability(product_id):
    product = _find_product_by_id(product_id)
    if not product:
        return None

    sparql = f'''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?predicate ?task ?taskLabel WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        VALUES ?predicate {{ lto:inputVoorTaak lto:uitvoerVanTaak }}
        <{product['iri']}> ?predicate ?task .
        OPTIONAL {{
          ?task skos:prefLabel ?taskPrefLabel .
          FILTER(LANG(?taskPrefLabel) = '' || LANGMATCHES(LANG(?taskPrefLabel), 'nl'))
        }}
        OPTIONAL {{
          ?task rdfs:label ?taskRdfsLabel .
          FILTER(LANG(?taskRdfsLabel) = '' || LANGMATCHES(LANG(?taskRdfsLabel), 'nl'))
        }}
        BIND(COALESCE(STR(?taskPrefLabel), STR(?taskRdfsLabel), '') AS ?taskLabel)
      }}
    }}
    ORDER BY ?predicate LCASE(STR(?taskLabel)) LCASE(STR(?task))
    '''

    result = sparql_query(sparql, timeout_seconds=_PRODUCT_TRACEABILITY_QUERY_TIMEOUT_SECONDS)
    bindings = result.get('results', {}).get('bindings', [])
    relations = {'input': [], 'output': []}
    seen = set()

    for binding in bindings:
        predicate_iri = binding.get('predicate', {}).get('value', '')
        task_iri = binding.get('task', {}).get('value', '')
        if not predicate_iri or not task_iri:
            continue

        relation_kind = None
        if predicate_iri == _PRODUCT_INPUT_PREDICATE_IRI:
            relation_kind = 'input'
        elif predicate_iri == _PRODUCT_OUTPUT_PREDICATE_IRI:
            relation_kind = 'output'
        if relation_kind is None:
            continue

        key = (relation_kind, task_iri)
        if key in seen:
            continue
        seen.add(key)

        task_label = binding.get('taskLabel', {}).get('value', '').strip() or _extract_concept_identifier(task_iri)
        relations[relation_kind].append(
            {
                'task_id': _stable_concept_identifier(task_iri),
                'task_iri': task_iri,
                'task_label': task_label,
                'predicate': predicate_iri,
                'relation_kind': relation_kind,
            }
        )

    for relation_kind in relations:
        relations[relation_kind].sort(key=lambda item: (item['task_label'].casefold(), item['task_id']))

    return {
        'product': product,
        'relations': relations,
    }


def _extract_technology_identifier(technology_iri):
    parsed_abbrev, parsed_version = _parse_tech_iri(technology_iri)
    if parsed_abbrev and parsed_version:
        return _build_api_id(parsed_abbrev, parsed_version)
    return _stable_concept_identifier(technology_iri)


def get_product_contribution_chain(product_id):
    traceability = get_product_traceability(product_id)
    if traceability is None:
        return None

    task_iris = []
    for relation_kind in ('input', 'output'):
        task_iris.extend(item.get('task_iri', '') for item in traceability['relations'].get(relation_kind, []))
    task_iris = [iri for iri in task_iris if iri]

    technology_by_task = {}
    if task_iris:
        values = ' '.join(f'<{iri}>' for iri in sorted(set(task_iris)))
        sparql = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        SELECT ?task ?tech ?techName ?sourceTitle ?sourceLocation ?sourceReference WHERE {{
          GRAPH <{_GRAPH_URI}> {{
            VALUES ?task {{ {values} }}
            VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
            ?tech a ?subtypeClass ;
                  lto:naam ?techName ;
                  lto:geschiktVoorTaak ?geschiktVoorTaakNode .
            ?geschiktVoorTaakNode lto:taaktype ?task .

            OPTIONAL {{
              ?tech lto:bronverwijzing ?bron .
              OPTIONAL {{ ?bron lto:titel ?sourceTitle . }}
              OPTIONAL {{ ?bron lto:locatie ?sourceLocation . }}
              OPTIONAL {{ ?bron lto:verwijzing ?sourceReference . }}
            }}
          }}
        }}
        ORDER BY ?task LCASE(STR(?techName)) LCASE(STR(?tech))
        '''

        result = sparql_query(sparql, timeout_seconds=_PRODUCT_CONTRIBUTION_CHAIN_QUERY_TIMEOUT_SECONDS)
        bindings = result.get('results', {}).get('bindings', [])

        seen_technology = set()
        evidence_seen = set()

        for binding in bindings:
            task_iri = binding.get('task', {}).get('value', '')
            tech_iri = binding.get('tech', {}).get('value', '')
            if not task_iri or not tech_iri:
                continue

            technology_list = technology_by_task.setdefault(task_iri, [])
            technology_key = (task_iri, tech_iri)
            if technology_key not in seen_technology:
                seen_technology.add(technology_key)
                technology_list.append(
                    {
                        'id': _extract_technology_identifier(tech_iri),
                        'iri': tech_iri,
                        'label': binding.get('techName', {}).get('value', '').strip() or _extract_concept_identifier(tech_iri),
                        'evidence_links': [],
                    }
                )

            location = binding.get('sourceLocation', {}).get('value', '').strip()
            title = binding.get('sourceTitle', {}).get('value', '').strip()
            reference = binding.get('sourceReference', {}).get('value', '').strip()
            if not location and not title and not reference:
                continue

            node = next((item for item in technology_list if item['iri'] == tech_iri), None)
            if node is None:
                continue

            evidence_key = (task_iri, tech_iri, location, title, reference)
            if evidence_key in evidence_seen:
                continue
            evidence_seen.add(evidence_key)
            node['evidence_links'].append(
                {
                    'title': title or None,
                    'location': location or None,
                    'reference': reference or None,
                }
            )

    chains = {'input': [], 'output': []}
    partial_data = False

    for relation_kind in ('input', 'output'):
        for task_relation in traceability['relations'].get(relation_kind, []):
            task_iri = task_relation.get('task_iri', '')
            technologies = technology_by_task.get(task_iri, [])
            missing_node = len(technologies) == 0
            if missing_node:
                partial_data = True

            chains[relation_kind].append(
                {
                    'task_id': task_relation.get('task_id', ''),
                    'task_iri': task_iri,
                    'task_label': task_relation.get('task_label', ''),
                    'predicate': task_relation.get('predicate', ''),
                    'relation_kind': task_relation.get('relation_kind', relation_kind),
                    'missing_node': missing_node,
                    'missing_reason': 'No contributing technologies linked to this task.' if missing_node else None,
                    'technologies': sorted(technologies, key=lambda item: (item['label'].casefold(), item['id'])),
                }
            )

    return {
        'product': traceability['product'],
        'chains': chains,
        'partial_data': partial_data,
    }


def _collect_related_organisation_iris(tech):
    if not tech:
        return set()
    values = set()
    for key in ('beheerder', 'leverancier'):
        value = tech.get(key)
        if value:
            values.add(value)
    return values


def _sync_full_named_graph_export():
    content = export_named_graph_turtle(_GRAPH_URI)
    path = write_named_graph_export(content)
    return path, content


def _sync_organisation_bundles(organisation_iris):
    from .organisation_service import export_organisation_turtle

    written_paths = []
    for iri in sorted(set(organisation_iris or [])):
        turtle = export_organisation_turtle(iri)
        if turtle is None:
            path = organisation_bundle_path(iri)
            if path.exists():
                path.unlink()
            continue
        written_paths.append(write_organisation_bundle(iri, turtle))
    return written_paths


def _sync_exports_after_legal_technology_change(current_id=None, deleted_id=None, organisation_iris=None):
    _compact_fragmented_blank_nodes()
    _normalize_bronverwijzing_page_anyuri()
    _normalize_documentatie_markdown_literals()
    aggregate_path, _ = _sync_full_named_graph_export()
    bundle_path = None
    if deleted_id:
        remove_legal_technology_bundle(deleted_id)
    if current_id:
        turtle = export_legal_technology_turtle(current_id)
        if turtle is not None:
            bundle_path = write_legal_technology_bundle(current_id, turtle)
    organisation_paths = _sync_organisation_bundles(organisation_iris)
    return {
        'named_graph_path': str(aggregate_path),
        'legal_technology_bundle_path': str(bundle_path) if bundle_path else None,
        'organisation_bundle_paths': [str(path) for path in organisation_paths],
    }


def _count_legacy_iri_nodes_for_property(predicate):
        sparql = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        SELECT (COUNT(DISTINCT ?child) AS ?count) WHERE {{
            GRAPH <{_GRAPH_URI}> {{
                VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
                ?tech a ?subtypeClass ;
                            lto:{predicate} ?child .
                FILTER(isIRI(?child))
                FILTER(STRSTARTS(STR(?child), CONCAT(STR(?tech), '/')))
            }}
        }}
        '''
        try:
                result = sparql_query(sparql)
                bindings = result.get('results', {}).get('bindings', [])
                return int(bindings[0].get('count', {}).get('value', 0)) if bindings else 0
        except Exception as e:
                print(f'[DEBUG] Exception in _count_legacy_iri_nodes_for_property({predicate}):', e)
                return 0


def _migrate_property_iri_nodes_to_blank_nodes(predicate):
        """Replace legacy IRI child nodes with blank nodes and move child triples."""
        update = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        DELETE {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:{predicate} ?oldNode .
                ?oldNode ?cp ?co .
            }}
        }}
        INSERT {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:{predicate} ?newNode .
                ?newNode ?cp ?co .
            }}
        }}
        WHERE {{
            GRAPH <{_GRAPH_URI}> {{
                {{
                    SELECT DISTINCT ?tech ?oldNode ?newNode WHERE {{
                        VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
                        ?tech a ?subtypeClass ;
                                    lto:{predicate} ?oldNode .
                        FILTER(isIRI(?oldNode))
                        FILTER(STRSTARTS(STR(?oldNode), CONCAT(STR(?tech), '/')))
                        BIND(BNODE() AS ?newNode)
                    }}
                }}
                ?oldNode ?cp ?co .
            }}
        }}
        '''
        sparql_update(update, graph_uri=_GRAPH_URI)


def _compact_fragmented_blank_nodes():
    """Merge fragmented blank nodes produced by legacy migrations into one logical node."""
    # versiebeschrijving has maxCount 1 on JuridischeTechnologie: merge multiple blank nodes per tech.
    merge_versie = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        DELETE {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:versiebeschrijving ?old .
                ?old ?p ?o .
            }}
        }}
        INSERT {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:versiebeschrijving ?merged .
                ?merged ?p ?o .
            }}
        }}
        WHERE {{
            GRAPH <{_GRAPH_URI}> {{
                {{
                    SELECT ?tech (BNODE() AS ?merged) WHERE {{
                        VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
                        ?tech a ?subtypeClass ; lto:versiebeschrijving ?node .
                    }}
                    GROUP BY ?tech
                    HAVING(COUNT(DISTINCT ?node) > 1)
                }}
                ?tech lto:versiebeschrijving ?old .
                ?old ?p ?o .
            }}
        }}
    '''

    # documentatie has maxCount 1 on JuridischeTechnologie: merge multiple blank nodes per tech.
    merge_documentatie = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        DELETE {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:documentatie ?old .
                ?old ?p ?o .
            }}
        }}
        INSERT {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:documentatie ?merged .
                ?merged ?p ?o .
            }}
        }}
        WHERE {{
            GRAPH <{_GRAPH_URI}> {{
                {{
                    SELECT ?tech (BNODE() AS ?merged) WHERE {{
                        VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
                        ?tech a ?subtypeClass ; lto:documentatie ?node .
                    }}
                    GROUP BY ?tech
                    HAVING(COUNT(DISTINCT ?node) > 1)
                }}
                ?tech lto:documentatie ?old .
                ?old ?p ?o .
            }}
        }}
    '''

    # ondersteuningVoor can be multi-valued. Only merge obvious split cases
    # where a technology has multiple nodes but at most one distinct beschouwingsniveau/modelsoort.
    merge_ondersteuning = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        DELETE {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:ondersteuningVoor ?old .
                ?old ?p ?o .
            }}
        }}
        INSERT {{
            GRAPH <{_GRAPH_URI}> {{
                ?tech lto:ondersteuningVoor ?merged .
                ?merged ?p ?o .
            }}
        }}
        WHERE {{
            GRAPH <{_GRAPH_URI}> {{
                {{
                    SELECT ?tech (BNODE() AS ?merged) WHERE {{
                        VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
                        ?tech a ?subtypeClass ; lto:ondersteuningVoor ?node .
                        OPTIONAL {{ ?node lto:beschouwingsniveau ?besch . }}
                        OPTIONAL {{ ?node lto:modelsoort ?model . }}
                    }}
                    GROUP BY ?tech
                    HAVING(
                        COUNT(DISTINCT ?node) > 1 &&
                        COUNT(DISTINCT ?besch) <= 1 &&
                        COUNT(DISTINCT ?model) <= 1
                    )
                }}
                ?tech lto:ondersteuningVoor ?old .
                ?old ?p ?o .
                FILTER(
                    ?p = rdf:type ||
                    ?p = lto:beschouwingsniveau ||
                    ?p = lto:modelsoort
                )
            }}
        }}
    '''

    sparql_update(merge_versie, graph_uri=_GRAPH_URI)
    sparql_update(merge_documentatie, graph_uri=_GRAPH_URI)
    sparql_update(merge_ondersteuning, graph_uri=_GRAPH_URI)


def _fix_typo_taaktype_iris():
    """Replace the historically misspelled ltt:GeautomatitseerdeRegeluitvoering with the correct IRI."""
    typo_iri = 'http://bp4mc2.org/ltt#GeautomatitseerdeRegeluitvoering'
    correct_iri = 'http://bp4mc2.org/ltt#GeautomatiseerdeRegeluitvoering'
    update = f'''
    DELETE {{
      GRAPH <{_GRAPH_URI}> {{ ?s <http://bp4mc2.org/lto#taaktype> <{typo_iri}> . }}
    }}
    INSERT {{
      GRAPH <{_GRAPH_URI}> {{ ?s <http://bp4mc2.org/lto#taaktype> <{correct_iri}> . }}
    }}
    WHERE {{
      GRAPH <{_GRAPH_URI}> {{ ?s <http://bp4mc2.org/lto#taaktype> <{typo_iri}> . }}
    }}
    '''
    sparql_update(update, graph_uri=_GRAPH_URI)
    # Return count of affected triples by checking the correct IRI now exists
    sparql = f'''
    SELECT (COUNT(?s) AS ?count) WHERE {{
      GRAPH <{_GRAPH_URI}> {{ ?s <http://bp4mc2.org/lto#taaktype> <{correct_iri}> . }}
    }}
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        return int(bindings[0].get('count', {}).get('value', 0)) if bindings else 0
    except Exception:
        return 0


def _normalize_bronverwijzing_page_anyuri():
        """Ensure foaf:page on lto:Bronverwijzing is stored as xsd:anyURI literal."""
        update = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        DELETE {{
            GRAPH <{_GRAPH_URI}> {{ ?bron foaf:page ?value . }}
        }}
        INSERT {{
            GRAPH <{_GRAPH_URI}> {{ ?bron foaf:page ?anyuri . }}
        }}
        WHERE {{
            GRAPH <{_GRAPH_URI}> {{
                ?bron a lto:Bronverwijzing ;
                            foaf:page ?value .
                FILTER(isLiteral(?value))
                FILTER(DATATYPE(?value) != xsd:anyURI)
                FILTER(REGEX(STR(?value), "^[A-Za-z][A-Za-z0-9+.-]*://"))
                BIND(STRDT(STR(?value), xsd:anyURI) AS ?anyuri)
            }}
        }}
        '''
        sparql_update(update, graph_uri=_GRAPH_URI)


def _normalize_documentatie_markdown_literals():
    """Ensure markdown-valued lto:Documentatie fields are stored as xsd:markdown literals."""
    for predicate in [
        'beoogdGebruik',
        'toegevoegdeWaarde',
        'onderdelen',
        'ontwikkelingEnBeheer',
    ]:
        update = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        DELETE {{
            GRAPH <{_GRAPH_URI}> {{ ?doc lto:{predicate} ?value . }}
        }}
        INSERT {{
            GRAPH <{_GRAPH_URI}> {{ ?doc lto:{predicate} ?markdown . }}
        }}
        WHERE {{
            GRAPH <{_GRAPH_URI}> {{
                ?doc lto:{predicate} ?value .
                FILTER(isLiteral(?value))
                FILTER(DATATYPE(?value) != xsd:markdown)
                BIND(STRDT(STR(?value), xsd:markdown) AS ?markdown)
            }}
        }}
        '''
        sparql_update(update, graph_uri=_GRAPH_URI)


def migrate_legal_technology_blank_nodes(sync_exports=True):
    """
    Migrate legacy IRI nodes to blank nodes for nodeKind-constrained properties:
    - lto:documentatie
    - lto:ondersteuningVoor
    - lto:versiebeschrijving
    Also fixes the historical typo IRI for GeautomatiseerdeRegeluitvoering.
    """
    predicates = ['documentatie', 'ondersteuningVoor', 'versiebeschrijving']
    before = {predicate: _count_legacy_iri_nodes_for_property(predicate) for predicate in predicates}

    _migrate_property_iri_nodes_to_blank_nodes('documentatie')
    _migrate_property_iri_nodes_to_blank_nodes('ondersteuningVoor')
    _migrate_property_iri_nodes_to_blank_nodes('versiebeschrijving')
    _compact_fragmented_blank_nodes()
    taaktype_fixed = _fix_typo_taaktype_iris()

    after = {predicate: _count_legacy_iri_nodes_for_property(predicate) for predicate in predicates}
    migrated = {predicate: max(before[predicate] - after[predicate], 0) for predicate in predicates}

    exports_result = None
    if sync_exports:
        exports_result = sync_named_graph_exports()

    return {
        'before': before,
        'after': after,
        'migrated': migrated,
        'taaktype_iri_fixed': taaktype_fixed,
        'sync_exports': bool(sync_exports),
        'exports': exports_result,
    }


def sync_named_graph_exports():
    from .organisation_service import export_organisation_turtle, list_organisations

    _compact_fragmented_blank_nodes()
    _normalize_bronverwijzing_page_anyuri()
    _normalize_documentatie_markdown_literals()

    aggregate_path, _ = _sync_full_named_graph_export()
    tech_ids = [item.get('id') for item in search_legal_technologies('') if item.get('id')]
    organisation_iris = [item.get('iri') for item in list_organisations() if item.get('iri')]

    written_tech_filenames = []
    for tech_id in tech_ids:
        turtle = export_legal_technology_turtle(tech_id)
        if turtle is None:
            continue
        path = write_legal_technology_bundle(tech_id, turtle)
        written_tech_filenames.append(path.name)

    written_org_filenames = []
    for iri in organisation_iris:
        turtle = export_organisation_turtle(iri)
        if turtle is None:
            continue
        path = write_organisation_bundle(iri, turtle)
        written_org_filenames.append(path.name)

    remove_stale_bundles(LEGAL_TECHNOLOGY_BUNDLES_DIR, written_tech_filenames)
    remove_stale_bundles(LEGAL_TECHNOLOGY_ORGANISATION_BUNDLES_DIR, written_org_filenames)

    return {
        'named_graph_path': str(aggregate_path),
        'named_graph_download': str(ALL_LEGAL_TECHNOLOGIES_PATH),
        'legal_technology_bundle_dir': str(LEGAL_TECHNOLOGY_BUNDLES_DIR),
        'legal_technology_bundles': len(written_tech_filenames),
        'organisation_bundle_dir': str(LEGAL_TECHNOLOGY_ORGANISATION_BUNDLES_DIR),
        'organisation_bundles': len(written_org_filenames),
    }

def search_legal_technologies(query):
    # Search legal technologies by naam or omschrijving
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?tech ?subtypeClass ?abbrevation ?versienummer ?versiedatum ?naam ?omschrijving ?gebruiksstatus ?licentievorm ?bijgewerktOp WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
        ?tech a ?subtypeClass ;
              lto:naam ?naam ;
              lto:omschrijving ?omschrijving ;
              lto:gebruiksstatus ?gebruiksstatus ;
              lto:licentievorm ?licentievorm ;
              lto:bijgewerktOp ?bijgewerktOp .
        OPTIONAL {{ ?tech lto:afkorting ?abbrevation . }}
        OPTIONAL {{
          ?tech lto:versiebeschrijving ?versie .
          OPTIONAL {{ ?versie lto:versienummer ?versienummer . }}
          OPTIONAL {{ ?versie lto:versiedatum ?versiedatum . }}
        }}
      }}
      FILTER (CONTAINS(LCASE(STR(?naam)), LCASE("""{query}""")) || CONTAINS(LCASE(STR(?omschrijving)), LCASE("""{query}""")))
    }}
    '''
    result = sparql_query(sparql)
    bindings = result.get('results', {}).get('bindings', [])
    return _map_legal_technology_results(bindings)

def add_legal_technology(data, sync_exports=True):
    from .graphdb_client import sparql_update
    import uuid
    graph_uri = "https://data.bp4mc2.org/id/lto"
    raw_abbrevation = data.get("abbrevation") or data.get("naam", "")
    raw_versienummer = data.get("versienummer") or data.get("version") or ''
    abbrevation = _normalize_abbrevation(raw_abbrevation)
    versienummer = _normalize_version(raw_versienummer)
    versiedatum = _normalize_iso_date(data.get("versiedatum"), "versiedatum")
    bijgewerkt_op = _normalize_iso_date(data.get("bijgewerkt_op"), "bijgewerkt_op")
    if not abbrevation:
        raise ValueError("abbrevation is required to build legal technology IRI")
    tech_uri = _build_tech_iri(abbrevation, versienummer)
    subtype = _normalize_subtype(data.get("subtype"))
    subtype_class_iri = _SUBTYPE_CLASS_MAP[subtype]

    # Always initialize triple lists
    ondersteuning_triples = []
    geschikt_triples = []
    # Map enumeration labels to SKOS URIs
    enum_map = {
            'gebruiksstatus': {
                'In gebruik': '<http://bp4mc2.org/lt#InGebruik>',
                'Voorstel': '<http://bp4mc2.org/lt#Voorstel>',
                'Work in progress': '<http://bp4mc2.org/lt#WorkInProgress>'
            },
            'licentievorm': {
                'Volledig open': '<http://bp4mc2.org/lt#VolledigOpen>',
                'Open onder voorwaarden': '<http://bp4mc2.org/lt#OpenOnderVoorwaarden>',
                'Gesloten': '<http://bp4mc2.org/lt#Gesloten>'
            },
            'geboden_functionaliteit': {
                'Geautomatiseerd beslissen': '<http://bp4mc2.org/lt#GeautomatiseerdBeslissen>',
                'Compliance ondersteuning': '<http://bp4mc2.org/lt#ComplianceOndersteuning>',
                'Compliance-ondersteuning': '<http://bp4mc2.org/lt#ComplianceOndersteuning>',
                'Contract: geautomatiseerde contractgeneratie': '<http://bp4mc2.org/lt#ContractAutomatischAanmaken>',
                'Contract: analyse/redactie/beoordeling': '<http://bp4mc2.org/lt#ContractAnalyticsConceptReview>',
                'Juridisch expertsysteem': '<http://bp4mc2.org/lt#JuridischExpertSysteem>',
                'Wetgeving: wetgevingsredactie': '<http://bp4mc2.org/lt#WetgevingConceptualisering>',
                'Wetgeving: uitvoering van wet- en regelgeving': '<http://bp4mc2.org/lt#WetgevingUitvoering>',
                'Wetgeving: modellering van wet- en regelgeving': '<http://bp4mc2.org/lt#WetgevingRepresentatie>',
                'Procespraktijk: procesanalyse': '<http://bp4mc2.org/lt#LitigatieAnalytics>',
                'Procespraktijk: opstellen van processtukken': '<http://bp4mc2.org/lt#LitigatieConceptualisering>',
                'Procespraktijk: voorspelling van rechterlijke uitspraak': '<http://bp4mc2.org/lt#LitigatiePredictieVoorsluiting>',
                'Zoeken: jurisprudentie': '<http://bp4mc2.org/lt#ZoekenRechtspraak>',
                'Zoeken: wet- en regelgeving': '<http://bp4mc2.org/lt#ZoekenWetgeving>'
            },
            'beoogde_gebruikers': {
                'Burgers en bedrijven': '<http://bp4mc2.org/lt#BurgersEnBedrijven>',
                'Rechtbanken': '<http://bp4mc2.org/lt#Rechtbanken>',
                'Opsporingsinstanties': '<http://bp4mc2.org/lt#Opsporingsinstanties>',
                'Juristen': '<http://bp4mc2.org/lt#Juristen>',
                'Beleidsmedewerkers': '<http://bp4mc2.org/lt#Beleidsmedewerkers>',
                'Wetgevers': '<http://bp4mc2.org/lt#Wetgevers>',
                'Advocaten': '<http://bp4mc2.org/lt#Advocaten>',
                'Uitvoeringsorganisaties': '<http://bp4mc2.org/lt#Uitvoeringsorganisaties>',
                'Commerciële organisaties': '<http://bp4mc2.org/lt#CommercieleOrganisaties>',
                'Regelanalist': '<http://bp4mc2.org/lt#Regelanalist>',
                'Softwareontwikkelaars': '<http://bp4mc2.org/lt#SoftwareOntwikkelaars>'
            },
            'normstatus': {
                'Idee': '<http://bp4mc2.org/lt#Idee>',
                'Voorstel': '<http://bp4mc2.org/lt#Voorstel>',
                'Best practice': '<http://bp4mc2.org/lt#BestPractice>',
                'Industrie': '<http://bp4mc2.org/lt#Industrie>',
                'Wettelijk': '<http://bp4mc2.org/lt#Wettelijk>'
            },
            'type_technologie': {
                'Markup (annotatie)': '<http://bp4mc2.org/lt#MarkupAnnotatie>',
                'Markup (publicatie)': '<http://bp4mc2.org/lt#MarkupPublicatie>',
                'DSL': '<http://bp4mc2.org/lt#DSL>',
                'Machine learning': '<http://bp4mc2.org/lt#MachineLearning>',
                'Regelexecutie': '<http://bp4mc2.org/lt#Regelexecutie>'
            },
            'taaktype': {
                'Opstellen regeltekst': '<http://bp4mc2.org/ltt#OpstellenRegeltekst>',
                'Opdracht orientering': '<http://bp4mc2.org/ltt#Opdrachtorientering>',
                'Verzamelen bronmateriaal': '<http://bp4mc2.org/ltt#VerzamelenBronmateriaal>',
                'Analyseren regeltekst': '<http://bp4mc2.org/ltt#AnalyserenRegeltekst>',
                'Interpreteren en expliciteren': '<http://bp4mc2.org/ltt#InterpreterenEnExpliciteren>',
                'Begrip definiëren': '<http://bp4mc2.org/ltt#BegripDefinieren>',
                'Specificeren gegevens(behoefte)': '<http://bp4mc2.org/ltt#SpecificerenGegevensbehoefte>',
                'Specificeren regels': '<http://bp4mc2.org/ltt#SpecificerenRegels>',
                'Specificeren processen': '<http://bp4mc2.org/ltt#SpecificerenProcessen>',
                'Valideren specificaties': '<http://bp4mc2.org/ltt#ValiderenSpecificaties>',
                'Geautomatiseerde regeluitvoering': '<http://bp4mc2.org/ltt#GeautomatiseerdeRegeluitvoering>',
                'Beslisondersteuning': '<http://bp4mc2.org/ltt#Beslisondersteuning>',
                'Evaluatie': '<http://bp4mc2.org/ltt#Evaluatie>'
            },
            'technologietype': {
                'DSL': '<http://bp4mc2.org/lt#DSL>',
                'Markup (annotatie)': '<http://bp4mc2.org/lt#MarkupAnnotatie>',
                'Markup (publicatie)': '<http://bp4mc2.org/lt#MarkupPublicatie>',
                'Machine learning': '<http://bp4mc2.org/lt#MachineLearning>',
                'Regelexecutie': '<http://bp4mc2.org/lt#Regelexecutie>'
            },
            'beschouwingsniveau': {
                'Tekstueel': '<http://bp4mc2.org/lto#Tekstueel>',
                'Semantisch': '<http://bp4mc2.org/lto#Semantisch>',
                'Ontologisch': '<http://bp4mc2.org/lto#Ontologisch>',
                'Logisch': '<http://bp4mc2.org/lto#Logisch>',
                'Technisch': '<http://bp4mc2.org/lto#Technisch>'
            },
            'modelsoort': {
                'Descriptief': '<http://bp4mc2.org/lto#Descriptief>',
                'Normatief': '<http://bp4mc2.org/lto#Normatief>'
            }
        }
    gebruiksstatus_val = data["gebruiksstatus"]
    licentievorm_val = data["licentievorm"]
    versie_bnode = f"_:versie_{uuid.uuid4().hex}"
    versie_triples = [
        f'{versie_bnode} a <http://bp4mc2.org/lto#Versiebeschrijving> .',
        f'{versie_bnode} <http://bp4mc2.org/lto#versienummer> "{versienummer}" .',
    ]
    if versiedatum:
        versie_triples.append(f'{versie_bnode} <http://bp4mc2.org/lto#versiedatum> "{versiedatum}"^^<http://www.w3.org/2001/XMLSchema#date> .')
    triples = [
        f'<{tech_uri}> a <{subtype_class_iri}> ;',
        f'  <http://bp4mc2.org/lto#versiebeschrijving> {versie_bnode} ;',
        f'  <http://bp4mc2.org/lto#naam> "{data["naam"]}" ;',
        f'  rdfs:label "{data["naam"]}"@nl ;',
        f'  <http://bp4mc2.org/lto#omschrijving> "{data["omschrijving"]}" ;',
        f'  <http://bp4mc2.org/lto#gebruiksstatus> {_enum_lookup(enum_map["gebruiksstatus"], gebruiksstatus_val, require_iri=True, field_name="gebruiksstatus")} ;',
        f'  <http://bp4mc2.org/lto#licentievorm> {_enum_lookup(enum_map["licentievorm"], licentievorm_val, require_iri=True, field_name="licentievorm")} ;',
        f'  <http://bp4mc2.org/lto#bijgewerktOp> "{bijgewerkt_op}"^^<http://www.w3.org/2001/XMLSchema#date> ;'
    ]
    # Lists
    for val in data.get("geboden_functionaliteit", []):
        clean_val = str(val or '').strip()
        if not clean_val:
            continue
        triples.append(f'  <http://bp4mc2.org/lto#gebodenFunctionaliteit> {_enum_lookup(enum_map["geboden_functionaliteit"], clean_val, require_iri=True, field_name="geboden_functionaliteit")} ;')
    for val in data.get("beoogde_gebruikers", []):
        clean_val = str(val or '').strip()
        if not clean_val:
            continue
        triples.append(f'  <http://bp4mc2.org/lto#beoogdeGebruikers> {_enum_lookup(enum_map["beoogde_gebruikers"], clean_val, require_iri=True, field_name="beoogde_gebruikers")} ;')
    for val in data.get("type_technologie", []):
        if val:
            triples.append(f'  <http://bp4mc2.org/lto#typeTechnologie> {_enum_lookup(enum_map["type_technologie"], val, require_iri=True, field_name="type_technologie")} ;')
    # Nested objects as blank nodes where required by SHACL nodeKind.
    # ondersteuning_voor
    ondersteuning_items = []
    for ov in data.get("ondersteuning_voor", []):
        besch = str((ov or {}).get("beschouwingsniveau", "")).strip()
        mod = str((ov or {}).get("modelsoort", "")).strip()
        if not besch and not mod:
            continue
        ondersteuning_items.append({"beschouwingsniveau": besch, "modelsoort": mod})

    ondersteuning_nodes = []
    for _ in ondersteuning_items:
        ov_node = f"_:ondersteuning_{uuid.uuid4().hex}"
        ondersteuning_nodes.append(ov_node)
        triples.append(f'  <http://bp4mc2.org/lto#ondersteuningVoor> {ov_node} ;')
    # geschikt_voor_taak
    geschikt_items = []
    seen_geschikt = set()
    for gt in data.get("geschikt_voor_taak", []):
        taaktype = str((gt or {}).get("taaktype", "")).strip()
        omschrijving = str((gt or {}).get("omschrijving", "")).strip()
        if not taaktype and not omschrijving:
            continue
        key = (omschrijving, taaktype)
        if key in seen_geschikt:
            continue
        seen_geschikt.add(key)
        geschikt_items.append({"omschrijving": omschrijving, "taaktype": taaktype})

    geschikt_uris = []
    for _ in geschikt_items:
        gt_id = str(uuid.uuid4())
        gt_uri = _get_part_iri(tech_uri, "taakinvulling", gt_id)
        geschikt_uris.append(gt_uri)
        triples.append(f'  <http://bp4mc2.org/lto#geschiktVoorTaak> <{gt_uri}> ;')
    # Documentatie (blank node)
    doc = data.get("documentatie")
    doc_node = None
    if doc:
        doc_node = f"_:documentatie_{uuid.uuid4().hex}"
        triples.append(f'  <http://bp4mc2.org/lto#documentatie> {doc_node} ;')
    # Bronverwijzing (array of URIs)
    bron_uris = []
    for bron in data.get("bronverwijzing", []):
        bron_id = str(uuid.uuid4())
        bron_uri = _get_part_iri(tech_uri, "bronverwijzing", bron_id)
        bron_uris.append(bron_uri)
        triples.append(f'  <http://bp4mc2.org/lto#bron> <{bron_uri}> ;')
    # Optional fields
    if data.get("normstatus"):
            triples.append(f'  <http://bp4mc2.org/lto#normstatus> {_enum_lookup(enum_map["normstatus"], data["normstatus"], require_iri=True, field_name="normstatus")} ;')
    # beheerder/leverancier as reusable Organisatie IRIs
    beheerder_iri = _normalize_org_iri(data.get("beheerder"))
    if beheerder_iri:
        triples.append(f'  <http://bp4mc2.org/lto#beheerder> <{beheerder_iri}> ;')

    leverancier_iri = _normalize_org_iri(data.get("leverancier"))
    if leverancier_iri:
        triples.append(f'  <http://bp4mc2.org/lto#leverancier> <{leverancier_iri}> ;')
    # Remove last semicolon, add period
    if triples[-1].endswith(';'):
        triples[-1] = triples[-1][:-1] + '.'

    # Add triples for ondersteuning_voor
    ondersteuning_triples = []
    for i, ov in enumerate(ondersteuning_items):
        ov_node = ondersteuning_nodes[i]
        besch = ov.get("beschouwingsniveau", "")
        mod = ov.get("modelsoort", "")
        ondersteuning_triples.append(f'{ov_node} a <http://bp4mc2.org/lto#Ondersteuningsvorm> .')
        ondersteuning_triples.append(f'{ov_node} <http://bp4mc2.org/lto#beschouwingsniveau> {_enum_lookup(enum_map["beschouwingsniveau"], besch, require_iri=True, field_name="beschouwingsniveau")} .')
        ondersteuning_triples.append(f'{ov_node} <http://bp4mc2.org/lto#modelsoort> {_enum_lookup(enum_map["modelsoort"], mod, require_iri=True, field_name="modelsoort")} .')
    # Add triples for geschikt_voor_taak
    geschikt_triples = []
    for i, gt in enumerate(geschikt_items):
        gt_uri = geschikt_uris[i]
        taaktype = gt.get("taaktype", "")
        omschrijving = gt.get("omschrijving", "")
        geschikt_triples.append(f'<{gt_uri}> a <http://bp4mc2.org/lto#Taakinvulling> .')
        geschikt_triples.append(f'<{gt_uri}> <http://bp4mc2.org/lto#omschrijving> "{omschrijving}" .')
        geschikt_triples.append(f'<{gt_uri}> <http://bp4mc2.org/lto#taaktype> {_enum_lookup(enum_map["taaktype"], taaktype, require_iri=True, field_name="taaktype")} .')
    # Add triples for documentatie
    doc_triples = []
    if doc and doc_node:
        doc_triples.append(f'{doc_node} a <http://bp4mc2.org/lto#Documentatie> .')
        if doc.get("beoogdGebruik"):
            doc_triples.append(f'{doc_node} <http://bp4mc2.org/lto#beoogdGebruik> "{doc.get("beoogdGebruik")}"^^<http://www.w3.org/2001/XMLSchema#markdown> .')
        if doc.get("toegevoegdeWaarde"):
            doc_triples.append(f'{doc_node} <http://bp4mc2.org/lto#toegevoegdeWaarde> "{doc.get("toegevoegdeWaarde")}"^^<http://www.w3.org/2001/XMLSchema#markdown> .')
        if doc.get("onderdelen"):
            doc_triples.append(f'{doc_node} <http://bp4mc2.org/lto#onderdelen> "{doc.get("onderdelen")}"^^<http://www.w3.org/2001/XMLSchema#markdown> .')
        if doc.get("ontwikkelingEnBeheer"):
            doc_triples.append(f'{doc_node} <http://bp4mc2.org/lto#ontwikkelingEnBeheer> "{doc.get("ontwikkelingEnBeheer")}"^^<http://www.w3.org/2001/XMLSchema#markdown> .')
    # Add triples for bronverwijzing
    bron_triples = []
    for i, bron in enumerate(data.get("bronverwijzing", [])):
        bron_uri = bron_uris[i]
        bron_triples.append(f'<{bron_uri}> a <http://bp4mc2.org/lto#Bronverwijzing> .')
        if bron.get("titel"):
            bron_triples.append(f'<{bron_uri}> <http://purl.org/dc/terms/title> "{bron.get("titel")}" .')
        if bron.get("locatie"):
            bron_triples.append(f'<{bron_uri}> <http://xmlns.com/foaf/0.1/page> "{bron.get("locatie")}"^^<http://www.w3.org/2001/XMLSchema#anyURI> .')
        if bron.get("verwijzing"):
            bron_triples.append(f'<{bron_uri}> <http://purl.org/dc/terms/bibliographicCitation> "{bron.get("verwijzing")}" .')
    insert = f"""
    INSERT DATA {{ GRAPH <{graph_uri}> {{
      {'\n      '.join(triples)}
      {'\n      '.join(versie_triples)}
      {'\n      '.join(doc_triples)}
      {'\n      '.join(bron_triples)}
      {'\n      '.join(ondersteuning_triples)}
      {'\n      '.join(geschikt_triples)}
    }} }}
    """
    print("\n==== SPARQL INSERT DUMP ====")
    print(insert)
    print("==== END DUMP ====")
    sparql_update(insert, graph_uri=graph_uri)
    # Return the created object (simulate retrieval)
    result = data.copy()
    result['abbrevation'] = abbrevation
    result['versienummer'] = versienummer
    result['versiedatum'] = versiedatum
    result['bijgewerkt_op'] = bijgewerkt_op
    result['subtype'] = subtype
    result['id'] = _build_api_id(abbrevation, versienummer)
    if sync_exports:
        _sync_exports_after_legal_technology_change(
            current_id=result['id'],
            organisation_iris={beheerder_iri, leverancier_iri} - {None},
        )
    return result

def _get_versiebeschrijving(tech_iri: str) -> dict:
    """Get the versiebeschrijving (versienummer + versiedatum) for a legal technology."""
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?versienummer ?versiedatum WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        <{tech_iri}> lto:versiebeschrijving ?versie .
        OPTIONAL {{ ?versie lto:versienummer ?versienummer . }}
        OPTIONAL {{ ?versie lto:versiedatum ?versiedatum . }}
      }}
    }}
    LIMIT 1
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        if not bindings:
            return {'versienummer': '', 'versiedatum': ''}
        b = bindings[0]
        return {
            'versienummer': b.get('versienummer', {}).get('value', ''),
            'versiedatum': b.get('versiedatum', {}).get('value', ''),
        }
    except Exception as e:
        print(f'[DEBUG] Exception in _get_versiebeschrijving:', e)
        return {'versienummer': '', 'versiedatum': ''}


def _get_enumeration_labels(tech_iri: str, predicate: str, prefix: str = "lto") -> list:
    """
    Helper to get enumeration labels for a specific technology and predicate.
    Uses skos:prefLabel for better SKOS concept handling.
    """
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT DISTINCT ?concept WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        <{tech_iri}> {prefix}:{predicate} ?concept .
      }}
    }}
    ORDER BY ?concept
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        labels = []
        for b in bindings:
            val = _get_concept_label(b.get('concept', {}).get('value', ''))
            if val and val not in labels:  # Avoid duplicates
                labels.append(val)
        return labels
    except Exception as e:
        print(f"[DEBUG] Exception in _get_enumeration_labels for {predicate}:", e)
        return []


def get_legal_technology(id):
    # Retrieve a single legal technology by id
    tech_iri = _resolve_tech_iri_from_id(id)
    sparql = rf'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    PREFIX dc: <http://purl.org/dc/terms/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        SELECT ?tech ?subtypeClass ?abbrevation ?versienummer ?versiedatum ?naam ?omschrijving ?gebruiksstatus ?licentievorm ?bijgewerktOp ?normstatus
           (GROUP_CONCAT(DISTINCT CONCAT(COALESCE(?beoogdGebruik, ''), '||', COALESCE(?toegevoegdeWaarde, ''), '||', COALESCE(?onderdelen, ''), '||', COALESCE(?ontwikkelingEnBeheer, '')) ; SEPARATOR='@@') AS ?documentatie)
           (GROUP_CONCAT(DISTINCT CONCAT(COALESCE(?bron_titel, ''), '||', COALESCE(?bron_locatie, ''), '||', COALESCE(?bron_verwijzing, '')) ; SEPARATOR='@@') AS ?bronverwijzing)
            (GROUP_CONCAT(DISTINCT CONCAT(COALESCE(STR(?beschouwingsniveau), ''), '||', COALESCE(STR(?modelsoort), '')) ; SEPARATOR='@@') AS ?ondersteuning_voor)
            (GROUP_CONCAT(DISTINCT CONCAT(COALESCE(?taak_omschrijving, ''), '||', COALESCE(STR(?taaktype), '')) ; SEPARATOR='@@') AS ?geschikt_voor_taak)
            (GROUP_CONCAT(DISTINCT STR(?typeTechnologieConcept); SEPARATOR='@@') AS ?type_technologie)
            (GROUP_CONCAT(DISTINCT STR(?gebodenFunctionaliteitConcept); SEPARATOR='@@') AS ?geboden_functionaliteit)
            (GROUP_CONCAT(DISTINCT STR(?beoogdeGebruikersConcept); SEPARATOR='@@') AS ?beoogde_gebruikers)
           (GROUP_CONCAT(DISTINCT STR(?beheerder); SEPARATOR='@@') AS ?beheerder)
           (GROUP_CONCAT(DISTINCT STR(?leverancier); SEPARATOR='@@') AS ?leverancier)
    WHERE {{
      GRAPH <{_GRAPH_URI}> {{
        BIND(IRI("{tech_iri}") AS ?tech)
        VALUES ?subtypeClass {{ lto:Methode lto:Standaard lto:Tool }}
        ?tech a ?subtypeClass ;
              lto:naam ?naam ;
              lto:omschrijving ?omschrijving ;
              lto:gebruiksstatus ?gebruiksstatus ;
              lto:licentievorm ?licentievorm ;
              lto:bijgewerktOp ?bijgewerktOp .
                OPTIONAL {{ ?tech lto:afkorting ?abbrevation . }}
        OPTIONAL {{ ?tech lto:normstatus ?normstatus . }}
                OPTIONAL {{
                    ?tech lto:versiebeschrijving ?versie .
                    OPTIONAL {{ ?versie lto:versienummer ?versienummer . }}
                    OPTIONAL {{ ?versie lto:versiedatum ?versiedatum . }}
                }}
                OPTIONAL {{ ?tech lto:ondersteuningVoor ?ondersteuning . }}
                OPTIONAL {{ ?ondersteuning lto:beschouwingsniveau ?beschouwingsniveau . }}
                OPTIONAL {{ ?ondersteuning lto:modelsoort ?modelsoort . }}
                OPTIONAL {{ ?tech lto:geschiktVoorTaak ?geschikt . }}
                OPTIONAL {{ ?geschikt lto:omschrijving ?taak_omschrijving . }}
                OPTIONAL {{ ?geschikt lto:taaktype ?taaktype . }}
                OPTIONAL {{ ?tech lto:typeTechnologie ?typeTechnologieConcept . }}
                OPTIONAL {{ ?tech lto:gebodenFunctionaliteit ?gebodenFunctionaliteitConcept . }}
                OPTIONAL {{ ?tech lto:beoogdeGebruikers ?beoogdeGebruikersConcept . }}
        OPTIONAL {{
          ?tech lto:documentatie ?doc .
          OPTIONAL {{ ?doc lto:beoogdGebruik ?beoogdGebruik . }}
          OPTIONAL {{ ?doc lto:toegevoegdeWaarde ?toegevoegdeWaarde . }}
          OPTIONAL {{ ?doc lto:onderdelen ?onderdelen . }}
          OPTIONAL {{ ?doc lto:ontwikkelingEnBeheer ?ontwikkelingEnBeheer . }}
        }}
        OPTIONAL {{
          ?tech lto:bron ?bron .
          OPTIONAL {{ ?bron dc:title ?bron_titel . }}
          OPTIONAL {{ ?bron foaf:page ?bron_locatie . }}
          OPTIONAL {{ ?bron dc:bibliographicCitation ?bron_verwijzing . }}
        }}
        OPTIONAL {{ ?tech lto:beheerder ?beheerder . }}
        OPTIONAL {{ ?tech lto:leverancier ?leverancier . }}
      }}
    }}
        GROUP BY ?tech ?subtypeClass ?abbrevation ?versienummer ?versiedatum ?naam ?omschrijving ?gebruiksstatus ?licentievorm ?bijgewerktOp ?normstatus
    '''
    result = sparql_query(sparql)
    bindings = result.get('results', {}).get('bindings', [])
    # Map all fields, including arrays and nested objects
    if not bindings:
        return None
    b0 = bindings[0]

    ondersteuning = []
    for item in _split_group_concat(b0.get('ondersteuning_voor', {}).get('value', '')):
        parts = item.split('||')
        beschouwingsniveau = parts[0] if len(parts) > 0 else ''
        modelsoort = parts[1] if len(parts) > 1 else ''
        if not beschouwingsniveau and not modelsoort:
            continue
        ondersteuning.append({
            'beschouwingsniveau': beschouwingsniveau,
            'modelsoort': modelsoort,
        })

    geschikt = []
    seen_geschikt = set()
    for item in _split_group_concat(b0.get('geschikt_voor_taak', {}).get('value', '')):
        parts = item.split('||')
        omschrijving = parts[0] if len(parts) > 0 else ''
        taaktype = parts[1] if len(parts) > 1 else ''
        if not omschrijving and not taaktype:
            continue
        key = (omschrijving, taaktype)
        if key in seen_geschikt:
            continue
        seen_geschikt.add(key)
        geschikt.append({
            'omschrijving': omschrijving,
            'taaktype': taaktype,
        })

    bronverwijzing = []
    for item in _split_group_concat(b0.get('bronverwijzing', {}).get('value', '')):
        parts = item.split('||')
        bronverwijzing.append({
            'titel': parts[0] if len(parts) > 0 else '',
            'locatie': parts[1] if len(parts) > 1 else '',
            'verwijzing': parts[2] if len(parts) > 2 else '',
        })

    documentatie = None
    documentatie_items = _split_group_concat(b0.get('documentatie', {}).get('value', ''))
    if documentatie_items:
        parts = documentatie_items[0].split('||')
        documentatie = {
            'beoogdGebruik': parts[0] if len(parts) > 0 else '',
            'toegevoegdeWaarde': parts[1] if len(parts) > 1 else '',
            'onderdelen': parts[2] if len(parts) > 2 else '',
            'ontwikkelingEnBeheer': parts[3] if len(parts) > 3 else '',
        }

    beheerder_values = _split_group_concat(b0.get('beheerder', {}).get('value', ''))
    leverancier_values = _split_group_concat(b0.get('leverancier', {}).get('value', ''))

    parsed_abbrevation, parsed_versienummer = _parse_tech_iri(tech_iri)
    abbrevation = b0.get('abbrevation', {}).get('value', '') or (parsed_abbrevation or '')
    versienummer = b0.get('versienummer', {}).get('value', '') or (parsed_versienummer or '')
    versiedatum = b0.get('versiedatum', {}).get('value', '')
    api_id = _build_api_id(abbrevation, versienummer) if abbrevation and versienummer else id

    type_technologie_values = _split_group_concat(b0.get('type_technologie', {}).get('value', ''))
    geboden_functionaliteit_values = _split_group_concat(b0.get('geboden_functionaliteit', {}).get('value', ''))
    beoogde_gebruikers_values = _split_group_concat(b0.get('beoogde_gebruikers', {}).get('value', ''))

    concept_iris = set()
    concept_iris.add(b0.get('gebruiksstatus', {}).get('value', ''))
    concept_iris.add(b0.get('licentievorm', {}).get('value', ''))
    concept_iris.add(b0.get('normstatus', {}).get('value', ''))
    for values in [
        type_technologie_values,
        geboden_functionaliteit_values,
        beoogde_gebruikers_values,
    ]:
        for value in values:
            if value.startswith('http'):
                concept_iris.add(value)
    for item in ondersteuning:
        if item['beschouwingsniveau'].startswith('http'):
            concept_iris.add(item['beschouwingsniveau'])
        if item['modelsoort'].startswith('http'):
            concept_iris.add(item['modelsoort'])
    for item in geschikt:
        if item['taaktype'].startswith('http'):
            concept_iris.add(item['taaktype'])

    concept_labels = _get_concept_labels_batch(concept_iris)

    for item in ondersteuning:
        item['beschouwingsniveau'] = concept_labels.get(item['beschouwingsniveau'], item['beschouwingsniveau'])
        item['modelsoort'] = concept_labels.get(item['modelsoort'], item['modelsoort'])
    for item in geschikt:
        item['taaktype'] = concept_labels.get(item['taaktype'], item['taaktype'])

    type_technologie = [concept_labels.get(v, v) for v in type_technologie_values if v]
    geboden_functionaliteit = [concept_labels.get(v, v) for v in geboden_functionaliteit_values if v]
    beoogde_gebruikers = [concept_labels.get(v, v) for v in beoogde_gebruikers_values if v]

    gebruiksstatus_iri = b0.get('gebruiksstatus', {}).get('value', '')
    licentievorm_iri = b0.get('licentievorm', {}).get('value', '')
    normstatus_iri = b0.get('normstatus', {}).get('value', '')

    return {
        'id': api_id,
        'iri': tech_iri,
        'subtype': _CLASS_TO_SUBTYPE.get(b0.get('subtypeClass', {}).get('value', ''), ''),
        'abbrevation': abbrevation,
        'versienummer': versienummer,
        'versiedatum': versiedatum,
        'naam': b0.get('naam', {}).get('value', ''),
        'omschrijving': b0.get('omschrijving', {}).get('value', ''),
        'gebruiksstatus': concept_labels.get(gebruiksstatus_iri, ''),
        'licentievorm': concept_labels.get(licentievorm_iri, ''),
        'bijgewerkt_op': b0.get('bijgewerktOp', {}).get('value', ''),
        'normstatus': concept_labels.get(normstatus_iri, ''),
        'ondersteuning_voor': ondersteuning,
        'geschikt_voor_taak': geschikt,
        'documentatie': documentatie,
        'bronverwijzing': bronverwijzing,
        'beheerder': beheerder_values[0] if beheerder_values else None,
        'leverancier': leverancier_values[0] if leverancier_values else None,
        'type_technologie': type_technologie,
        'geboden_functionaliteit': geboden_functionaliteit,
        'beoogde_gebruikers': beoogde_gebruikers,
    }

def update_legal_technology(id, data, sync_exports=True):
    # Update strategy: merge incoming payload with existing entity, then replace.
    existing = get_legal_technology(id)
    if not existing:
        return None

    merged = existing.copy()
    merged.update(data or {})

    # Ensure required write fields remain present.
    if not merged.get('bijgewerkt_op'):
        merged['bijgewerkt_op'] = date.today().isoformat()

    # Keep identifier tied to route id unless caller intentionally changed both parts.
    route_abbrev, route_version = _parse_api_id(id)
    if route_abbrev and route_version:
        merged['abbrevation'] = merged.get('abbrevation') or route_abbrev
        merged['versienummer'] = merged.get('versienummer') or route_version

    # add_legal_technology does not need id in payload.
    merged.pop('id', None)

    # Replace existing record in GraphDB and recreate with merged values.
    existing_org_iris = _collect_related_organisation_iris(existing)

    delete_legal_technology(id, sync_exports=False)
    created = add_legal_technology(merged, sync_exports=False)
    created_id = created.get('id', id)
    current = get_legal_technology(created_id)
    current_org_iris = _collect_related_organisation_iris(current)
    if sync_exports:
        _sync_exports_after_legal_technology_change(
            current_id=created_id,
            deleted_id=id if id != created_id else None,
            organisation_iris=existing_org_iris | current_org_iris,
        )
    return current

def delete_legal_technology(id, sync_exports=True):
        # Retrieve the current resource first so we can return what was deleted.
        existing = get_legal_technology(id)
        if not existing:
                return None

        graph_uri = "https://data.bp4mc2.org/id/lto"
        tech_iri = _resolve_tech_iri_from_id(id)

        # Delete the legal technology itself, nested part resources created under
        # the technology IRI, and inbound references pointing to this technology.
        delete = f'''
        DELETE {{
            GRAPH <{graph_uri}> {{
                <{tech_iri}> ?p ?o .
                ?child ?cp ?co .
                ?ref ?rp <{tech_iri}> .
            }}
        }}
        WHERE {{
            GRAPH <{graph_uri}> {{
                OPTIONAL {{ <{tech_iri}> ?p ?o . }}
                OPTIONAL {{
                    <{tech_iri}> ?sp ?child .
                    FILTER(isBlank(?child) || (isIRI(?child) && STRSTARTS(STR(?child), "{tech_iri}/")))
                    ?child ?cp ?co .
                }}
                OPTIONAL {{ ?ref ?rp <{tech_iri}> . }}
            }}
        }}
        '''

        sparql_update(delete, graph_uri=graph_uri)
        if sync_exports:
            _sync_exports_after_legal_technology_change(
                deleted_id=id,
                organisation_iris=_collect_related_organisation_iris(existing),
            )
        return existing


def _term_to_turtle(term: dict) -> str:
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


def export_legal_technology_turtle(id):
    tech_iri = _resolve_tech_iri_from_id(id)
    if not get_legal_technology(id):
        return None

    graph_uri = "https://data.bp4mc2.org/id/lto"
    sparql = f'''
    SELECT DISTINCT ?s ?p ?o WHERE {{
      GRAPH <{graph_uri}> {{
        {{ BIND(<{tech_iri}> AS ?s) . ?s ?p ?o . }}
        UNION
        {{
          <{tech_iri}> ?sp ?child .
                    FILTER(isBlank(?child) || (isIRI(?child) && STRSTARTS(STR(?child), "{tech_iri}/")))
          BIND(?child AS ?s)
          ?s ?p ?o .
        }}
      }}
    }}
    ORDER BY ?s ?p ?o
    '''

    result = sparql_query(sparql)
    bindings = result.get('results', {}).get('bindings', [])

    lines = [
        '@prefix lto: <http://bp4mc2.org/lto#> .',
        '@prefix lt: <http://bp4mc2.org/lt#> .',
        '@prefix dct: <http://purl.org/dc/terms/> .',
        '@prefix foaf: <http://xmlns.com/foaf/0.1/> .',
        ''
    ]
    for b in bindings:
        s = _term_to_turtle(b.get('s', {}))
        p = _term_to_turtle(b.get('p', {}))
        o = _term_to_turtle(b.get('o', {}))
        lines.append(f'{s} {p} {o} .')
    return '\n'.join(lines) + '\n'


def export_named_graph_download():
    return export_named_graph_turtle(_GRAPH_URI)


def export_legal_technology_markdown(id):
    tech = get_legal_technology(id)
    if not tech:
        return None

    def _list(values):
        if not values:
            return '-'
        return ', '.join(v for v in values if v)

    ondersteuning_lines = []
    for item in tech.get('ondersteuning_voor', []):
        ondersteuning_lines.append(f"- {item.get('beschouwingsniveau', '')} / {item.get('modelsoort', '')}")
    if not ondersteuning_lines:
        ondersteuning_lines = ['-']

    taak_lines = []
    for item in tech.get('geschikt_voor_taak', []):
        taak_lines.append(f"- {item.get('taaktype', '')}: {item.get('omschrijving', '')}")
    if not taak_lines:
        taak_lines = ['-']

    bron_lines = []
    for bron in tech.get('bronverwijzing', []):
        bron_lines.append(
            f"- {bron.get('titel', '')} | {bron.get('locatie', '')} | {bron.get('verwijzing', '')}"
        )
    if not bron_lines:
        bron_lines = ['-']

    doc = tech.get('documentatie') or {}

    lines = [
        f"# {tech.get('naam', 'Juridische technologie')}",
        '',
        '## Basisgegevens',
        f"- ID: {tech.get('id', '')}",
        f"- Afkorting: {tech.get('abbrevation', '')}",
        f"- Versienummer: {tech.get('versienummer', '')}",
        f"- Versiedatum: {tech.get('versiedatum', '')}",
        f"- Gebruiksstatus: {tech.get('gebruiksstatus', '')}",
        f"- Licentievorm: {tech.get('licentievorm', '')}",
        f"- Normstatus: {tech.get('normstatus', '')}",
        f"- Bijgewerkt op: {tech.get('bijgewerkt_op', '')}",
        '',
        '## Omschrijving',
        tech.get('omschrijving', ''),
        '',
        '## Functioneel',
        f"- Geboden functionaliteit: {_list(tech.get('geboden_functionaliteit', []))}",
        f"- Beoogde gebruikers: {_list(tech.get('beoogde_gebruikers', []))}",
        f"- Type technologie: {_list(tech.get('type_technologie', []))}",
        '',
        '## Ondersteuning voor',
        *ondersteuning_lines,
        '',
        '## Geschikt voor taak',
        *taak_lines,
        '',
        '## Organisaties',
        f"- Beheerder: {tech.get('beheerder') or '-'}",
        f"- Leverancier: {tech.get('leverancier') or '-'}",
        '',
        '## Documentatie',
        f"- Beoogd gebruik: {doc.get('beoogdGebruik', '') if doc else ''}",
        f"- Toegevoegde waarde: {doc.get('toegevoegdeWaarde', '') if doc else ''}",
        f"- Onderdelen: {doc.get('onderdelen', '') if doc else ''}",
        f"- Ontwikkeling en beheer: {doc.get('ontwikkelingEnBeheer', '') if doc else ''}",
        '',
        '## Bronverwijzingen',
        *bron_lines,
        ''
    ]
    return '\n'.join(lines)

def list_enumerations():
    # Haal enumeraties op via skos:Collection (nieuwe ontologie gebruikt skos:member i.p.v. skos:inScheme)
    sparql = '''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX lto: <http://bp4mc2.org/lto#>
    PREFIX ltb: <http://bp4mc2.org/ltb#>
    PREFIX ltt: <http://bp4mc2.org/ltt#>
    SELECT ?collection ?label WHERE {
        VALUES ?collection {
            lto:Gebruiksstatussen
            lto:Licentievormen
            lto:Functionaliteiten
            lto:Gebruikersgroepen
            lto:Beschouwingsniveaus
            lto:Modelsoorten
            lto:Normstatussen
            lto:Technologietypen
            ltb:StickyNoteStatussen
        }
        ?collection skos:member ?enum .
        OPTIONAL { ?enum skos:prefLabel ?label . }
        OPTIONAL { ?enum rdfs:label ?label . }
        FILTER(BOUND(?label))
    }
    '''
    # Taken worden apart opgehaald uit het taken-begrippenkader
    taken_sparql = '''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX ltt: <http://bp4mc2.org/ltt#>
    SELECT ?label WHERE {
        ?concept a skos:Concept ;
                 skos:inScheme ltt:BegrippenkaderTaken .
        OPTIONAL { ?concept skos:prefLabel ?label . }
        OPTIONAL { ?concept rdfs:label ?label . }
        FILTER(BOUND(?label))
    }
    '''
    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        enums = {}
        for b in bindings:
            t_uri = b.get('collection', {}).get('value')
            label = b.get('label', {}).get('value')
            if not t_uri or not label:
                continue
            # Extract local name from URI (after last / or #)
            t = t_uri.split('/')[-1].split('#')[-1]
            if t not in enums:
                enums[t] = []
            if label not in enums[t]:
                enums[t].append(label)
        # Taken
        taken_result = sparql_query(taken_sparql)
        taken_bindings = taken_result.get('results', {}).get('bindings', [])
        taaktypen = []
        for b in taken_bindings:
            label = b.get('label', {}).get('value')
            if label and label not in taaktypen:
                taaktypen.append(label)
        if taaktypen:
            enums['Taaktypen'] = taaktypen
        return enums
    except Exception as e:
        print("[DEBUG] Exception in list_enumerations:", e)
        return {'error': str(e)}


def list_sticky_note_status_enumeration_items():
    sparql = '''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX ltb: <http://bp4mc2.org/ltb#>
    SELECT ?iri ?label WHERE {
        ltb:StickyNoteStatussen skos:member ?iri .
        OPTIONAL {
            ?iri skos:prefLabel ?prefLabel .
            FILTER(LANG(?prefLabel) = '' || LANGMATCHES(LANG(?prefLabel), 'nl'))
        }
        OPTIONAL {
            ?iri rdfs:label ?rdfsLabel .
            FILTER(LANG(?rdfsLabel) = '' || LANGMATCHES(LANG(?rdfsLabel), 'nl'))
        }
        BIND(COALESCE(?prefLabel, ?rdfsLabel) AS ?label)
        FILTER(BOUND(?label))
    }
    ORDER BY LCASE(STR(?label))
    '''

    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])
        values = []
        seen_iris = set()
        for b in bindings:
            iri = b.get('iri', {}).get('value', '')
            label = b.get('label', {}).get('value', '')
            if not iri or not label or iri in seen_iris:
                continue
            seen_iris.add(iri)
            values.append({'label': label, 'iri': iri})
        return values
    except Exception as e:
        print('[DEBUG] Exception in list_sticky_note_status_enumeration_items:', e)
        return []


def list_tasktypes():
    sparql = '''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX ltt: <http://bp4mc2.org/ltt#>
    SELECT ?concept ?label ?definition WHERE {
        ?concept a skos:Concept ;
                 skos:inScheme ltt:BegrippenkaderTaken .
        OPTIONAL {
            ?concept skos:prefLabel ?prefLabel .
            FILTER(LANG(?prefLabel) = '' || LANGMATCHES(LANG(?prefLabel), 'nl'))
        }
        OPTIONAL {
            ?concept rdfs:label ?rdfsLabel .
            FILTER(LANG(?rdfsLabel) = '' || LANGMATCHES(LANG(?rdfsLabel), 'nl'))
        }
        OPTIONAL {
            ?concept skos:definition ?definitionValue .
            FILTER(LANG(?definitionValue) = '' || LANGMATCHES(LANG(?definitionValue), 'nl'))
        }
        BIND(COALESCE(?prefLabel, ?rdfsLabel) AS ?label)
        BIND(COALESCE(STR(?definitionValue), '') AS ?definition)
        FILTER(BOUND(?label))
    }
    ORDER BY LCASE(STR(?label))
    '''

    ordered_groups_sparql = '''
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?group ?groupLabel ?head ?node ?member ?next WHERE {
        ?group a skos:OrderedCollection ;
               skos:memberList ?head .
        OPTIONAL {
            ?group skos:prefLabel ?groupPrefLabel .
            FILTER(LANG(?groupPrefLabel) = '' || LANGMATCHES(LANG(?groupPrefLabel), 'nl'))
        }
        OPTIONAL {
            ?group rdfs:label ?groupRdfsLabel .
            FILTER(LANG(?groupRdfsLabel) = '' || LANGMATCHES(LANG(?groupRdfsLabel), 'nl'))
        }
        BIND(COALESCE(?groupPrefLabel, ?groupRdfsLabel, STR(?group)) AS ?groupLabel)

        ?head rdf:rest* ?node .
        ?node rdf:first ?member .
        OPTIONAL { ?node rdf:rest ?next . }
    }
    '''

    def _extract_order_number(value):
        token = _extract_concept_identifier(value)
        digits = ''.join(ch for ch in token if ch.isdigit())
        if digits:
            try:
                return int(digits)
            except ValueError:
                return None
        return None

    try:
        result = sparql_query(sparql)
        bindings = result.get('results', {}).get('bindings', [])

        ordering_result = sparql_query(ordered_groups_sparql)
        ordering_bindings = ordering_result.get('results', {}).get('bindings', [])

        group_nodes = {}
        group_heads = {}
        group_labels = {}
        group_members = {}

        for binding in ordering_bindings:
            group_iri = binding.get('group', {}).get('value', '')
            member_iri = binding.get('member', {}).get('value', '')
            node_iri = binding.get('node', {}).get('value', '')
            next_node_iri = binding.get('next', {}).get('value', '')
            head_iri = binding.get('head', {}).get('value', '')
            group_label = binding.get('groupLabel', {}).get('value', '')

            if not group_iri or not member_iri or not node_iri:
                continue

            group_labels[group_iri] = group_label
            group_heads[group_iri] = head_iri
            group_nodes.setdefault(group_iri, {})[node_iri] = {
                'member': member_iri,
                'next': next_node_iri,
            }

        ordered_groups = sorted(
            group_nodes.keys(),
            key=lambda iri: (
                _extract_order_number(group_labels.get(iri, ''))
                if _extract_order_number(group_labels.get(iri, '')) is not None
                else 9999,
                group_labels.get(iri, '').lower(),
            ),
        )

        for group_index, group_iri in enumerate(ordered_groups):
            nodes = group_nodes.get(group_iri, {})
            current = group_heads.get(group_iri)
            visited = set()
            task_index = 0

            while current and current in nodes and current not in visited:
                visited.add(current)
                node_info = nodes[current]
                member_iri = node_info.get('member', '')
                if member_iri:
                    group_members[member_iri] = {
                        'group_iri': group_iri,
                        'group_label': group_labels.get(group_iri, ''),
                        'group_order': group_index,
                        'task_order': task_index,
                    }
                    task_index += 1
                next_node = node_info.get('next', '')
                if not next_node or next_node.endswith('rdf-syntax-ns#nil'):
                    break
                current = next_node

        tasktypes = []
        for binding in bindings:
            label = binding.get('label', {}).get('value', '')
            iri = binding.get('concept', {}).get('value', '')
            if not iri or not label:
                continue

            group_info = group_members.get(iri, {})
            tasktypes.append({
                'iri': iri,
                'label': label,
                'description': binding.get('definition', {}).get('value', ''),
                'group_iri': group_info.get('group_iri', ''),
                'group_label': group_info.get('group_label', ''),
                'group_order': group_info.get('group_order'),
                'task_order': group_info.get('task_order'),
            })

        tasktypes.sort(
            key=lambda item: (
                item.get('group_order') if item.get('group_order') is not None else 9999,
                item.get('task_order') if item.get('task_order') is not None else 9999,
                str(item.get('label', '')).lower(),
            ),
        )
        return tasktypes
    except Exception as e:
        print('[DEBUG] Exception in list_tasktypes:', e)
        return []

def get_stats():
    total_query = '''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT (COUNT(DISTINCT ?tech) AS ?count)
    WHERE {
      VALUES ?subtypeClass { lto:Methode lto:Standaard lto:Tool }
      ?tech a ?subtypeClass .
    }
    '''

    subtype_query = '''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?subtypeClass (COUNT(DISTINCT ?tech) AS ?count)
    WHERE {
      VALUES ?subtypeClass { lto:Methode lto:Standaard lto:Tool }
      ?tech a ?subtypeClass .
    }
    GROUP BY ?subtypeClass
    ORDER BY ?subtypeClass
    '''

    recent_updated_query = '''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?tech ?naam ?bijgewerktOp
    WHERE {
      VALUES ?subtypeClass { lto:Methode lto:Standaard lto:Tool }
      ?tech a ?subtypeClass ;
            lto:naam ?naam ;
            lto:bijgewerktOp ?bijgewerktOp .
    }
    ORDER BY DESC(?bijgewerktOp)
    LIMIT 5
    '''

    recent_added_query = '''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?tech ?naam ?versiedatum
    WHERE {
      VALUES ?subtypeClass { lto:Methode lto:Standaard lto:Tool }
      ?tech a ?subtypeClass ;
            lto:naam ?naam ;
            lto:versiebeschrijving ?versie .
      OPTIONAL { ?versie lto:versiedatum ?versiedatum . }
    }
    ORDER BY DESC(?versiedatum)
    LIMIT 5
    '''

    try:
        total_result = sparql_query(total_query)
        total_bindings = total_result.get('results', {}).get('bindings', [])
        total_count = int(total_bindings[0].get('count', {}).get('value', 0)) if total_bindings else 0

        subtype_result = sparql_query(subtype_query)
        subtype_bindings = subtype_result.get('results', {}).get('bindings', [])
        by_subtype = {
            'Methode': 0,
            'Standaard': 0,
            'Tool': 0,
        }
        for b in subtype_bindings:
            class_iri = b.get('subtypeClass', {}).get('value', '')
            subtype = _CLASS_TO_SUBTYPE.get(class_iri)
            if subtype:
                by_subtype[subtype] = int(b.get('count', {}).get('value', 0))

        updated_result = sparql_query(recent_updated_query)
        updated_bindings = updated_result.get('results', {}).get('bindings', [])
        last_edited = []
        for b in updated_bindings:
            tech_iri = b.get('tech', {}).get('value', '')
            parsed_abbrev, parsed_version = _parse_tech_iri(tech_iri)
            tech_id = _build_api_id(parsed_abbrev, parsed_version) if parsed_abbrev and parsed_version else tech_iri
            last_edited.append({
                'id': tech_id,
                'naam': b.get('naam', {}).get('value', ''),
                'bijgewerkt_op': b.get('bijgewerktOp', {}).get('value', ''),
            })

        added_result = sparql_query(recent_added_query)
        added_bindings = added_result.get('results', {}).get('bindings', [])
        newly_added = []
        for b in added_bindings:
            tech_iri = b.get('tech', {}).get('value', '')
            parsed_abbrev, parsed_version = _parse_tech_iri(tech_iri)
            tech_id = _build_api_id(parsed_abbrev, parsed_version) if parsed_abbrev and parsed_version else tech_iri
            newly_added.append({
                'id': tech_id,
                'naam': b.get('naam', {}).get('value', ''),
                'versiedatum': b.get('versiedatum', {}).get('value', ''),
            })

        return {
            'count': total_count,
            'by_subtype': by_subtype,
            'last_edited': last_edited,
            'newly_added': newly_added,
        }
    except Exception as e:
        print('[DEBUG] Exception in get_stats:', e)
        return {
            'count': 0,
            'by_subtype': {'Methode': 0, 'Standaard': 0, 'Tool': 0},
            'last_edited': [],
            'newly_added': [],
        }
