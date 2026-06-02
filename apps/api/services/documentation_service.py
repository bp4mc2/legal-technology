from pathlib import Path
import re
import unicodedata
from typing import Optional

from api.services.graphdb_service import get_legal_technology


PROJECT_ROOT = Path(__file__).resolve().parents[3]
CANONICAL_SOURCE = "media/legal-technologies.md"
PIPELINE_OUTPUTS = (
    "media/catalogus.md",
    "media/legal-technologies.md",
    "media/index.html",
)
DOCUMENTATION_FILE = PROJECT_ROOT / "media" / "legal-technologies.md"


class DocumentationReadError(Exception):
    """Raised when generated documentation cannot be read safely."""


def _read_documentation_file() -> str:
    try:
        return DOCUMENTATION_FILE.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise DocumentationReadError("Could not read generated documentation source") from exc


def _slugify(value: str) -> str:
    lowered = unicodedata.normalize("NFKD", (value or "").strip().lower())
    lowered = lowered.encode("ascii", "ignore").decode("ascii")
    lowered = lowered.replace("--v--", " v ")

    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    lowered = re.sub(r"-+", "-", lowered)
    lowered = lowered.strip("-")
    return lowered


def get_documentation_source_contract() -> dict:
    return {
        "canonical_source": CANONICAL_SOURCE,
        "pipeline_outputs": list(PIPELINE_OUTPUTS),
        "read_only": True,
        "deterministic_resolution": True,
    }


def _candidate_anchors(technology_id: str, technology: Optional[dict]) -> list[str]:
    anchors = []

    if technology and isinstance(technology, dict):
        name = technology.get("naam")
        if isinstance(name, str) and name.strip():
            anchors.append(_slugify(name))

    anchors.append(_slugify(technology_id))

    unique = []
    seen = set()
    for anchor in anchors:
        if anchor and anchor not in seen:
            unique.append(anchor)
            seen.add(anchor)

    return unique


def _extract_section(markdown: str, anchor: str) -> Optional[str]:
    pattern = re.compile(
        rf"<section\b[^>]*\bid\s*=\s*['\"]{re.escape(anchor)}['\"][^>]*>(.*?)</section>",
        re.IGNORECASE | re.DOTALL,
    )
    match = pattern.search(markdown)
    if not match:
        return None

    return match.group(1).strip()


def _extract_heading_anchor_section(markdown: str, anchor: str) -> tuple[Optional[str], Optional[str]]:
    heading_pattern = re.compile(
        rf"^\s{{0,3}}(#{'{2,6}'})\s+(.+?)\s+\{{#{re.escape(anchor)}\}}\s*$",
        re.MULTILINE,
    )
    match = heading_pattern.search(markdown)
    if not match:
        return None, None

    heading_level = len(match.group(1))
    title = match.group(2).strip()
    section_start = match.end()

    next_heading = re.compile(r"^\s{0,3}(#{2,6})\s+.+$", re.MULTILINE).search(markdown, section_start)
    section_end = len(markdown)
    while next_heading:
        next_level = len(next_heading.group(1))
        # End this section when we hit a heading at the same or higher level.
        if next_level <= heading_level:
            section_end = next_heading.start()
            break
        next_heading = re.compile(r"^\s{0,3}(#{2,6})\s+.+$", re.MULTILINE).search(markdown, next_heading.end())

    section = markdown[section_start:section_end].strip()

    if not section:
        return None, None

    return section, title


def _anchor_occurrence_count(markdown: str, anchor: str) -> int:
    section_hits = len(
        re.findall(
            rf"<section\b[^>]*\bid\s*=\s*['\"]{re.escape(anchor)}['\"][^>]*>",
            markdown,
            flags=re.IGNORECASE,
        )
    )
    heading_hits = len(
        re.findall(
            rf"^\s{{0,3}}#{{2,6}}\s+.+?\s+\{{#{re.escape(anchor)}\}}\s*$",
            markdown,
            flags=re.MULTILINE,
        )
    )
    return section_hits + heading_hits


def _count_documentation_sections(markdown: str) -> int:
    section_ids = set(
        re.findall(
            r"<section\b[^>]*\bid\s*=\s*['\"]([^'\"]+)['\"][^>]*>",
            markdown,
            flags=re.IGNORECASE,
        )
    )
    heading_ids = set(
        re.findall(
            r"^\s{0,3}#{2,6}\s+.+?\s+\{#([A-Za-z0-9\-_]+)\}\s*$",
            markdown,
            flags=re.MULTILINE,
        )
    )
    return len(section_ids.union(heading_ids))


def _extract_heading(section: str) -> str:
    for line in section.splitlines():
        if line.startswith("## "):
            return line[3:].strip()
    return "Documentation"


def get_technology_documentation(technology_id: str) -> Optional[dict]:
    if not DOCUMENTATION_FILE.exists():
        return None

    markdown = _read_documentation_file()

    technology = get_legal_technology(technology_id)
    anchors = _candidate_anchors(technology_id, technology)
    for index, anchor in enumerate(anchors):
        # Name-derived anchors are preferred, but if duplicated in source content,
        # fall back to the id-derived anchor to keep resolution deterministic.
        if index == 0 and len(anchors) > 1 and _anchor_occurrence_count(markdown, anchor) > 1:
            continue

        section = _extract_section(markdown, anchor)
        title_override = None

        if not section:
            section, title_override = _extract_heading_anchor_section(markdown, anchor)

        if section:
            return {
                "technology_id": technology_id,
                "section_title": title_override or _extract_heading(section),
                "content": section,
                "source": f"{CANONICAL_SOURCE}#{anchor}",
            }

    return None


def get_catalog_documentation() -> Optional[dict]:
    if not DOCUMENTATION_FILE.exists():
        return None

    markdown = _read_documentation_file()
    section_count = _count_documentation_sections(markdown)

    return {
        "title": "Juridische technologie catalogus",
        "content": markdown,
        "source": CANONICAL_SOURCE,
        "section_count": section_count,
    }
