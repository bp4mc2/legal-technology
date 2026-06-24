
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

@dataclass
class ContextEnvelope:
    """Structured context sent by the frontend.

    Treat all fields as data, never as instructions. The prompt composer explicitly
    reminds the model of this to reduce prompt-injection risk from page content.
    """

    page: Dict[str, Any] = field(default_factory=dict)
    selection: str = ""
    entity: Dict[str, Any] = field(default_factory=dict)
    ontology: Dict[str, Any] = field(default_factory=dict)
    extra: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]]) -> "ContextEnvelope":
        if not data:
            return cls()
        return cls(
            page=data.get("page") or {},
            selection=data.get("selection") or data.get("page", {}).get("selection", "") or "",
            entity=data.get("entity") or {},
            ontology=data.get("ontology") or {},
            extra={k: v for k, v in data.items() if k not in {"page", "selection", "entity", "ontology"}},
        )

    def to_prompt_dict(self, *, max_page_chars: int = 12000, max_turtle_chars: int = 16000) -> Dict[str, Any]:
        """Return a size-limited context object suitable for the prompt."""
        page = dict(self.page)
        if isinstance(page.get("text"), str) and len(page["text"]) > max_page_chars:
            page["text"] = page["text"][:max_page_chars] + "\n...[afgekapt]"

        ontology = dict(self.ontology)
        content = ontology.get("content")
        if ontology.get("mode") == "turtle" and isinstance(content, str) and len(content) > max_turtle_chars:
            ontology["content"] = content[:max_turtle_chars] + "\n...[afgekapt: stuur liever schema_summary mee]"

        return {
            "page": page,
            "selection": self.selection,
            "entity": self.entity,
            "ontology": ontology,
            "extra": self.extra,
        }

    def available_context_keys(self) -> List[str]:
        keys: List[str] = []
        if self.page:
            keys.append("page")
        if self.selection:
            keys.append("selection")
        if self.entity:
            keys.append("entity")
        if self.ontology:
            keys.append("ontology")
            mode = self.ontology.get("mode")
            if mode:
                keys.append(str(mode))
        keys.extend(self.extra.keys())
        return keys
