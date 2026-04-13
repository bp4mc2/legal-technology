from flask_smorest import Blueprint, abort
from flask import request, Response
from api.services.graphdb_service import (
    search_legal_technologies, add_legal_technology, get_legal_technology, update_legal_technology,
    delete_legal_technology, list_enumerations, get_stats,
    export_legal_technology_turtle, export_legal_technology_markdown
)
from api.models.legal_technology import LegalTechnologySchema, LegalTechnologyCreateSchema, LegalTechnologyUpdateSchema
from api.models.enumeration import EnumerationSchema

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
    enums = list_enumerations()
    values = enums.get(enum_name)
    if values is None:
        abort(404, message=f"Enumeration '{enum_name}' not found")
    return {"name": enum_name, "values": values}

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
