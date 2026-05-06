from typing import Dict, List, Optional

from .graphdb_client import sparql_query, sparql_update

BOARD_GRAPH = "https://data.bp4mc2.org/id/ltb"


def _validate_iri(iri: Optional[str], field_name: str) -> str:
    value = (iri or "").strip()
    if not value:
        raise ValueError(f"{field_name} is verplicht")
    if not (value.startswith("http://") or value.startswith("https://")):
        raise ValueError(f"{field_name} moet een absolute IRI zijn")
    return value


def _split_group_concat(value: Optional[str]) -> List[str]:
    if not value:
        return []
    return [item for item in value.split("@@") if item]


def _status_from_iri(status_iri: str) -> str:
    if not status_iri:
        return ""
    token = status_iri.rsplit("#", 1)[-1].rsplit("/", 1)[-1]
    words = []
    current = ""
    for char in token:
        if char.isupper() and current:
            words.append(current)
            current = char
        else:
            current += char
    if current:
        words.append(current)
    return " ".join(words).strip() or token


def _get_technology_names(uris: List[str]) -> Dict[str, str]:
    """Fetch names for a list of technology URIs using batch VALUES clause."""
    if not uris:
        return {}
    
    # Build a VALUES clause with all URIs
    uri_values = " ".join([f"(<{uri}>) " for uri in uris])
    
    sparql = f'''
    PREFIX lto: <http://bp4mc2.org/lto#>
    SELECT ?uri ?name
    WHERE {{
        VALUES (?uri) {{ {uri_values}}}
        OPTIONAL {{ ?uri lto:naam ?name . }}
    }}
    '''
    
    result = sparql_query(sparql)
    bindings = result.get("results", {}).get("bindings", [])
    
    names = {}
    for item in bindings:
        uri = item.get("uri", {}).get("value", "")
        name = item.get("name", {}).get("value", "")
        if uri:
            names[uri] = name
    
    return names


