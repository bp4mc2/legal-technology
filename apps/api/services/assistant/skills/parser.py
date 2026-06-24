from __future__ import annotations
from typing import Any, Dict, Optional, List, Tuple
from ..exceptions import SkillError
import re
import yaml

def parse_skill_markdown(text: str, path: str) -> Tuple[Dict[str, Any], str]:
    """Parse YAML frontmatter from a SKILL.md file.

    A small fallback is included for legacy files that start with '### name: ...',
    but new skills should use real YAML frontmatter.
    """
    if text.lstrip().startswith("---"):
        stripped = text.lstrip()
        try:
            _, frontmatter, body = stripped.split("---", 2)
        except ValueError as exc:
            raise SkillError(f"Ongeldige YAML frontmatter in {path}") from exc
        return yaml.safe_load(frontmatter) or {}, body

    # Legacy fallback for very simple markdown metadata.
    meta: Dict[str, Any] = {"execution": {}, "routing": {}}
    body_lines: List[str] = []
    in_header = True
    for line in text.splitlines():
        if in_header and line.startswith("### name:"):
            meta["name"] = line.split(":", 1)[1].strip()
        elif in_header and line.startswith("description:"):
            meta["description"] = line.split(":", 1)[1].strip()
        elif in_header and line.strip().startswith("triggers:"):
            found = re.findall(r"\[(.*?)\]", line)
            if found:
                meta["routing"]["triggers"] = [x.strip() for x in found[0].split(",") if x.strip()]
        else:
            in_header = False
            body_lines.append(line)

    if "name" not in meta:
        raise SkillError(f"Skill file mist YAML frontmatter en legacy name: {path}")
    return meta, "\n".join(body_lines)
        
