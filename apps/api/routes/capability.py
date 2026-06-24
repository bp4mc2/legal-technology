from uuid import uuid4

from flask import jsonify, request
from flask_smorest import Blueprint

from api.models.capability import CapabilitySchema
from api.services.capability_service import list_capabilities


blp = Blueprint(
    "capability",
    "capability",
    url_prefix="/api/capabilities",
    description="Read-only endpoints for capabilities.",
)

def _error_response(message, status_code, correlation_id, source):
    return (
        jsonify(
            {
                "message": message,
                "source": source,
                "correlation_id": correlation_id,
            }
        ),
        status_code,
        {"X-Correlation-ID": correlation_id},
    )


@blp.route("")
@blp.response(200, CapabilitySchema(many=True))
def list_all():
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        return list_capabilities(), 200, {"X-Correlation-ID": correlation_id}
    except Exception:
        return _error_response(
            "Capability catalog is unavailable",
            503,
            correlation_id,
            "api/capabilities",
        )