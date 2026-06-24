from flask_smorest import Blueprint, abort
from flask import request, Response, jsonify
from uuid import uuid4
from api.services.graphdb_service import (
    search_legal_technologies, add_legal_technology, get_legal_technology, update_legal_technology,
    delete_legal_technology, list_enumerations, list_tasktypes, get_stats,
    list_sticky_note_status_enumeration_items,
    export_legal_technology_turtle, export_legal_technology_markdown,
    export_named_graph_download, sync_named_graph_exports,
)
from api.services.documentation_service import (
    DocumentationReadError,
    get_documentation_hub_payload,
    get_technology_documentation,
    get_catalog_documentation,
    get_generated_documentation_sections,
)
from api.services.access_policy import require_action
from api.models.legal_technology import LegalTechnologySchema, LegalTechnologyCreateSchema, LegalTechnologyUpdateSchema
from api.models.enumeration import EnumerationSchema, TaskTypeSchema

blp = Blueprint(
    "legal_technology",
    "legal_technology",
    url_prefix="/api/legaltechnologies",
    description="""
    Endpoints for managing legal technologies and enumerations.
    
    - All fields are validated according to the ontology.
    - Enumerations are available via /enumerations endpoints.
    - See OpenAPI schema for all required and optional fields.
    """
)

@blp.route("/search")
@blp.response(200, LegalTechnologySchema(many=True))
def search():
    """
    Search legal technologies by name or description.
    ---
    parameters:
        - in: query
            name: q
            schema:
                type: string
            description: Search term for name or description
    responses:
        200:
            description: List of matching legal technologies
    """
    denied = require_action("legal_technology:search", "legal_technology")
    if denied:
        return denied
    query = request.args.get('q', '')
    return search_legal_technologies(query)


# GET: List all legal technologies
@blp.route("")
@blp.response(200, LegalTechnologySchema(many=True))
def list_all():
    """
    List all legal technologies.
    ---
    responses:
        200:
            description: List of all legal technologies
    """
    return search_legal_technologies("")

# POST: Add a new legal technology
@blp.route("", methods=["POST"])
@blp.arguments(LegalTechnologyCreateSchema)
@blp.response(201, LegalTechnologySchema)
def add(data):
    """
    Add a new legal technology.
    ---
    requestBody:
        required: true
        content:
            application/json:
                schema: LegalTechnologyCreateSchema
    responses:
        201:
            description: The created legal technology
    """
    denied = require_action("legal_technology:create", "legal_technology")
    if denied:
        return denied
    return add_legal_technology(data)

@blp.route("/<id>")
@blp.response(200, LegalTechnologySchema)
def get(id):
    """
    Get a legal technology by id.
    ---
    parameters:
        - in: path
            name: id
            schema:
                type: string
            required: true
            description: The ID of the legal technology
    responses:
        200:
            description: The legal technology
        404:
            description: Not found
    """
    result = get_legal_technology(id)
    if not result:
        abort(404, message="Not found")
    return result

@blp.route("/<id>", methods=["PUT"])
@blp.arguments(LegalTechnologyUpdateSchema)
@blp.response(200, LegalTechnologySchema)
def update(data, id):
    """
    Update a legal technology by id.
    ---
    parameters:
        - in: path
            name: id
            schema:
                type: string
            required: true
            description: The ID of the legal technology
    requestBody:
        required: true
        content:
            application/json:
                schema: LegalTechnologyUpdateSchema
    responses:
        200:
            description: The updated legal technology
    """
    denied = require_action("legal_technology:update", "legal_technology")
    if denied:
        return denied

    payload_id = data.pop("id", None)
    if payload_id is not None and payload_id != id:
        abort(400, message="Payload id must match URL id")

    result = update_legal_technology(id, data)
    if not result:
        abort(404, message="Not found")
    return result

@blp.route("/<id>", methods=["DELETE"])
@blp.response(200, LegalTechnologySchema)
def delete(id):
    """
    Delete a legal technology by id.
    ---
    parameters:
        - in: path
            name: id
            schema:
                type: string
            required: true
            description: The ID of the legal technology
    responses:
        200:
            description: The deleted legal technology
    """
    denied = require_action("legal_technology:delete", "legal_technology")
    if denied:
        return denied
    result = delete_legal_technology(id)
    if not result:
        abort(404, message="Not found")
    return result


@blp.route("/<id>/export.ttl")
def export_turtle(id):
    """Download a legal technology as Turtle."""
    turtle = export_legal_technology_turtle(id)
    if turtle is None:
        abort(404, message="Not found")
    return Response(
        turtle,
        mimetype="text/turtle; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="legal-technology-{id}.ttl"'}
    )


@blp.route("/export/all.ttl")
def export_named_graph_turtle_route():
    """Download the full named graph as Turtle."""
    turtle = export_named_graph_download()
    return Response(
        turtle,
        mimetype="text/turtle; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="all-legal-technologies.ttl"'}
    )


@blp.route("/export/sync", methods=["POST"])
def sync_named_graph_route():
    """Persist the named graph and bundle exports to the workspace data directory."""
    denied = require_action("legal_technology:sync_export", "legal_technology")
    if denied:
        return denied
    return sync_named_graph_exports()


@blp.route("/<id>/export.md")
def export_markdown(id):
    """Download a legal technology as Markdown."""
    markdown = export_legal_technology_markdown(id)
    if markdown is None:
        abort(404, message="Not found")
    return Response(
        markdown,
        mimetype="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="legal-technology-{id}.md"'}
    )


