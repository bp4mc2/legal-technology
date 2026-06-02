from pathlib import Path

import api.services.documentation_service as documentation_service


def test_get_documentation_source_contract_exposes_pipeline_traceability():
    contract = documentation_service.get_documentation_source_contract()

    assert contract["canonical_source"] == "media/legal-technologies.md"
    assert "media/catalogus.md" in contract["pipeline_outputs"]
    assert "media/legal-technologies.md" in contract["pipeline_outputs"]


def test_get_technology_documentation_supports_heading_anchor_mapping(tmp_path, monkeypatch):
    generated = tmp_path / "legal-technologies.md"
    generated.write_text(
        """
# Overzicht

#### Alpha Counsel {#alpha-counsel}

Alpha body from heading anchor.
""".strip()
        + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(documentation_service, "DOCUMENTATION_FILE", generated)
    monkeypatch.setattr(documentation_service, "get_legal_technology", lambda _id: {"naam": "Alpha Counsel"})

    payload = documentation_service.get_technology_documentation("alpha--v--1.0")

    assert payload is not None
    assert payload["source"] == "media/legal-technologies.md#alpha-counsel"
    assert "Alpha body from heading anchor." in payload["content"]


def test_get_technology_documentation_supports_non_h4_heading_anchor_mapping(tmp_path, monkeypatch):
    generated = tmp_path / "legal-technologies.md"
    generated.write_text(
        """
# Overzicht

### Alpha Counsel {#alpha-counsel}

Alpha body from heading anchor level 3.
""".strip()
        + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(documentation_service, "DOCUMENTATION_FILE", generated)
    monkeypatch.setattr(documentation_service, "get_legal_technology", lambda _id: {"naam": "Alpha Counsel"})

    payload = documentation_service.get_technology_documentation("alpha--v--1.0")

    assert payload is not None
    assert payload["source"] == "media/legal-technologies.md#alpha-counsel"
    assert "Alpha body from heading anchor level 3." in payload["content"]


def test_get_technology_documentation_heading_anchor_stops_at_same_or_higher_level(tmp_path, monkeypatch):
    generated = tmp_path / "legal-technologies.md"
    generated.write_text(
        """
# Overzicht

### Alpha Counsel {#alpha-counsel}

Alpha body.

#### Deep detail

Nested context.

### Beta Rules {#beta-rules}

Beta body.
""".strip()
        + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(documentation_service, "DOCUMENTATION_FILE", generated)
    monkeypatch.setattr(documentation_service, "get_legal_technology", lambda _id: {"naam": "Alpha Counsel"})

    payload = documentation_service.get_technology_documentation("alpha--v--1.0")

    assert payload is not None
    assert "Alpha body." in payload["content"]
    assert "Nested context." in payload["content"]
    assert "Beta body." not in payload["content"]


def test_get_technology_documentation_is_deterministic_and_prefers_name_anchor(tmp_path, monkeypatch):
    generated = tmp_path / "legal-technologies.md"
    generated.write_text(
        """
<section id="alpha-counsel">
## Alpha Counsel

Name based section.
</section>

<section id="alpha-v-1-0">
## Alpha Fallback

Id based section.
</section>
""".strip()
        + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(documentation_service, "DOCUMENTATION_FILE", generated)
    monkeypatch.setattr(documentation_service, "get_legal_technology", lambda _id: {"naam": "Alpha Counsel"})

    first = documentation_service.get_technology_documentation("alpha--v--1.0")
    second = documentation_service.get_technology_documentation("alpha--v--1.0")

    assert first == second
    assert first is not None
    assert first["source"].endswith("#alpha-counsel")


def test_get_technology_documentation_falls_back_to_id_anchor_on_name_anchor_collision(tmp_path, monkeypatch):
    generated = tmp_path / "legal-technologies.md"
    generated.write_text(
        """
#### Alpha Counsel {#alpha-counsel}

Duplicate one.

#### Alpha Counsel Variant {#alpha-counsel}

Duplicate two.

<section id="alpha-v-1-0">
## Alpha Fallback

Id based section.
</section>
""".strip()
        + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(documentation_service, "DOCUMENTATION_FILE", generated)
    monkeypatch.setattr(documentation_service, "get_legal_technology", lambda _id: {"naam": "Alpha Counsel"})

    payload = documentation_service.get_technology_documentation("alpha--v--1.0")

    assert payload is not None
    assert payload["source"].endswith("#alpha-v-1-0")
    assert "Id based section." in payload["content"]


def test_get_catalog_documentation_counts_section_and_heading_anchors(tmp_path, monkeypatch):
    generated = tmp_path / "legal-technologies.md"
    generated.write_text(
        """
<section id="alpha-counsel">
## Alpha Counsel

Body.
</section>

### Beta Rules {#beta-rules}

Beta body.
""".strip()
        + "\n",
        encoding="utf-8",
    )

    monkeypatch.setattr(documentation_service, "DOCUMENTATION_FILE", generated)

    payload = documentation_service.get_catalog_documentation()

    assert payload is not None
    assert payload["section_count"] == 2
