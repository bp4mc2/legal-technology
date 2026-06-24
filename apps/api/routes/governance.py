from flask_smorest import Blueprint, abort

from api.models.governance import (
    AuditEntrySchema,
    AuditQuerySchema,
    CommentCreateSchema,
    CommentSchema,
    CommentsQuerySchema,
    CommentStatusUpdateSchema,
    EscalateCommentSchema,
    GovernancePermissionsSchema,
    ProposalCreateSchema,
    ProposalSchema,
    ProposalsQuerySchema,
    ProposalStatusUpdateSchema,
)
from api.services.access_policy import (
    get_current_role,
    get_request_actor_id,
    is_action_allowed,
    require_action,
)
from api.services.governance_service import (
    create_comment,
    create_proposal,
    escalate_comment_to_proposal,
    list_audit_log,
    list_comments,
    list_proposals,
    update_comment_status,
    update_proposal_status,
)


blp = Blueprint(
    "governance",
    "governance",
    url_prefix="/api/governance",
    description="Endpoints voor governance workflows: voorstellen, opmerkingen en auditlog",
)


@blp.route("/permissions", methods=["GET"])
@blp.response(200, GovernancePermissionsSchema)
def get_permissions():
    actions = {
        "proposal.create": is_action_allowed("governance:proposal:create"),
        "proposal.approve": is_action_allowed("governance:proposal:approve"),
        "proposal.reject": is_action_allowed("governance:proposal:reject"),
        "proposal.withdraw": is_action_allowed("governance:proposal:withdraw"),
        "comment.create": is_action_allowed("governance:comment:create"),
        "comment.update_status": is_action_allowed("governance:comment:update_status"),
        "comment.escalate": is_action_allowed("governance:comment:escalate"),
        "audit.read": is_action_allowed("governance:audit:read"),
    }
    return {"role": get_current_role(), "actions": actions}


@blp.route("/proposals", methods=["GET"])
@blp.arguments(ProposalsQuerySchema, location="query")
@blp.response(200, ProposalSchema(many=True))
def get_proposals(args):
    denied = require_action("governance:proposal:read", "governance_proposal")
    if denied:
        return denied

    return list_proposals(
        status=args.get("status"),
        entity_type=args.get("entityType"),
        q=args.get("q"),
    )


@blp.route("/proposals", methods=["POST"])
@blp.arguments(ProposalCreateSchema)
@blp.response(201, ProposalSchema)
def post_proposal(args):
    denied = require_action("governance:proposal:create", "governance_proposal")
    if denied:
        return denied

    actor_id = get_request_actor_id()
    try:
        return create_proposal(
            title=args["title"],
            description=args["description"],
            entity_type=args["entityType"],
            entity_label=args["entityLabel"],
            entity_id=args.get("entityId"),
            reason=args.get("reason"),
            submitted_by=actor_id,
        )
    except ValueError as exc:
        abort(400, message=str(exc))


@blp.route("/proposals/<proposal_id>/status", methods=["PATCH"])
@blp.arguments(ProposalStatusUpdateSchema)
@blp.response(200, ProposalSchema)
def patch_proposal_status(args, proposal_id):
    target_status = args.get("status")

    if target_status == "Goedgekeurd":
        denied = require_action("governance:proposal:approve", "governance_proposal")
    elif target_status == "Afgewezen":
        denied = require_action("governance:proposal:reject", "governance_proposal")
    elif target_status == "Teruggetrokken":
        denied = require_action("governance:proposal:withdraw", "governance_proposal")
    else:
        denied = require_action("governance:proposal:update_status", "governance_proposal")

    if denied:
        return denied

    try:
        return update_proposal_status(
            proposal_id=proposal_id,
            new_status=target_status,
            actor=get_request_actor_id(),
            reason=args.get("reason"),
        )
    except ValueError as exc:
        message = str(exc)
        if "niet gevonden" in message.lower():
            abort(404, message=message)
        abort(400, message=message)


@blp.route("/comments", methods=["GET"])
@blp.arguments(CommentsQuerySchema, location="query")
@blp.response(200, CommentSchema(many=True))
def get_comments(args):
    denied = require_action("governance:comment:read", "governance_comment")
    if denied:
        return denied

    return list_comments(
        status=args.get("status"),
        entity_id=args.get("entityId"),
        q=args.get("q"),
    )


@blp.route("/comments", methods=["POST"])
@blp.arguments(CommentCreateSchema)
@blp.response(201, CommentSchema)
def post_comment(args):
    denied = require_action("governance:comment:create", "governance_comment")
    if denied:
        return denied

    try:
        return create_comment(
            text=args["text"],
            entity_label=args["entityLabel"],
            entity_type=args["entityType"],
            entity_id=args.get("entityId"),
            submitted_by=get_request_actor_id(),
        )
    except ValueError as exc:
        abort(400, message=str(exc))


@blp.route("/comments/<comment_id>/status", methods=["PATCH"])
@blp.arguments(CommentStatusUpdateSchema)
@blp.response(200, CommentSchema)
def patch_comment_status(args, comment_id):
    denied = require_action("governance:comment:update_status", "governance_comment")
    if denied:
        return denied

    try:
        return update_comment_status(
            comment_id=comment_id,
            new_status=args["status"],
            actor=get_request_actor_id(),
            resolution=args.get("resolution"),
        )
    except ValueError as exc:
        message = str(exc)
        if "niet gevonden" in message.lower():
            abort(404, message=message)
        abort(400, message=message)


@blp.route("/comments/<comment_id>/escalate", methods=["POST"])
@blp.arguments(EscalateCommentSchema)
@blp.response(201, ProposalSchema)
def post_comment_escalate(args, comment_id):
    denied = require_action("governance:comment:escalate", "governance_comment")
    if denied:
        return denied

    try:
        return escalate_comment_to_proposal(
            comment_id=comment_id,
            actor=get_request_actor_id(),
            title=args.get("title"),
            description=args.get("description"),
        )
    except ValueError as exc:
        message = str(exc)
        if "niet gevonden" in message.lower():
            abort(404, message=message)
        abort(400, message=message)


@blp.route("/audit-log", methods=["GET"])
@blp.arguments(AuditQuerySchema, location="query")
@blp.response(200, AuditEntrySchema(many=True))
def get_audit_log(args):
    denied = require_action("governance:audit:read", "governance_audit")
    if denied:
        return denied

    return list_audit_log(
        action=args.get("action"),
        entity_type=args.get("entityType"),
        entity_id=args.get("entityId"),
        q=args.get("q"),
    )
