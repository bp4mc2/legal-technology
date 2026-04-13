"""Routes for managing organisations (lto:Organisatie)."""

from flask_smorest import Blueprint, abort
from flask import Response
from api.services.organisation_service import (
    list_organisations, get_organisation, add_organisation, 
    update_organisation, delete_organisation, export_organisation_turtle
)
from api.models.organisation import (
    OrganisatieSchema, OrganisatieCreateSchema, OrganisatieUpdateSchema
)

blp = Blueprint(
    "organisations",
    "organisations",
    url_prefix="/api/organisations",
    description="Endpoints for managing organisations (lto:Organisatie) as reusable resources."
)


@blp.route("")
@blp.response(200, OrganisatieSchema(many=True))
def list_all():
    """
    List all organisations.
    ---
    responses:
        200:
            description: List of all organisations
    """
    return list_organisations()


@blp.route("", methods=["POST"])
@blp.arguments(OrganisatieCreateSchema)
@blp.response(201, OrganisatieSchema)
def add(data):
    """
    Add a new organisation.
    ---
    requestBody:
        required: true
        content:
            application/json:
                schema: OrganisatieCreateSchema
    responses:
        201:
            description: The created organisation
        400:
            description: Invalid input
    """
    try:
        return add_organisation(data)
    except Exception as e:
        abort(400, message=str(e))


@blp.route("/<path:iri>")
@blp.response(200, OrganisatieSchema)
def get(iri):
    """
    Get an organisation by IRI (URL-encoded).
    ---
    parameters:
        - in: path
            name: iri
            schema:
                type: string
            required: true
            description: The IRI of the organisation (URL-encoded)
    responses:
        200:
            description: The organisation
        404:
            description: Not found
    """
    result = get_organisation(iri)
    if not result:
        abort(404, message="Organisation not found")
    return result


@blp.route("/<path:iri>", methods=["PUT"])
@blp.arguments(OrganisatieUpdateSchema)
@blp.response(200, OrganisatieSchema)
def update(data, iri):
    """
    Update an organisation by IRI.
    ---
    parameters:
        - in: path
            name: iri
            schema:
                type: string
            required: true
            description: The IRI of the organisation (URL-encoded)
    requestBody:
        required: true
        content:
            application/json:
                schema: OrganisatieUpdateSchema
    responses:
        200:
            description: The updated organisation
        404:
            description: Not found
    """
    result = update_organisation(iri, data)
    if not result:
        abort(404, message="Organisation not found")
    return result


@blp.route("/<path:iri>", methods=["DELETE"])
@blp.response(200, OrganisatieSchema)
def delete(iri):
    """
    Delete an organisation by IRI.
    ---
    parameters:
        - in: path
            name: iri
            schema:
                type: string
            required: true
            description: The IRI of the organisation (URL-encoded)
    responses:
        200:
            description: The deleted organisation
        404:
            description: Not found
    """
    result = delete_organisation(iri)
    if not result:
        abort(404, message="Organisation not found")
    return result


@blp.route("/<path:iri>/export.ttl")
def export_turtle(iri):
    """Download one organisation as Turtle."""
    turtle = export_organisation_turtle(iri)
    if turtle is None:
        abort(404, message="Organisation not found")
    filename = iri.rstrip('/').split('/')[-1] or 'organisatie'
    return Response(
        turtle,
        mimetype="text/turtle; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="organisatie-{filename}.ttl"'}
    )
