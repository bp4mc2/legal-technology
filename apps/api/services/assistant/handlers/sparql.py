from ..exceptions import SparqlValidationError
import re
import httpx
from typing import Dict, Any
from ..context.envelope import ContextEnvelope

def validate_sparql_read_only(query: str) -> None:
    """Conservative read-only SPARQL validation.

    This is a guardrail, not a full parser. Prefer adding a real SPARQL parser in
    production, plus a read-only endpoint and repository permissions.
    """
    if not query or not query.strip():
        raise SparqlValidationError("Lege SPARQL-query.")

    cleaned = _strip_sparql_comments(query).strip()
    lowered = cleaned.lower()

    forbidden_words = [
        "insert", "delete", "drop", "clear", "load", "create", "move", "copy", "add",
        "service",  # disable federated calls by default
    ]
    for word in forbidden_words:
        if re.search(rf"\b{word}\b", lowered):
            raise SparqlValidationError(f"SPARQL bevat niet-toegestane instructie: {word}")

    # Remove PREFIX / BASE lines to inspect actual query form.
    without_prefixes = re.sub(r"(?im)^\s*(prefix|base)\s+[^\n]+\n?", "", cleaned).strip().lower()
    if not without_prefixes.startswith(("select", "ask", "construct", "describe")):
        raise SparqlValidationError("Alleen read-only SPARQL queries zijn toegestaan.")

    if without_prefixes.startswith("select") and " limit " not in f" {lowered} ":
        raise SparqlValidationError("SELECT queries moeten een LIMIT bevatten.")


def _strip_sparql_comments(query: str) -> str:
    return "\n".join(line.split("#", 1)[0] for line in query.splitlines())
    
async def execute_sparql_query(endpoint: str, sparql: str, *, timeout: float = 15) -> Dict[str, Any]:
    """Minimal read-only SPARQL HTTP executor.

    Works with many GraphDB/Fuseki-style endpoints. Adjust auth/headers if needed.
    """
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            endpoint,
            data={"query": sparql},
            headers={"Accept": "application/sparql-results+json"},
        )
        response.raise_for_status()
        return response.json()
    


