from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Skill:
    """A dynamically loaded assistant skill."""

    name: str
    description: str = ""
    version: str = "0.0.0"
    execution_type: str = "prompt"  # prompt | handler
    handler: Optional[str] = None
    triggers: List[str] = field(default_factory=list)
    intents: List[str] = field(default_factory=list)
    accepts_context: List[str] = field(default_factory=list)
    requires_any_context: List[str] = field(default_factory=list)
    prefers_context: List[str] = field(default_factory=list)
    output_mode: str = "json"
    output_schema: Optional[str] = None
    body: str = ""
    raw: Dict[str, Any] = field(default_factory=dict)
    path: str = ""

    def routing_summary(self) -> Dict[str, Any]:
        """Small, cheap representation for routing prompts or diagnostics."""
        return {
            "name": self.name,
            "description": self.description,
            "triggers": self.triggers,
            "intents": self.intents,
            "execution_type": self.execution_type,
            "handler": self.handler,
        }

