from .registry import SkillRegistry
from typing import List, Tuple
from ..models import Skill
from ..context.envelope import ContextEnvelope

# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------

class SkillRouter:
    """Deterministic skill router with lightweight scoring."""

    def __init__(self, registry: SkillRegistry):
        self.registry = registry

    def route(self, query: str, context: ContextEnvelope, *, max_skills: int = 2) -> List[Skill]:
        requested_skill = (
            context.extra
            .get("assistant", {})
            .get("requested_skill")
        )
        
        if requested_skill:
            skill = self.registry.get(str(requested_skill))
            if skill:
                return [skill]
            else:
                return []
        
        q = query.lower()
        context_keys = set(context.available_context_keys())
        scored: List[Tuple[int, Skill]] = []

        for skill in self.registry.list_skills().values():
            score = 0

            for trigger in skill.triggers:
                if trigger and trigger.lower() in q:
                    score += 10

            # Common hard-coded boosts for your current domain.
            if any(word in q for word in ["sparql", "rdf", "turtle", "ontologie", "ontology", "owl"]):
                if skill.name == "ontology" or skill.handler == "ontology_query":
                    score += 25

            if any(word in q for word in ["typologie", "analyseer", "analyse", "technologie"]):
                if "analysis" in skill.name or "analyse" in skill.description.lower() or "analysis" in skill.description.lower():
                    score += 20

            # Context-aware scoring.
            if skill.requires_any_context:
                if context_keys.intersection(skill.requires_any_context):
                    score += 5
                else:
                    score -= 8

            if context_keys.intersection(skill.prefers_context):
                score += 3

            if score > 0:
                scored.append((score, skill))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [skill for _, skill in scored[:max_skills]]