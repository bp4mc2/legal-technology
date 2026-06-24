from .ontology import ontology_query_handler
from .registry import resolve_handler_name, plan_requires_handler

from .registry import HANDLERS

__all__ = [
    "ontology_query_handler",
    "resolve_handler_name",
    "plan_requires_handler",
    "HANDLERS",
]

HANDLERS.register("ontology_query", ontology_query_handler)