from __future__ import annotations
from ..models import Skill
from typing import Any, Dict, List, Optional, Tuple
from ..exceptions import SkillError
from ..skills.parser import parse_skill_markdown

from threading import RLock
from pathlib import Path

# ---------------------------------------------------------------------------
# Skill registry
# ---------------------------------------------------------------------------

class SkillRegistry:
    """Loads SKILL.md files from a skill directory and refreshes cache on changes.

    Expected layout:
        skills/<skill-name>/SKILL.md

    SKILL.md should contain YAML frontmatter:
        ---
        name: ontology
        description: SPARQL powered ontology skill
        execution:
          type: handler
          handler: ontology_query
        routing:
          triggers: [sparql, ontologie, rdf]
        ---
        Body instructions...
    """

    def __init__(self, skill_dir: str):
        self.skill_dir = Path(skill_dir).resolve()
        self._skills: Dict[str, Skill] = {}
        self._scan_token: Optional[Tuple[Tuple[str, float, int], ...]] = None
        self._lock = RLock()

    def list_skills(self, *, force: bool = False) -> Dict[str, Skill]:
        with self._lock:
            token = self._compute_scan_token()
            if force or token != self._scan_token:
                self._skills = self._load_skills()
                self._scan_token = token
            return dict(self._skills)

    def get(self, name: str) -> Optional[Skill]:
        return self.list_skills().get(name)

    def summaries(self) -> List[Dict[str, Any]]:
        return [s.routing_summary() for s in self.list_skills().values()]

    def _skill_files(self) -> List[Path]:
        if not self.skill_dir.is_dir():
            return []
        return sorted(self.skill_dir.glob("*/SKILL.md"))

    def _compute_scan_token(self) -> Tuple[Tuple[str, float, int], ...]:
        token: List[Tuple[str, float, int]] = []
        for path in self._skill_files():
            stat = path.stat()
            token.append((str(path), stat.st_mtime, stat.st_size))
        return tuple(token)

    def _load_skills(self) -> Dict[str, Skill]:
        skills: Dict[str, Skill] = {}
        for path in self._skill_files():
            skill = self._read_skill_file(path)
            if skill.name in skills:
                raise SkillError(f"Dubbele skillnaam gevonden: {skill.name}")
            skills[skill.name] = skill
        return skills

    @staticmethod
    def _read_skill_file(path: Path) -> Skill:
        text = path.read_text(encoding="utf-8")
        meta, body = parse_skill_markdown(text, str(path))

        execution = meta.get("execution") or {}
        routing = meta.get("routing") or {}
        context = meta.get("context") or {}
        output = meta.get("output") or {}

        name = meta.get("name")
        if not name:
            raise SkillError(f"Skill mist verplichte 'name' in frontmatter: {path}")

        return Skill(
            name=str(name),
            description=str(meta.get("description", "")),
            version=str(meta.get("version", "0.0.0")),
            execution_type=str(execution.get("type", "prompt")),
            handler=execution.get("handler"),
            triggers=list(routing.get("triggers") or []),
            intents=list(routing.get("intents") or []),
            accepts_context=list(context.get("accepts") or []),
            requires_any_context=list(context.get("requires_any") or []),
            prefers_context=list(context.get("prefers") or []),
            output_mode=str(output.get("mode", "json")),
            output_schema=output.get("schema"),
            body=body.strip(),
            raw=meta,
            path=str(path),
        )