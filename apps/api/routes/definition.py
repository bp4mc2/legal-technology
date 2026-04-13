from flask_smorest import Blueprint, abort
from api.services.terms_service import (
    list_definitions, add_definition, get_definition, update_definition, delete_definition
)
from api.models.definition import DefinitionSchema, DefinitionCreateSchema, DefinitionUpdateSchema

blp = Blueprint("definition", "definition", url_prefix="/api/definitions", description="Endpoints for SKOS definitions")



# GET: List all definitions
@blp.route("", methods=["GET"])
@blp.response(200, DefinitionSchema(many=True))
def list_defs():
    """List all SKOS definitions"""
    return list_definitions()

# POST: Add a new definition
@blp.route("", methods=["POST"])
@blp.arguments(DefinitionCreateSchema)
@blp.response(201, DefinitionSchema)
def add_def(data):
    """Add a new SKOS definition"""
    return add_definition(data)

@blp.route("/<id>")
@blp.response(200, DefinitionSchema)
def get_def(id):
    """Get a SKOS definition by id"""
    result = get_definition(id)
    if not result:
        abort(404, message="Not found")
    return result

@blp.route("/<id>", methods=["PUT"])
@blp.arguments(DefinitionUpdateSchema)
@blp.response(200, DefinitionSchema)
def update_def(data, id):
    """Update a SKOS definition by id"""
    # Check if the definition exists before updating
    if not get_definition(id):
        abort(404, message="Not found")
    return update_definition(id, data)

@blp.route("/<id>", methods=["DELETE"])
@blp.response(204)
def delete_def(id):
    """Delete a SKOS definition by id"""
    result = get_definition(id)
    if not result:
        abort(404, message="Not found")
    delete_definition(id)
    return None