def list_sticky_notes(
    board: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    link_mode: Optional[str] = None,
    note_uri: Optional[str] = None,
) -> List[Dict]:
    sparql = f'''
    PREFIX ltb: <http://bp4mc2.org/ltb#>
    PREFIX lto: <http://bp4mc2.org/lto#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT
        ?note ?noteId ?tekst ?status ?sectie ?kleur ?omschrijving
        ?board ?boardNaam (SAMPLE(?taaktype) AS ?taaktype) (SAMPLE(?taaktypeNaamRaw) AS ?taaktypeNaam)
        (SAMPLE(?verwijst) AS ?verwijst)
        (GROUP_CONCAT(DISTINCT STR(?cand); separator="@@") AS ?kandidaten)
    WHERE {{
        GRAPH <{BOARD_GRAPH}> {{
            ?note a ltb:StickyNote ;
                        ltb:stickyNoteId ?noteId ;
                        ltb:stickyTekst ?tekst ;
                        ltb:stickyStatus ?status ;
                        ltb:opBoard ?board .
            ?board ltb:boardNaam ?boardNaam .
            OPTIONAL {{ ?note ltb:sectieOpBoard ?sectie . }}
            OPTIONAL {{ ?note ltb:stickyKleur ?kleur . }}
            OPTIONAL {{ ?note ltb:omschrijvingAfhandeling ?omschrijving . }}
            OPTIONAL {{ ?note ltb:taaktype ?taaktype . }}
            OPTIONAL {{ ?note ltb:verwijstNaarTechnologie ?verwijst . }}
            OPTIONAL {{ ?note ltb:kandidaatTechnologie ?cand . }}
        }}
        # Lookup taaktype label from any graph - only for ltt: concepts
        OPTIONAL {{
            GRAPH <{BOARD_GRAPH}> {{ ?note ltb:taaktype ?taaktype . }}
            ?taaktype skos:prefLabel ?taaktypeNaamRaw .
            FILTER(STRSTARTS(STR(?taaktype), "http://bp4mc2.org/ltt#"))
            FILTER(LANG(?taaktypeNaamRaw) = "nl")
        }}
    }}
    GROUP BY ?note ?noteId ?tekst ?status ?sectie ?kleur ?omschrijving ?board ?boardNaam
    ORDER BY ?boardNaam ?taaktypeNaam ?noteId
    '''

    result = sparql_query(sparql)
    bindings = result.get("results", {}).get("bindings", [])

    notes: List[Dict] = []
    for item in bindings:
        status_iri = item.get("status", {}).get("value", "")
        kandidaten = _split_group_concat(item.get("kandidaten", {}).get("value", ""))
        candidates = [{"uri": iri, "name": ""} for iri in kandidaten]

        note = {
            "uri": item.get("note", {}).get("value", ""),
            "noteId": item.get("noteId", {}).get("value", ""),
            "text": item.get("tekst", {}).get("value", ""),
            "statusIri": status_iri,
            "status": _status_from_iri(status_iri),
            "section": item.get("sectie", {}).get("value", ""),
            "color": item.get("kleur", {}).get("value", ""),
            "omschrijvingAfhandeling": item.get("omschrijving", {}).get("value", ""),
            "board": {
                "uri": item.get("board", {}).get("value", ""),
                "name": item.get("boardNaam", {}).get("value", ""),
            },
            "taaktype": {
                "uri": item.get("taaktype", {}).get("value", ""),
                "name": item.get("taaktypeNaam", {}).get("value", "") or _status_from_iri(item.get("taaktype", {}).get("value", "")),
            },
            "linkedTechnology": {
                "uri": item.get("verwijst", {}).get("value", ""),
                "name": "",
            },
            "candidateTechnologies": candidates,
        }
        notes.append(note)

    # Batch fetch all technology names
    all_tech_uris = set()
    for note in notes:
        if note["linkedTechnology"]["uri"]:
            all_tech_uris.add(note["linkedTechnology"]["uri"])
        for cand in note["candidateTechnologies"]:
            if cand["uri"]:
                all_tech_uris.add(cand["uri"])
    
    if all_tech_uris:
        tech_names = _get_technology_names(list(all_tech_uris))
        for note in notes:
            if note["linkedTechnology"]["uri"]:
                note["linkedTechnology"]["name"] = tech_names.get(note["linkedTechnology"]["uri"], "")
            for cand in note["candidateTechnologies"]:
                cand["name"] = tech_names.get(cand["uri"], "")

    board_filter = (board or "").strip().lower()
    status_filter = (status or "").strip().lower()
    text_filter = (q or "").strip().lower()
    mode = (link_mode or "all").strip().lower()

    filtered: List[Dict] = []
    for note in notes:
        linked = bool(note["linkedTechnology"]["uri"])
        has_candidates = len(note["candidateTechnologies"]) > 0

        if board_filter and note["board"]["name"].strip().lower() != board_filter:
            continue

        if status_filter and note["status"].strip().lower() != status_filter:
            continue

        if text_filter:
            haystack = " ".join(
                [
                    note.get("noteId", ""),
                    note.get("text", ""),
                    note.get("section", ""),
                    note.get("status", ""),
                    note.get("board", {}).get("name", ""),
                    note.get("taaktype", {}).get("name", ""),
                ]
            ).lower()
            if text_filter not in haystack:
                continue

        if mode == "linked" and not linked:
            continue
        if mode == "candidates" and not has_candidates:
            continue
        if mode == "unlinked" and (linked or has_candidates):
            continue

        if note_uri and note.get("uri") != note_uri:
            continue

        filtered.append(note)

    return filtered


