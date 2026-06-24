from typing import List
from ..models import Skill

def compose_output_contract(skills: List[Skill]) -> str:
    if any(s.handler == "ontology_query" or s.name == "ontology" for s in skills):
        return """
Als SPARQL nodig is, geef exact JSON terug:
{
  "intent": "sparql_query",
  "skill": "ontology",
  "action": "execute_sparql",
  "parameters": {
    "question": "...",
    "sparql": "...",
    "assumptions": [],
    "uses_context": []
  },
  "confidence": 0.0,
  "summary": "..."
}

Als ontology-informatie ontbreekt, geef JSON terug met:
{
  "intent": "clarification",
  "skill": "ontology",
  "action": "ask_clarification",
  "parameters": {"missing": []},
  "summary": "..."
}
""".strip()

    return """
Geef bij handler-acties JSON terug:
{
  "intent": "search|add|edit|delete|show|stats|info|analysis",
  "skill": "skillnaam-of-null",
  "action": "actie",
  "parameters": {},
  "confidence": 0.0,
  "summary": "korte Nederlandse samenvatting"
}

Als geen handler nodig is, mag je gewone Markdown teruggeven.
""".strip()