@blp.get("/<id>/documentation")
def documentation(id):
    """Return generated in-dashboard documentation section for a technology."""
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        payload = get_technology_documentation(id)
    except DocumentationReadError:
        return (
            jsonify(
                {
                    "message": "Generated documentation source is unavailable",
                    "source": "build/docs/includes/catalogus-details.md",
                    "correlation_id": correlation_id,
                }
            ),
            503,
            {"X-Correlation-ID": correlation_id},
        )

    if payload is None:
        return (
            jsonify(
                {
                    "message": "Documentation section not found",
                    "source": "build/docs/includes/catalogus-details.md",
                    "correlation_id": correlation_id,
                }
            ),
            404,
            {"X-Correlation-ID": correlation_id},
        )

    payload["correlation_id"] = correlation_id
    return jsonify(payload), 200, {"X-Correlation-ID": correlation_id}


@blp.get("/documentation/catalog")
def documentation_catalog():
    """Return full generated catalog documentation markdown."""
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        payload = get_catalog_documentation()
    except DocumentationReadError:
        return (
            jsonify(
                {
                    "message": "Generated catalog documentation source is unavailable",
                    "source": "build/docs/includes/catalogus-details.md",
                    "correlation_id": correlation_id,
                }
            ),
            503,
            {"X-Correlation-ID": correlation_id},
        )

    if payload is None:
        return (
            jsonify(
                {
                    "message": "Generated catalog documentation not found",
                    "source": "build/docs/includes/catalogus-details.md",
                    "correlation_id": correlation_id,
                }
            ),
            404,
            {"X-Correlation-ID": correlation_id},
        )

    payload["correlation_id"] = correlation_id
    return jsonify(payload), 200, {"X-Correlation-ID": correlation_id}


@blp.get("/documentation/generated")
def documentation_generated_sections():
    """Return generated markdown fragments for the documentation hub."""
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        sections = get_generated_documentation_sections()
    except DocumentationReadError:
        return (
            jsonify(
                {
                    "message": "Generated documentation sections are unavailable",
                    "sources": [
                        "build/docs/includes/catalogus-overzicht.md",
                        "build/docs/includes/catalogus-details.md",
                        "build/docs/includes/taxonomieen.md",
                        "build/docs/includes/organisaties.md",
                        "build/docs/includes/ontologie.md",
                        "build/docs/includes/generatieverantwoording.md",
                    ],
                    "correlation_id": correlation_id,
                }
            ),
            503,
            {"X-Correlation-ID": correlation_id},
        )

    payload = {
        "sections": sections,
        "section_count": len(sections),
        "correlation_id": correlation_id,
    }
    return jsonify(payload), 200, {"X-Correlation-ID": correlation_id}


@blp.get("/documentation/hub")
def documentation_hub():
    """Return generated and curated markdown fragments for the documentation hub."""
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        payload = get_documentation_hub_payload()
    except DocumentationReadError:
        return (
            jsonify(
                {
                    "message": "Documentation hub sources are unavailable",
                    "sources": [
                        "build/docs/includes/catalogus-overzicht.md",
                        "build/docs/includes/catalogus-details.md",
                        "build/docs/includes/taxonomieen.md",
                        "build/docs/includes/organisaties.md",
                        "build/docs/includes/ontologie.md",
                        "build/docs/includes/generatieverantwoording.md",
                        "docs/README.md",
                        "docs/meta-model.md",
                        "docs/typologie.md",
                    ],
                    "correlation_id": correlation_id,
                }
            ),
            503,
            {"X-Correlation-ID": correlation_id},
        )

    payload["correlation_id"] = correlation_id
    return jsonify(payload), 200, {"X-Correlation-ID": correlation_id}


# List all enumerations as a list of {name, values}
@blp.route("/enumerations")
@blp.response(200, EnumerationSchema(many=True))
def enumerations():
    """
    List all enumerations for legal technologies, including Functionaliteiten, Technologietypen, Taaktypen, Normstatussen, Gebruiksstatussen, Licentievormen, Gebruikersgroepen, as defined in the ontology SKOS ConceptSchemes.
    ---
    responses:
        200:
            description: List of all enumerations, each with a name and values, as defined in the ontology.
    """
    enums = list_enumerations()
    # Ensure all ontology enumerations are present, even if empty
    expected = [
        "Functionaliteiten", "Technologietypen", "Taaktypen", "Normstatussen", "Gebruiksstatussen", "Licentievormen", "Gebruikersgroepen"
    ]
    result = []
    for k in expected:
        result.append({"name": k, "values": enums.get(k, [])})
    # Add any extra enums found in the ontology
    for k, v in enums.items():
        if k not in expected:
            result.append({"name": k, "values": v})
    return result

# Get a specific enumeration by name
@blp.route("/enumerations/<enum_name>")
@blp.response(200, EnumerationSchema)
def get_enumeration(enum_name):
    """
    Get a specific enumeration by name.
    ---
    parameters:
        - in: path
            name: enum_name
            schema:
                type: string
            required: true
            description: The name of the enumeration group
    responses:
        200:
            description: The enumeration group and its values
        404:
            description: Enumeration not found
    """
    if enum_name == "StickyNoteStatussen":
        return {
            "name": enum_name,
            "values": list_sticky_note_status_enumeration_items(),
        }

    enums = list_enumerations()
    values = enums.get(enum_name)
    if values is None:
        abort(404, message=f"Enumeration '{enum_name}' not found")
    return {"name": enum_name, "values": values}


@blp.route("/tasktypes")
@blp.response(200, TaskTypeSchema(many=True))
def tasktypes():
    """
    List all task types from the separate task ontology, including descriptions.
    ---
    responses:
        200:
            description: List of task types with label and description
    """
    return list_tasktypes()

@blp.route("/stats")
@blp.response(200)
def stats():
    """
    Get statistics about legal technologies.
    ---
    responses:
        200:
            description: Statistics object
    """
    return get_stats()
