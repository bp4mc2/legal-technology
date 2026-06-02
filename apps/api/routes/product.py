from uuid import uuid4

from flask import jsonify, request
from flask_smorest import Blueprint

from api.models.product import ProductContributionChainSchema, ProductSchema, ProductTraceabilitySchema
from api.services.graphdb_service import get_product_contribution_chain, get_product_traceability, list_products


blp = Blueprint(
    "product",
    "product",
    url_prefix="/api/products",
    description="Read-only endpoints for product concepts and their task traceability.",
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
@blp.response(200, ProductSchema(many=True))
def list_all():
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        return list_products(), 200, {"X-Correlation-ID": correlation_id}
    except Exception:
        return _error_response(
            "Product catalog is unavailable",
            503,
            correlation_id,
            "api/products",
        )


@blp.route("/<id>/traceability")
@blp.response(200, ProductTraceabilitySchema)
def traceability(id):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        payload = get_product_traceability(id)
    except Exception:
        return _error_response(
            "Product traceability is unavailable",
            503,
            correlation_id,
            f"api/products/{id}/traceability",
        )

    if payload is None:
        return _error_response(
            "Product traceability not found",
            404,
            correlation_id,
            f"api/products/{id}/traceability",
        )

    return payload, 200, {"X-Correlation-ID": correlation_id}


@blp.route("/<id>/contribution-chain")
@blp.response(200, ProductContributionChainSchema)
def contribution_chain(id):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    try:
        payload = get_product_contribution_chain(id)
    except Exception:
        return _error_response(
            "Product contribution chain is unavailable",
            503,
            correlation_id,
            f"api/products/{id}/contribution-chain",
        )

    if payload is None:
        return _error_response(
            "Product contribution chain not found",
            404,
            correlation_id,
            f"api/products/{id}/contribution-chain",
        )

    return payload, 200, {"X-Correlation-ID": correlation_id}