from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from .graphdb_client import escape_sparql_literal, sparql_query, sparql_update


GOVERNANCE_GRAPH = "https://data.bp4mc2.org/id/ltg/governance"
GOV_PREFIX = "https://data.bp4mc2.org/id/ltg/governance"

PROPOSAL_STATUS_TO_IRI = {
    "Ingediend": "http://bp4mc2.org/ltg#Ingediend",
    "In behandeling": "http://bp4mc2.org/ltg#InBehandeling",
    "Goedgekeurd": "http://bp4mc2.org/ltg#Goedgekeurd",
    "Afgewezen": "http://bp4mc2.org/ltg#Afgewezen",
    "Teruggetrokken": "http://bp4mc2.org/ltg#Teruggetrokken",
}
PROPOSAL_IRI_TO_STATUS = {value: key for key, value in PROPOSAL_STATUS_TO_IRI.items()}

COMMENT_STATUS_TO_IRI = {
    "Nieuw": "http://bp4mc2.org/ltg#Nieuw",
    "In behandeling": "http://bp4mc2.org/ltg#CommentInBehandeling",
    "Geaccepteerd": "http://bp4mc2.org/ltg#Geaccepteerd",
    "Afgewezen": "http://bp4mc2.org/ltg#CommentAfgewezen",
    "Opgelost": "http://bp4mc2.org/ltg#Opgelost",
}
COMMENT_IRI_TO_STATUS = {value: key for key, value in COMMENT_STATUS_TO_IRI.items()}

PROPOSAL_TRANSITIONS = {
    "Ingediend": {"In behandeling", "Teruggetrokken"},
    "In behandeling": {"Goedgekeurd", "Afgewezen", "Teruggetrokken"},
    "Goedgekeurd": set(),
    "Afgewezen": set(),
    "Teruggetrokken": set(),
}

COMMENT_TRANSITIONS = {
    "Nieuw": {"In behandeling", "Afgewezen"},
    "In behandeling": {"Geaccepteerd", "Afgewezen", "Opgelost"},
    "Geaccepteerd": {"Opgelost"},
    "Afgewezen": set(),
    "Opgelost": set(),
}


def _proposal_uri(proposal_id: str) -> str:
    return f"{GOV_PREFIX}/proposal/{proposal_id}"


def _comment_uri(comment_id: str) -> str:
    return f"{GOV_PREFIX}/comment/{comment_id}"


def _audit_uri(audit_id: str) -> str:
    return f"{GOV_PREFIX}/audit/{audit_id}"


def _today_iso_date() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _now_iso_datetime() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _bind_value(item: Dict, key: str) -> Optional[str]:
    return item.get(key, {}).get("value")


