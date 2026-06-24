from __future__ import annotations

from typing import Any, Dict

from .context import ContextEnvelope


class ContextProvider:
    """
    Verrijkt frontend-context met backend-context:
    - ontology schema summary
    - graph metadata
    - route/entity-afhankelijke context
    """

    def __init__(self, settings: Dict[str, Any]):
        self.settings = settings

    async def enrich(
        self,
        query: str,
        envelope: ContextEnvelope,
    ) -> ContextEnvelope:
        enriched = ContextEnvelope(
            page=envelope.page,
            selection=envelope.selection,
            entity=envelope.entity,
            ontology=dict(envelope.ontology or {}),
            extra=dict(envelope.extra or {}),
        )

        requested_skill = (
            enriched.extra
            .get("assistant", {})
            .get("requestedSkill")
        )

        if self._needs_ontology_context(query, requested_skill):
            enriched.ontology = await self.get_ontology_context(
                query=query,
                envelope=enriched,
            )

        return enriched

    def _needs_ontology_context(
        self,
        query: str,
        requested_skill: str | None,
    ) -> bool:
        q = query.lower()

        if requested_skill == "ontology":
            return True

        return any(
            term in q
            for term in [
                "sparql",
                "rdf",
                "turtle",
                "ontologie",
                "ontology",
                "knowledge graph",
                "kennisgraaf",
            ]
        )

    async def get_ontology_context(
        self,
        query: str,
        envelope: ContextEnvelope,
    ) -> Dict[str, Any]:
        """
        Eerste simpele versie: haal schema summary uit config/cache/bestand.
        Later kun je dit dynamisch uit GraphDB halen.
        """
        return {
            "mode": "schema_summary",
            "source": "backend",
            "content": {
                "prefixes": self.get_prefixes(),
                "classes": self.get_classes(),
                "properties": self.get_properties(),
                "query_patterns": self.get_query_patterns(),
            },
        }

    def get_prefixes(self) -> Dict[str, str]:
        return {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "lt": "https://example.org/legaltech#",
        }

    def get_classes(self) -> list[dict[str, str]]:
        return [
            {"name": "lt:Technology", "label": "Technologie"},
            {"name": "lt:Method", "label": "Methode"},
            {"name": "lt:Standard", "label": "Standaard"},
            {"name": "lt:Tool", "label": "Tool"},
            {"name": "lt:LegalTask", "label": "Juridische taak"},
        ]

    def get_properties(self) -> list[dict[str, str]]:
        return [
            {
                "name": "lt:supportsTask",
                "label": "ondersteunt taak",
                "domain": "lt:Technology",
                "range": "lt:LegalTask",
            },
            {
                "name": "rdfs:label",
                "label": "label",
            },
        ]

    def get_query_patterns(self) -> list[dict[str, str]]:
        return [
            {
                "name": "technologies_by_task",
                "description": "Vind technologieën die een juridische taak ondersteunen.",
                "template": (
                    "SELECT ?technology ?label WHERE { "
                    "?technology lt:supportsTask ?task . "
                    "OPTIONAL { ?technology rdfs:label ?label } "
                    "} LIMIT 100"
                ),
            }
        ]