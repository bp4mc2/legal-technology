from datetime import datetime, timezone
from pathlib import Path
import re
import unicodedata
from typing import Optional

from api.services.graphdb_service import get_legal_technology


PROJECT_ROOT = Path(__file__).resolve().parents[3]
CANONICAL_SOURCE = "build/docs/includes/catalogus-details.md"
PIPELINE_OUTPUTS = (
    "build/docs/includes/catalogus-overzicht.md",
    "build/docs/includes/catalogus-details.md",
    "build/docs/includes/taxonomieen.md",
    "build/docs/includes/organisaties.md",
    "build/docs/includes/ontologie.md",
    "build/docs/includes/generatieverantwoording.md",
    "build/docs/respec/index.html",
    "build/docs/respec/catalogus.html",
    "build/docs/respec/taxonomieen.html",
    "build/docs/respec/organisaties.html",
    "build/docs/respec/ontologie.html",
    "build/docs/respec/typologie.html",
    "dist/index.html",
    "dist/catalogus.html",
    "dist/taxonomieen.html",
    "dist/organisaties.html",
    "dist/ontologie.html",
    "dist/typologie.html",
)
CURATED_SOURCES = (
    "docs/README.md",
    "docs/meta-model.md",
    "docs/typologie.md",
)
DOCUMENTATION_FILE = PROJECT_ROOT / "build" / "docs" / "includes" / "catalogus-details.md"
GENERATED_SECTIONS = (
    ("catalogus-overzicht", "Catalogus-overzicht", PROJECT_ROOT / "build" / "docs" / "includes" / "catalogus-overzicht.md"),
    ("catalogus-details", "Catalogus-details", PROJECT_ROOT / "build" / "docs" / "includes" / "catalogus-details.md"),
    ("taxonomieen", "Taxonomieen", PROJECT_ROOT / "build" / "docs" / "includes" / "taxonomieen.md"),
    ("organisaties", "Organisaties", PROJECT_ROOT / "build" / "docs" / "includes" / "organisaties.md"),
    ("ontologie", "Ontologie", PROJECT_ROOT / "build" / "docs" / "includes" / "ontologie.md"),
    (
        "generatieverantwoording",
        "Generatieverantwoording",
        PROJECT_ROOT / "build" / "docs" / "includes" / "generatieverantwoording.md",
    ),
)
CURATED_SECTIONS = (
    ("docs-overview", "Documentatie-overzicht", PROJECT_ROOT / "docs" / "README.md"),
    ("meta-model", "Meta-model", PROJECT_ROOT / "docs" / "meta-model.md"),
    ("typologie", "Typologie", PROJECT_ROOT / "docs" / "typologie.md"),
)


class DocumentationReadError(Exception):
    """Raised when generated documentation cannot be read safely."""


def _read_documentation_file() -> str:
    try:
        return DOCUMENTATION_FILE.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise DocumentationReadError("Could not read generated documentation source") from exc


def _read_markdown_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise DocumentationReadError(f"Could not read generated documentation source: {path.name}") from exc


def _to_iso_utc(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _source_label_for_path(path: Path) -> str:
    parts = list(path.parts)
    for marker in ("media", "docs"):
        if marker in parts:
            return "/".join(parts[parts.index(marker):])

    try:
        return str(path.relative_to(PROJECT_ROOT)).replace("\\", "/")
    except ValueError:
        return path.name


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
        "curated_sources": list(CURATED_SOURCES),
        "generated_sections": [section_id for section_id, _, _ in GENERATED_SECTIONS],
        "curated_sections": [section_id for section_id, _, _ in CURATED_SECTIONS],
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


def _collect_markdown_sections(section_defs: tuple[tuple[str, str, Path], ...], group_id: str, group_title: str, source_label: str) -> list[dict]:
    sections = []

    for section_id, title, path in section_defs:
        if not path.exists():
            continue

        content = _read_markdown_file(path)
        stat = path.stat()
        sections.append(
            {
                "id": section_id,
                "title": title,
                "content": content,
                "source": _source_label_for_path(path),
                "updated_at": _to_iso_utc(stat.st_mtime),
                "group_id": group_id,
                "group_title": group_title,
                "source_label": source_label,
            }
        )

    return sections


def get_generated_documentation_sections() -> list[dict]:
    return _collect_markdown_sections(
        GENERATED_SECTIONS,
        group_id="generated",
        group_title="Gegenereerde documentatie",
        source_label="ReSpec gegenereerd",
    )


def get_curated_documentation_sections() -> list[dict]:
    return _collect_markdown_sections(
        CURATED_SECTIONS,
        group_id="curated",
        group_title="Handmatige documentatie",
        source_label="Curated docs",
    )


def get_documentation_hub_payload() -> dict:
    generated_sections = get_generated_documentation_sections()
    curated_sections = get_curated_documentation_sections()
    groups = [
        {
            "id": "generated",
            "title": "Gegenereerde documentatie",
            "description": "Catalogusdocumentatie en ReSpec-fragmenten opgebouwd uit build-uitvoer.",
            "source_label": "ReSpec gegenereerd",
            "sections": generated_sections,
        },
        {
            "id": "curated",
            "title": "Handmatige documentatie",
            "description": "Bronnotities en documentatie uit de docs-map van het project.",
            "source_label": "Curated docs",
            "sections": curated_sections,
        },
    ]

    return {
        "groups": groups,
        "sections": generated_sections + curated_sections,
        "section_count": len(generated_sections) + len(curated_sections),
    }