def _normalize_search(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def _append_audit_event(
    actor: str,
    action: str,
    entity_label: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    previous_value: Optional[str] = None,
    new_value: Optional[str] = None,
    reason: Optional[str] = None,
    proposal_id: Optional[str] = None,
) -> Dict:
    audit_id = f"aud-{uuid4().hex[:8]}"
    audit_uri = _audit_uri(audit_id)

    values = [
        f'<{audit_uri}> a <http://bp4mc2.org/ltg#AuditEvent> ;',
        f'  <http://bp4mc2.org/ltg#auditId> "{escape_sparql_literal(audit_id)}" ;',
        f'  <http://bp4mc2.org/ltg#tijdstip> "{_now_iso_datetime()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;',
        f'  <http://bp4mc2.org/ltg#actor> "{escape_sparql_literal(actor)}" ;',
        f'  <http://bp4mc2.org/ltg#actie> "{escape_sparql_literal(action)}" ;',
        f'  <http://bp4mc2.org/ltg#entiteitLabel> "{escape_sparql_literal(entity_label)}" ;',
        f'  <http://bp4mc2.org/ltg#entiteitType> "{escape_sparql_literal(entity_type)}"',
    ]

    if entity_id:
        values[-1] += " ;"
        values.append(f'  <http://bp4mc2.org/ltg#entiteitId> "{escape_sparql_literal(entity_id)}"')

    if previous_value:
        values[-1] += " ;"
        values.append(f'  <http://bp4mc2.org/ltg#oudeWaarde> "{escape_sparql_literal(previous_value)}"')

    if new_value:
        values[-1] += " ;"
        values.append(f'  <http://bp4mc2.org/ltg#nieuweWaarde> "{escape_sparql_literal(new_value)}"')

    if reason:
        values[-1] += " ;"
        values.append(f'  <http://bp4mc2.org/ltg#reden> "{escape_sparql_literal(reason)}"')

    if proposal_id:
        values[-1] += " ;"
        values.append(f'  <http://bp4mc2.org/ltg#gerelateerdVoorstelId> "{escape_sparql_literal(proposal_id)}"')

    values[-1] += " ."

    sparql_update(
        "\n".join(
            [
                "INSERT DATA {",
                f"  GRAPH <{GOVERNANCE_GRAPH}> {{",
                *values,
                "  }",
                "}",
            ]
        )
    )

    return {
        "id": audit_id,
        "timestamp": _now_iso_datetime(),
        "actor": actor,
        "action": action,
        "entityLabel": entity_label,
        "entityType": entity_type,
        "entityId": entity_id,
        "previousValue": previous_value,
        "newValue": new_value,
        "reason": reason,
        "proposalId": proposal_id,
    }


def list_proposals(status: Optional[str] = None, entity_type: Optional[str] = None, q: Optional[str] = None) -> List[Dict]:
    sparql = f'''
    PREFIX ltg: <http://bp4mc2.org/ltg#>
    SELECT ?proposalId ?title ?description ?entityType ?entityLabel ?entityId ?status ?submittedBy ?submittedAt ?reason
    WHERE {{
      GRAPH <{GOVERNANCE_GRAPH}> {{
        ?proposal a ltg:Voorstel ;
                  ltg:voorstelId ?proposalId ;
                  ltg:voorstelTitel ?title ;
                  ltg:voorstelOmschrijving ?description ;
                  ltg:entiteitType ?entityType ;
                  ltg:entiteitLabel ?entityLabel ;
                  ltg:status ?status ;
                  ltg:ingediendDoor ?submittedBy ;
                  ltg:ingediendOp ?submittedAt .
        OPTIONAL {{ ?proposal ltg:entiteitId ?entityId . }}
        OPTIONAL {{ ?proposal ltg:reden ?reason . }}
      }}
    }}
    ORDER BY DESC(?submittedAt)
    '''
    bindings = sparql_query(sparql).get("results", {}).get("bindings", [])

    proposals = []
    for item in bindings:
        status_iri = _bind_value(item, "status") or ""
        proposals.append(
            {
                "id": _bind_value(item, "proposalId") or "",
                "title": _bind_value(item, "title") or "",
                "description": _bind_value(item, "description") or "",
                "entityType": _bind_value(item, "entityType") or "",
                "entityLabel": _bind_value(item, "entityLabel") or "",
                "entityId": _bind_value(item, "entityId"),
                "status": PROPOSAL_IRI_TO_STATUS.get(status_iri, "Ingediend"),
                "submittedBy": _bind_value(item, "submittedBy") or "",
                "submittedAt": _bind_value(item, "submittedAt") or "",
                "reason": _bind_value(item, "reason"),
            }
        )

    status_filter = (status or "").strip()
    entity_filter = (entity_type or "").strip()
    query_filter = _normalize_search(q)

    filtered = []
    for proposal in proposals:
        if status_filter and proposal["status"] != status_filter:
            continue
        if entity_filter and proposal["entityType"] != entity_filter:
            continue
        if query_filter:
            haystack = " ".join(
                [
                    proposal["title"],
                    proposal["description"],
                    proposal["entityLabel"],
                    proposal.get("reason") or "",
                ]
            ).lower()
            if query_filter not in haystack:
                continue
        filtered.append(proposal)

    return filtered


def get_proposal(proposal_id: str) -> Optional[Dict]:
    matches = [item for item in list_proposals() if item["id"] == proposal_id]
    return matches[0] if matches else None


def create_proposal(
    title: str,
    description: str,
    entity_type: str,
    entity_label: str,
    submitted_by: str,
    entity_id: Optional[str] = None,
    reason: Optional[str] = None,
) -> Dict:
    proposal_id = f"vst-{uuid4().hex[:8]}"
    proposal_uri = _proposal_uri(proposal_id)

    triples = [
        f'<{proposal_uri}> a <http://bp4mc2.org/ltg#Voorstel> ;',
        f'  <http://bp4mc2.org/ltg#voorstelId> "{escape_sparql_literal(proposal_id)}" ;',
        f'  <http://bp4mc2.org/ltg#voorstelTitel> "{escape_sparql_literal(title)}" ;',
        f'  <http://bp4mc2.org/ltg#voorstelOmschrijving> "{escape_sparql_literal(description)}" ;',
        f'  <http://bp4mc2.org/ltg#entiteitType> "{escape_sparql_literal(entity_type)}" ;',
        f'  <http://bp4mc2.org/ltg#entiteitLabel> "{escape_sparql_literal(entity_label)}" ;',
        f'  <http://bp4mc2.org/ltg#status> <{PROPOSAL_STATUS_TO_IRI["Ingediend"]}> ;',
        f'  <http://bp4mc2.org/ltg#ingediendDoor> "{escape_sparql_literal(submitted_by)}" ;',
        f'  <http://bp4mc2.org/ltg#ingediendOp> "{_today_iso_date()}"^^<http://www.w3.org/2001/XMLSchema#date> ',
    ]

    if entity_id:
        triples[-1] += ";"
        triples.append(f'  <http://bp4mc2.org/ltg#entiteitId> "{escape_sparql_literal(entity_id)}" ')

    if reason:
        triples[-1] += ";"
        triples.append(f'  <http://bp4mc2.org/ltg#reden> "{escape_sparql_literal(reason)}" ')

    triples[-1] += "."

    sparql_update(
        "\n".join(
            [
                "INSERT DATA {",
                f"  GRAPH <{GOVERNANCE_GRAPH}> {{",
                *triples,
                "  }",
                "}",
            ]
        )
    )

    _append_audit_event(
        actor=submitted_by,
        action="Voorstel ingediend",
        entity_label=entity_label,
        entity_type=entity_type,
        entity_id=entity_id,
        reason=reason,
        proposal_id=proposal_id,
    )

    return {
        "id": proposal_id,
        "title": title,
        "description": description,
        "entityType": entity_type,
        "entityLabel": entity_label,
        "entityId": entity_id,
        "status": "Ingediend",
        "submittedBy": submitted_by,
        "submittedAt": _today_iso_date(),
        "reason": reason,
    }


def update_proposal_status(
    proposal_id: str,
    new_status: str,
    actor: str,
    reason: Optional[str] = None,
) -> Dict:
    proposal = get_proposal(proposal_id)
    if not proposal:
        raise ValueError("Voorstel niet gevonden")

    current_status = proposal["status"]
    if new_status not in PROPOSAL_STATUS_TO_IRI:
        raise ValueError("Ongeldige voorstelstatus")

    if new_status not in PROPOSAL_TRANSITIONS.get(current_status, set()):
        raise ValueError(f"Statusovergang niet toegestaan: {current_status} -> {new_status}")

    status_iri = PROPOSAL_STATUS_TO_IRI[new_status]
    sparql_update(
        f'''
        PREFIX ltg: <http://bp4mc2.org/ltg#>
        DELETE {{
          GRAPH <{GOVERNANCE_GRAPH}> {{
            ?proposal ltg:status ?oldStatus .
          }}
        }}
        INSERT {{
          GRAPH <{GOVERNANCE_GRAPH}> {{
            ?proposal ltg:status <{status_iri}> .
          }}
        }}
        WHERE {{
          GRAPH <{GOVERNANCE_GRAPH}> {{
            ?proposal a ltg:Voorstel ;
                      ltg:voorstelId "{escape_sparql_literal(proposal_id)}" ;
                      ltg:status ?oldStatus .
          }}
        }}
        '''
    )

    if reason is not None:
        sparql_update(
            f'''
            PREFIX ltg: <http://bp4mc2.org/ltg#>
            DELETE {{
              GRAPH <{GOVERNANCE_GRAPH}> {{
                ?proposal ltg:reden ?oldReason .
              }}
            }}
            INSERT {{
              GRAPH <{GOVERNANCE_GRAPH}> {{
                ?proposal ltg:reden "{escape_sparql_literal(reason)}" .
              }}
            }}
            WHERE {{
              GRAPH <{GOVERNANCE_GRAPH}> {{
                ?proposal a ltg:Voorstel ;
                          ltg:voorstelId "{escape_sparql_literal(proposal_id)}" .
                OPTIONAL {{ ?proposal ltg:reden ?oldReason . }}
              }}
            }}
            '''
        )

    audit_action = {
        "Goedgekeurd": "Voorstel goedgekeurd",
        "Afgewezen": "Voorstel afgewezen",
        "Teruggetrokken": "Voorstel teruggetrokken",
        "In behandeling": "Status wijziging",
    }.get(new_status, "Status wijziging")

    _append_audit_event(
        actor=actor,
        action=audit_action,
        entity_label=proposal["entityLabel"],
        entity_type=proposal["entityType"],
        entity_id=proposal.get("entityId"),
        previous_value=current_status,
        new_value=new_status,
        reason=reason,
        proposal_id=proposal_id,
    )

    updated = proposal.copy()
    updated["status"] = new_status
    if reason is not None:
        updated["reason"] = reason
    return updated


def list_comments(
    status: Optional[str] = None,
    entity_id: Optional[str] = None,
    q: Optional[str] = None,
) -> List[Dict]:
    sparql = f'''
    PREFIX ltg: <http://bp4mc2.org/ltg#>
    SELECT ?commentId ?text ?entityLabel ?entityId ?entityType ?status ?submittedBy ?submittedAt ?resolution
    WHERE {{
      GRAPH <{GOVERNANCE_GRAPH}> {{
        ?comment a ltg:Opmerking ;
                 ltg:commentId ?commentId ;
                 ltg:commentTekst ?text ;
                 ltg:entiteitLabel ?entityLabel ;
                 ltg:entiteitType ?entityType ;
                 ltg:status ?status ;
                 ltg:ingediendDoor ?submittedBy ;
                 ltg:ingediendOp ?submittedAt .
        OPTIONAL {{ ?comment ltg:entiteitId ?entityId . }}
        OPTIONAL {{ ?comment ltg:afhandeling ?resolution . }}
      }}
    }}
    ORDER BY DESC(?submittedAt)
    '''
    bindings = sparql_query(sparql).get("results", {}).get("bindings", [])

    comments = []
    for item in bindings:
        status_iri = _bind_value(item, "status") or ""
        comments.append(
            {
                "id": _bind_value(item, "commentId") or "",
                "text": _bind_value(item, "text") or "",
                "entityLabel": _bind_value(item, "entityLabel") or "",
                "entityId": _bind_value(item, "entityId"),
                "entityType": _bind_value(item, "entityType") or "",
                "status": COMMENT_IRI_TO_STATUS.get(status_iri, "Nieuw"),
                "submittedBy": _bind_value(item, "submittedBy") or "",
                "submittedAt": _bind_value(item, "submittedAt") or "",
                "resolution": _bind_value(item, "resolution"),
            }
        )

    status_filter = (status or "").strip()
    entity_id_filter = (entity_id or "").strip()
    query_filter = _normalize_search(q)

    filtered = []
    for comment in comments:
        if status_filter and comment["status"] != status_filter:
            continue
        if entity_id_filter and (comment.get("entityId") or "") != entity_id_filter:
            continue
        if query_filter:
            haystack = " ".join(
                [
                    comment["text"],
                    comment["entityLabel"],
                    comment.get("resolution") or "",
                    comment["submittedBy"],
                ]
            ).lower()
            if query_filter not in haystack:
                continue
        filtered.append(comment)

    return filtered


def get_comment(comment_id: str) -> Optional[Dict]:
    matches = [item for item in list_comments() if item["id"] == comment_id]
    return matches[0] if matches else None


def create_comment(
    text: str,
    entity_label: str,
    entity_type: str,
    submitted_by: str,
    entity_id: Optional[str] = None,
) -> Dict:
    comment_id = f"opm-{uuid4().hex[:8]}"
    comment_uri = _comment_uri(comment_id)

    triples = [
        f'<{comment_uri}> a <http://bp4mc2.org/ltg#Opmerking> ;',
        f'  <http://bp4mc2.org/ltg#commentId> "{escape_sparql_literal(comment_id)}" ;',
        f'  <http://bp4mc2.org/ltg#commentTekst> "{escape_sparql_literal(text)}" ;',
        f'  <http://bp4mc2.org/ltg#entiteitLabel> "{escape_sparql_literal(entity_label)}" ;',
        f'  <http://bp4mc2.org/ltg#entiteitType> "{escape_sparql_literal(entity_type)}" ;',
        f'  <http://bp4mc2.org/ltg#status> <{COMMENT_STATUS_TO_IRI["Nieuw"]}> ;',
        f'  <http://bp4mc2.org/ltg#ingediendDoor> "{escape_sparql_literal(submitted_by)}" ;',
        f'  <http://bp4mc2.org/ltg#ingediendOp> "{_today_iso_date()}"^^<http://www.w3.org/2001/XMLSchema#date> ',
    ]

    if entity_id:
        triples[-1] += ";"
        triples.append(f'  <http://bp4mc2.org/ltg#entiteitId> "{escape_sparql_literal(entity_id)}" ')

    triples[-1] += "."

    sparql_update(
        "\n".join(
            [
                "INSERT DATA {",
                f"  GRAPH <{GOVERNANCE_GRAPH}> {{",
                *triples,
                "  }",
                "}",
            ]
        )
    )

    _append_audit_event(
        actor=submitted_by,
        action="Opmerking ingediend",
        entity_label=entity_label,
        entity_type=entity_type,
        entity_id=entity_id,
        reason=text,
    )

    return {
        "id": comment_id,
        "text": text,
        "entityLabel": entity_label,
        "entityId": entity_id,
        "entityType": entity_type,
        "status": "Nieuw",
        "submittedBy": submitted_by,
        "submittedAt": _today_iso_date(),
        "resolution": None,
    }


def update_comment_status(
    comment_id: str,
    new_status: str,
    actor: str,
    resolution: Optional[str] = None,
) -> Dict:
    comment = get_comment(comment_id)
    if not comment:
        raise ValueError("Opmerking niet gevonden")

    current_status = comment["status"]
    if new_status not in COMMENT_STATUS_TO_IRI:
        raise ValueError("Ongeldige opmerkingstatus")

    if new_status not in COMMENT_TRANSITIONS.get(current_status, set()):
        raise ValueError(f"Statusovergang niet toegestaan: {current_status} -> {new_status}")

    status_iri = COMMENT_STATUS_TO_IRI[new_status]
    sparql_update(
        f'''
        PREFIX ltg: <http://bp4mc2.org/ltg#>
        DELETE {{
          GRAPH <{GOVERNANCE_GRAPH}> {{
            ?comment ltg:status ?oldStatus .
          }}
        }}
        INSERT {{
          GRAPH <{GOVERNANCE_GRAPH}> {{
            ?comment ltg:status <{status_iri}> .
          }}
        }}
        WHERE {{
          GRAPH <{GOVERNANCE_GRAPH}> {{
            ?comment a ltg:Opmerking ;
                     ltg:commentId "{escape_sparql_literal(comment_id)}" ;
                     ltg:status ?oldStatus .
          }}
        }}
        '''
    )

    if resolution is not None:
        sparql_update(
            f'''
            PREFIX ltg: <http://bp4mc2.org/ltg#>
            DELETE {{
              GRAPH <{GOVERNANCE_GRAPH}> {{
                ?comment ltg:afhandeling ?oldResolution .
              }}
            }}
            INSERT {{
              GRAPH <{GOVERNANCE_GRAPH}> {{
                ?comment ltg:afhandeling "{escape_sparql_literal(resolution)}" .
              }}
            }}
            WHERE {{
              GRAPH <{GOVERNANCE_GRAPH}> {{
                ?comment a ltg:Opmerking ;
                         ltg:commentId "{escape_sparql_literal(comment_id)}" .
                OPTIONAL {{ ?comment ltg:afhandeling ?oldResolution . }}
              }}
            }}
            '''
        )

    _append_audit_event(
        actor=actor,
        action="Status wijziging",
        entity_label=comment["entityLabel"],
        entity_type=comment["entityType"],
        entity_id=comment.get("entityId"),
        previous_value=current_status,
        new_value=new_status,
        reason=resolution,
    )

    updated = comment.copy()
    updated["status"] = new_status
    if resolution is not None:
        updated["resolution"] = resolution
    return updated


def escalate_comment_to_proposal(
    comment_id: str,
    actor: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> Dict:
    comment = get_comment(comment_id)
    if not comment:
        raise ValueError("Opmerking niet gevonden")

    proposal = create_proposal(
        title=title or f"Voorstel op basis van opmerking {comment_id}",
        description=description or comment["text"],
        entity_type=comment["entityType"],
        entity_label=comment["entityLabel"],
        entity_id=comment.get("entityId"),
        submitted_by=actor,
        reason=f"Geescaleerd vanuit opmerking {comment_id}",
    )

    _append_audit_event(
        actor=actor,
        action="Opmerking geescaleerd naar voorstel",
        entity_label=comment["entityLabel"],
        entity_type=comment["entityType"],
        entity_id=comment.get("entityId"),
        reason=comment_id,
        proposal_id=proposal["id"],
    )

    return proposal


def list_audit_log(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    q: Optional[str] = None,
) -> List[Dict]:
    sparql = f'''
    PREFIX ltg: <http://bp4mc2.org/ltg#>
    SELECT ?auditId ?timestamp ?actor ?action ?entityLabel ?entityId ?entityType ?previous ?newValue ?reason ?proposalId
    WHERE {{
      GRAPH <{GOVERNANCE_GRAPH}> {{
        ?audit a ltg:AuditEvent ;
               ltg:auditId ?auditId ;
               ltg:tijdstip ?timestamp ;
               ltg:actor ?actor ;
               ltg:actie ?action ;
               ltg:entiteitLabel ?entityLabel ;
               ltg:entiteitType ?entityType .
        OPTIONAL {{ ?audit ltg:entiteitId ?entityId . }}
        OPTIONAL {{ ?audit ltg:oudeWaarde ?previous . }}
        OPTIONAL {{ ?audit ltg:nieuweWaarde ?newValue . }}
        OPTIONAL {{ ?audit ltg:reden ?reason . }}
        OPTIONAL {{ ?audit ltg:gerelateerdVoorstelId ?proposalId . }}
      }}
    }}
    ORDER BY DESC(?timestamp)
    '''

    bindings = sparql_query(sparql).get("results", {}).get("bindings", [])

    entries = []
    for item in bindings:
        entries.append(
            {
                "id": _bind_value(item, "auditId") or "",
                "timestamp": _bind_value(item, "timestamp") or "",
                "actor": _bind_value(item, "actor") or "",
                "action": _bind_value(item, "action") or "",
                "entityLabel": _bind_value(item, "entityLabel") or "",
                "entityId": _bind_value(item, "entityId"),
                "entityType": _bind_value(item, "entityType") or "",
                "previousValue": _bind_value(item, "previous"),
                "newValue": _bind_value(item, "newValue"),
                "reason": _bind_value(item, "reason"),
                "proposalId": _bind_value(item, "proposalId"),
            }
        )

    action_filter = (action or "").strip()
    entity_filter = (entity_type or "").strip()
    entity_id_filter = (entity_id or "").strip()
    query_filter = _normalize_search(q)

    filtered = []
    for entry in entries:
        if action_filter and entry["action"] != action_filter:
            continue
        if entity_filter and entry["entityType"] != entity_filter:
            continue
        if entity_id_filter and (entry.get("entityId") or "") != entity_id_filter:
            continue
        if query_filter:
            haystack = " ".join(
                [
                    entry["entityLabel"],
                    entry["actor"],
                    entry["action"],
                    entry.get("reason") or "",
                ]
            ).lower()
            if query_filter not in haystack:
                continue
        filtered.append(entry)

    return filtered