def update_sticky_note_review(
    note_uri: str,
    status_iri: Optional[str] = None,
    definitive_technology_uri: Optional[str] = None,
    move_candidate_to_definitive_uri: Optional[str] = None,
    omschrijving_afhandeling: Optional[str] = None,
    taaktype_iri: Optional[str] = None,
) -> Dict:
        note = _validate_iri(note_uri, "noteUri")
        status = status_iri.strip() if status_iri else ""
        definitive = definitive_technology_uri.strip() if definitive_technology_uri else ""
        promote = move_candidate_to_definitive_uri.strip() if move_candidate_to_definitive_uri else ""
        omschrijving = omschrijving_afhandeling.strip() if omschrijving_afhandeling is not None else None
        taaktype = taaktype_iri.strip() if taaktype_iri else ""

        if status:
                _validate_iri(status, "statusIri")

        if definitive:
                _validate_iri(definitive, "definitiveTechnologyUri")

        if promote:
                _validate_iri(promote, "moveCandidateToDefinitiveUri")

        if taaktype:
                _validate_iri(taaktype, "taaktypeIri")

        if not status and not definitive and not promote and omschrijving is None and not taaktype:
                raise ValueError("Geen review-actie opgegeven")

        if status:
                sparql_update(
                        f'''
                        PREFIX ltb: <http://bp4mc2.org/ltb#>
                        DELETE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:stickyStatus ?oldStatus .
                            }}
                        }}
                        INSERT {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:stickyStatus <{status}> .
                            }}
                        }}
                        WHERE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> a ltb:StickyNote .
                                OPTIONAL {{ <{note}> ltb:stickyStatus ?oldStatus . }}
                            }}
                        }}
                        '''
                )

        if definitive:
                sparql_update(
                        f'''
                        PREFIX ltb: <http://bp4mc2.org/ltb#>
                        DELETE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:verwijstNaarTechnologie ?oldTech .
                            }}
                        }}
                        INSERT {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:verwijstNaarTechnologie <{definitive}> .
                            }}
                        }}
                        WHERE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> a ltb:StickyNote .
                                OPTIONAL {{ <{note}> ltb:verwijstNaarTechnologie ?oldTech . }}
                            }}
                        }}
                        '''
                )

        if promote:
                sparql_update(
                        f'''
                        PREFIX ltb: <http://bp4mc2.org/ltb#>
                        DELETE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:verwijstNaarTechnologie ?oldTech .
                                <{note}> ltb:kandidaatTechnologie <{promote}> .
                            }}
                        }}
                        INSERT {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:verwijstNaarTechnologie <{promote}> .
                            }}
                        }}
                        WHERE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> a ltb:StickyNote .
                                OPTIONAL {{ <{note}> ltb:verwijstNaarTechnologie ?oldTech . }}
                                OPTIONAL {{ <{note}> ltb:kandidaatTechnologie <{promote}> . }}
                            }}
                        }}
                        '''
                )

        if omschrijving is not None:
                safe = omschrijving.replace('\\', '\\\\').replace('"', '\\"')
                sparql_update(
                        f'''
                        PREFIX ltb: <http://bp4mc2.org/ltb#>
                        DELETE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:omschrijvingAfhandeling ?oldOmschr .
                            }}
                        }}
                        INSERT {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:omschrijvingAfhandeling "{safe}" .
                            }}
                        }}
                        WHERE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> a ltb:StickyNote .
                                OPTIONAL {{ <{note}> ltb:omschrijvingAfhandeling ?oldOmschr . }}
                            }}
                        }}
                        '''
                )

        if taaktype:
                sparql_update(
                        f'''
                        PREFIX ltb: <http://bp4mc2.org/ltb#>
                        DELETE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:taaktype ?oldTaaktype .
                            }}
                        }}
                        INSERT {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> ltb:taaktype <{taaktype}> .
                            }}
                        }}
                        WHERE {{
                            GRAPH <{BOARD_GRAPH}> {{
                                <{note}> a ltb:StickyNote .
                                OPTIONAL {{ <{note}> ltb:taaktype ?oldTaaktype . }}
                            }}
                        }}
                        '''
                )

        updated = list_sticky_notes(note_uri=note)
        if not updated:
                raise ValueError("Sticky note niet gevonden")
        return updated[0]


def search_technology_suggestions(q: Optional[str] = None, limit: int = 15) -> List[Dict[str, str]]:
        term = (q or "").strip()
        safe_term = term.replace('\\', '\\\\').replace('"', '\\"')
        capped_limit = max(1, min(limit, 50))

        sparql = f'''
        PREFIX lto: <http://bp4mc2.org/lto#>
        SELECT DISTINCT ?tech ?naam
        WHERE {{
            GRAPH <https://data.bp4mc2.org/id/lto> {{
                VALUES ?type {{ lto:Methode lto:Standaard lto:Tool }}
                ?tech a ?type ;
                            lto:naam ?naam .
            }}
            FILTER(CONTAINS(LCASE(STR(?naam)), LCASE("{safe_term}")))
        }}
        ORDER BY LCASE(STR(?naam))
        LIMIT {capped_limit}
        '''

        result = sparql_query(sparql)
        bindings = result.get("results", {}).get("bindings", [])

        suggestions: List[Dict[str, str]] = []
        for item in bindings:
                uri = item.get("tech", {}).get("value", "")
                name = item.get("naam", {}).get("value", "")
                if not uri:
                        continue
                suggestions.append({"uri": uri, "name": name})

        return suggestions
