from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
from api.services.access_policy import require_action

from api.services.sticky_notes_service import (
    list_sticky_notes,
    search_technology_suggestions,
    update_sticky_note_review,
)


class LinkedTechSchema(Schema):
    uri = fields.Str(required=True)
    name = fields.Str(required=True)


class BoardSchema(Schema):
    uri = fields.Str(required=True)
    name = fields.Str(required=True)


class TaaktypeSchema(Schema):
    uri = fields.Str(required=True)
    name = fields.Str(required=True)


class StickyNoteSchema(Schema):
    uri = fields.Str(required=True)
    noteId = fields.Str(required=True)
    text = fields.Str(required=True)
    statusIri = fields.Str(required=True)
    status = fields.Str(required=True)
    section = fields.Str(required=True)
    color = fields.Str(required=True)
    omschrijvingAfhandeling = fields.Str(required=False, load_default="")
    board = fields.Nested(BoardSchema, required=True)
    taaktype = fields.Nested(TaaktypeSchema, required=True)
    linkedTechnology = fields.Nested(LinkedTechSchema, required=True)
    candidateTechnologies = fields.List(fields.Nested(LinkedTechSchema), required=True)


class StickyNotesQuerySchema(Schema):
    board = fields.Str(required=False)
    status = fields.Str(required=False)
    q = fields.Str(required=False)
    linkMode = fields.Str(required=False)
    technologyUri = fields.Str(required=False)


class StickyTechSuggestionsQuerySchema(Schema):
    q = fields.Str(required=False)
    limit = fields.Int(required=False)


class StickyNoteReviewSchema(Schema):
    noteUri = fields.Str(required=True)
    statusIri = fields.Str(required=False)
    definitiveTechnologyUri = fields.Str(required=False)
    moveCandidateToDefinitiveUri = fields.Str(required=False)
    omschrijvingAfhandeling = fields.Str(required=False, load_default=None)
    taaktypeIri = fields.Str(required=False)


class TechSuggestionSchema(Schema):
    uri = fields.Str(required=True)
    name = fields.Str(required=True)


blp = Blueprint(
    "sticky_notes",
    "sticky_notes",
    url_prefix="/api/stickynotes",
    description="Endpoints for board sticky notes",
)


@blp.route("", methods=["GET"])
@blp.arguments(StickyNotesQuerySchema, location="query")
@blp.response(200, StickyNoteSchema(many=True))
def get_sticky_notes(args):
    """List sticky notes with optional filtering."""
    return list_sticky_notes(
        board=args.get("board"),
        status=args.get("status"),
        q=args.get("q"),
        link_mode=args.get("linkMode"),
        technology_uri=args.get("technologyUri"),
    )


@blp.route("/review", methods=["PATCH"])
@blp.arguments(StickyNoteReviewSchema)
@blp.response(200, StickyNoteSchema)
def patch_sticky_note_review(args):
    """Update review fields for one sticky note."""
    denied = require_action("sticky_note:review", "sticky_note")
    if denied:
        return denied

    try:
        return update_sticky_note_review(
            note_uri=args.get("noteUri", ""),
            status_iri=args.get("statusIri"),
            definitive_technology_uri=args.get("definitiveTechnologyUri"),
            move_candidate_to_definitive_uri=args.get("moveCandidateToDefinitiveUri"),
            omschrijving_afhandeling=args.get("omschrijvingAfhandeling"),
            taaktype_iri=args.get("taaktypeIri"),
        )
    except ValueError as exc:
        abort(400, message=str(exc))


@blp.route("/tech-suggestions", methods=["GET"])
@blp.arguments(StickyTechSuggestionsQuerySchema, location="query")
@blp.response(200, TechSuggestionSchema(many=True))
def get_technology_suggestions(args):
    """Find legal technologies by name for autocomplete."""
    return search_technology_suggestions(q=args.get("q"), limit=args.get("limit", 15))
