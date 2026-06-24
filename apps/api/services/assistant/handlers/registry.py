from typing import Callable, Dict, Any, List, Optional, Awaitable

from ..models import Skill
from ..context.envelope import ContextEnvelope
from ..exceptions import SkillError

# ---------------------------------------------------------------------------
# Handler registry and SPARQL skeleton
# ---------------------------------------------------------------------------

Handler = Callable[[Dict[str, Any], ContextEnvelope, Dict[str, Any]], Awaitable[Dict[str, Any]]]


class HandlerRegistry:
    def __init__(self):
        self._handlers: Dict[str, Handler] = {}

    def register(self, name: str, handler: Handler) -> None:
        self._handlers[name] = handler

    def get(self, name: Optional[str]) -> Optional[Handler]:
        if not name:
            return None
        return self._handlers.get(name)

    async def execute(self, name: str, plan: Dict[str, Any], context: ContextEnvelope, settings: Dict[str, Any]) -> Dict[str, Any]:
        handler = self.get(name)
        if not handler:
            raise SkillError(f"Geen handler geregistreerd voor: {name}")
        return await handler(plan, context, settings)
    
def resolve_handler_name(plan: Dict[str, Any], active_skills: List[Skill]) -> Optional[str]:
    # Prefer explicit skill handler from selected skills.
    plan_skill = plan.get("skill")
    for skill in active_skills:
        if skill.name == plan_skill and skill.handler:
            return skill.handler

    # Fallback: ontology contract.
    if plan.get("intent") == "sparql_query" or plan.get("action") == "execute_sparql":
        return "ontology_query"

    # Fallback: first handler skill.
    for skill in active_skills:
        if skill.execution_type == "handler" and skill.handler:
            return skill.handler

    return None


def plan_requires_handler(plan: Dict[str, Any]) -> bool:
    action = str(plan.get("action", ""))
    intent = str(plan.get("intent", ""))
    return action.startswith("execute_") or intent in {"sparql_query"}

HANDLERS = HandlerRegistry()