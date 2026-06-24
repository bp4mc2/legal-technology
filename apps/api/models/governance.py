from marshmallow import Schema, fields, validate


PROPOSAL_STATUSES = (
    "Ingediend",
    "In behandeling",
    "Goedgekeurd",
    "Afgewezen",
    "Teruggetrokken",
)

COMMENT_STATUSES = (
    "Nieuw",
    "In behandeling",
    "Geaccepteerd",
    "Afgewezen",
    "Opgelost",
)


class GovernancePermissionsSchema(Schema):
    role = fields.Str(required=True)
    actions = fields.Dict(keys=fields.Str(), values=fields.Bool(), required=True)


class ProposalSchema(Schema):
    id = fields.Str(required=True)
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    entityType = fields.Str(required=True)
    entityLabel = fields.Str(required=True)
    entityId = fields.Str(required=False, allow_none=True, load_default=None)
    status = fields.Str(required=True, validate=validate.OneOf(PROPOSAL_STATUSES))
    submittedBy = fields.Str(required=True)
    submittedAt = fields.Str(required=True)
    reason = fields.Str(required=False, allow_none=True, load_default=None)


class ProposalCreateSchema(Schema):
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    entityType = fields.Str(required=True)
    entityLabel = fields.Str(required=True)
    entityId = fields.Str(required=False, allow_none=True, load_default=None)
    reason = fields.Str(required=False, allow_none=True, load_default=None)


class ProposalStatusUpdateSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(PROPOSAL_STATUSES))
    reason = fields.Str(required=False, allow_none=True, load_default=None)


class ProposalsQuerySchema(Schema):
    status = fields.Str(required=False)
    entityType = fields.Str(required=False)
    q = fields.Str(required=False)


class CommentSchema(Schema):
    id = fields.Str(required=True)
    text = fields.Str(required=True)
    entityLabel = fields.Str(required=True)
    entityId = fields.Str(required=False, allow_none=True, load_default=None)
    entityType = fields.Str(required=True)
    status = fields.Str(required=True, validate=validate.OneOf(COMMENT_STATUSES))
    submittedBy = fields.Str(required=True)
    submittedAt = fields.Str(required=True)
    resolution = fields.Str(required=False, allow_none=True, load_default=None)


class CommentCreateSchema(Schema):
    text = fields.Str(required=True)
    entityLabel = fields.Str(required=True)
    entityId = fields.Str(required=False, allow_none=True, load_default=None)
    entityType = fields.Str(required=True)


class CommentStatusUpdateSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(COMMENT_STATUSES))
    resolution = fields.Str(required=False, allow_none=True, load_default=None)


class CommentsQuerySchema(Schema):
    status = fields.Str(required=False)
    entityId = fields.Str(required=False)
    q = fields.Str(required=False)


class EscalateCommentSchema(Schema):
    title = fields.Str(required=False, allow_none=True, load_default=None)
    description = fields.Str(required=False, allow_none=True, load_default=None)


class AuditEntrySchema(Schema):
    id = fields.Str(required=True)
    timestamp = fields.Str(required=True)
    actor = fields.Str(required=True)
    action = fields.Str(required=True)
    entityLabel = fields.Str(required=True)
    entityId = fields.Str(required=False, allow_none=True, load_default=None)
    entityType = fields.Str(required=True)
    previousValue = fields.Str(required=False, allow_none=True, load_default=None)
    newValue = fields.Str(required=False, allow_none=True, load_default=None)
    reason = fields.Str(required=False, allow_none=True, load_default=None)
    proposalId = fields.Str(required=False, allow_none=True, load_default=None)


class AuditQuerySchema(Schema):
    action = fields.Str(required=False)
    entityType = fields.Str(required=False)
    entityId = fields.Str(required=False)
    q = fields.Str(required=False)
