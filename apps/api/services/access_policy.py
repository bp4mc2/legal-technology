from dataclasses import dataclass
from typing import Optional
from uuid import uuid4

from flask import current_app, jsonify, request


CANONICAL_ROLES = ("Viewer", "Proposer", "Moderator", "Admin")

ACTION_ALLOWED_ROLES = {
    "legal_technology:create": {"Proposer", "Moderator", "Admin"},
    "legal_technology:update": {"Proposer", "Moderator", "Admin"},
    "legal_technology:delete": {"Moderator", "Admin"},
    "legal_technology:search": {"Viewer", "Proposer", "Moderator", "Admin"},
    "legal_technology:sync_export": {"Moderator", "Admin"},
    "organisation:create": {"Proposer", "Moderator", "Admin"},
    "organisation:update": {"Moderator", "Admin"},
    "organisation:delete": {"Admin"},
    "definition:create": {"Proposer", "Moderator", "Admin"},
    "definition:update": {"Moderator", "Admin"},
    "definition:delete": {"Admin"},
    "sticky_note:review": {"Moderator", "Admin"},
    "governance:proposal:read": {"Viewer", "Proposer", "Moderator", "Admin"},
    "governance:proposal:create": {"Proposer", "Moderator", "Admin"},
    "governance:proposal:update_status": {"Moderator", "Admin"},
    "governance:proposal:approve": {"Moderator", "Admin"},
    "governance:proposal:reject": {"Moderator", "Admin"},
    "governance:proposal:withdraw": {"Proposer", "Moderator", "Admin"},
    "governance:comment:read": {"Viewer", "Proposer", "Moderator", "Admin"},
    "governance:comment:create": {"Proposer", "Moderator", "Admin"},
    "governance:comment:update_status": {"Moderator", "Admin"},
    "governance:comment:escalate": {"Proposer", "Moderator", "Admin"},
    "governance:audit:read": {"Viewer", "Proposer", "Moderator", "Admin"},
}


@dataclass
class PolicyDecision:
    allowed: bool
    action: str
    resource: str
    role: str
    correlation_id: str
    actor_id: str
    status: int = 403
    message: str = (
        "You do not have permission for this action. "
        "Try an allowed action or contact a moderator."
    )


@dataclass
class RequestIdentity:
    role: str
    actor_id: str


def _normalize_role(raw_role: Optional[str]) -> str:
    if not raw_role:
        return "Viewer"
    lowered = raw_role.strip().lower()
    role_lookup = {
        "viewer": "Viewer",
        "proposer": "Proposer",
        "moderator": "Moderator",
        "admin": "Admin",
    }
    return role_lookup.get(lowered, "Viewer")


def get_current_role() -> str:
    return get_request_identity().role


def get_request_actor_id() -> str:
    return _sanitize_actor_id(request.headers.get("X-Actor-Id"))


def get_request_identity() -> RequestIdentity:
    return RequestIdentity(
        role=_normalize_role(request.headers.get("X-User-Role")),
        actor_id=get_request_actor_id(),
    )


def is_action_allowed(action: str) -> bool:
    role = get_current_role()
    allowed_roles = ACTION_ALLOWED_ROLES.get(action, set())
    return role in allowed_roles


def get_request_correlation_id() -> str:
    incoming = request.headers.get("X-Correlation-ID", "").strip()
    return incoming or str(uuid4())


def _sanitize_actor_id(raw_actor_id: Optional[str]) -> str:
    if not raw_actor_id:
        return "anonymous"

    sanitized = "".join(
        ch for ch in raw_actor_id.strip() if ch.isprintable() and ch not in "\r\n\t"
    )
    return sanitized or "anonymous"


def evaluate_policy(action: str, resource: str) -> PolicyDecision:
    identity = get_request_identity()
    correlation_id = get_request_correlation_id()
    allowed_roles = ACTION_ALLOWED_ROLES.get(action, set())
    allowed = identity.role in allowed_roles

    return PolicyDecision(
        allowed=allowed,
        action=action,
        resource=resource,
        role=identity.role,
        correlation_id=correlation_id,
        actor_id=identity.actor_id,
    )


def build_deny_response(decision: PolicyDecision):
    payload = {
        "status": decision.status,
        "message": decision.message,
        "correlation_id": decision.correlation_id,
    }
    return jsonify(payload), decision.status, {"X-Correlation-ID": decision.correlation_id}


def require_action(action: str, resource: str):
    decision = evaluate_policy(action=action, resource=resource)
    if decision.allowed:
        return None

    current_app.logger.warning(
        "policy_deny action=%s resource=%s role=%s actor_id=%s correlation_id=%s",
        decision.action,
        decision.resource,
        decision.role,
        decision.actor_id,
        decision.correlation_id,
    )
    return build_deny_response(decision)
