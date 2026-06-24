from .sparql import validate_sparql_read_only, execute_sparql_query
from typing import Dict, Any
from ..context.envelope import ContextEnvelope

async def ontology_query_handler(
    plan: Dict[str, Any],
    context: ContextEnvelope,
    settings: Dict[str, Any],
) -> Dict[str, Any]:
    """Skeleton handler for validating and optionally executing generated SPARQL."""
    parameters = plan.get("parameters") or {}
    sparql = parameters.get("sparql", "")

    validate_sparql_read_only(sparql)

    endpoint = settings.get("sparql_endpoint")
    if not endpoint:
        return {
            "type": "sparql_query_validated",
            "executed": False,
            "reason": "Geen SPARQL endpoint geconfigureerd.",
            "sparql": sparql,
            "summary": plan.get("summary", "SPARQL-query gevalideerd maar niet uitgevoerd."),
        }

    results = await execute_sparql_query(endpoint, sparql, timeout=float(settings.get("sparql_timeout", 15)))
    return {
        "type": "sparql_results",
        "executed": True,
        "sparql": sparql,
        "results": results,
        "summary": plan.get("summary", "SPARQL-query uitgevoerd."),
    }
