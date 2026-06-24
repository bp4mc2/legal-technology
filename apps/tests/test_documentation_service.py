from pathlib import Path

import api.services.documentation_service as documentation_service


def test_get_documentation_source_contract_exposes_pipeline_traceability():
    contract = documentation_service.get_documentation_source_contract()

    assert contract["canonical_source"] == "build/docs/includes/catalogus-details.md"
    assert "build/docs/includes/catalogus-overzicht.md" in contract["pipeline_outputs"]
    assert "build/docs/includes/catalogus-details.md" in contract["pipeline_outputs"]
    assert "docs/README.md" in contract["curated_sources"]
    assert "catalogus-overzicht" in contract["generated_sections"]
    assert "catalogus-details" in contract["generated_sections"]
    assert "docs-overview" in contract["curated_sections"]


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
    assert payload["source"] == "build/docs/includes/catalogus-details.md#alpha-counsel"
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
    assert payload["source"] == "build/docs/includes/catalogus-details.md#alpha-counsel"
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


def test_get_generated_documentation_sections_returns_existing_fragments(tmp_path, monkeypatch):
    build_include_dir = tmp_path / "build" / "docs" / "includes"
    build_include_dir.mkdir(parents=True)

    catalog = build_include_dir / "catalogus-overzicht.md"
    catalog.write_text("## Catalogus\n", encoding="utf-8")

    ontology = build_include_dir / "ontologie.md"
    ontology.write_text("## Ontologie\n", encoding="utf-8")

    monkeypatch.setattr(
        documentation_service,
        "GENERATED_SECTIONS",
        (
            ("catalogus-overzicht", "Catalogus-overzicht", catalog),
            ("taxonomieen", "Taxonomieen", build_include_dir / "taxonomieen.md"),
            ("ontologie", "Ontologie", ontology),
        ),
    )

    sections = documentation_service.get_generated_documentation_sections()

    assert [section["id"] for section in sections] == ["catalogus-overzicht", "ontologie"]
    assert sections[0]["source"] == "build/docs/includes/catalogus-overzicht.md"
    assert sections[0]["group_id"] == "generated"
    assert sections[0]["updated_at"].endswith("Z")
    assert "Ontologie" in sections[1]["content"]


def test_get_curated_documentation_sections_returns_existing_fragments(tmp_path, monkeypatch):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()

    overview = docs_dir / "README.md"
    overview.write_text("# Documentatie\n", encoding="utf-8")

    typology = docs_dir / "typologie.md"
    typology.write_text("# Typologie\n", encoding="utf-8")

    monkeypatch.setattr(
        documentation_service,
        "CURATED_SECTIONS",
        (
            ("docs-overview", "Documentatie-overzicht", overview),
            ("meta-model", "Meta-model", docs_dir / "meta-model.md"),
            ("typologie", "Typologie", typology),
        ),
    )

    sections = documentation_service.get_curated_documentation_sections()

    assert [section["id"] for section in sections] == ["docs-overview", "typologie"]
    assert sections[0]["source"] == "docs/README.md"
    assert sections[0]["group_id"] == "curated"
    assert sections[0]["source_label"] == "Curated docs"


def test_get_documentation_hub_payload_groups_generated_and_curated_sections(monkeypatch):
    monkeypatch.setattr(
        documentation_service,
        "get_generated_documentation_sections",
        lambda: [{"id": "catalogus", "group_id": "generated"}],
    )
    monkeypatch.setattr(
        documentation_service,
        "get_curated_documentation_sections",
        lambda: [{"id": "docs-overview", "group_id": "curated"}],
    )

    payload = documentation_service.get_documentation_hub_payload()

    assert payload["section_count"] == 2
    assert payload["groups"][0]["id"] == "generated"
    assert payload["groups"][1]["id"] == "curated"
    assert payload["sections"][1]["id"] == "docs-overview"


def test_get_generated_documentation_sections_raises_structured_error_on_unreadable_file(tmp_path, monkeypatch):
    broken_path = tmp_path / "catalogus.md"
    broken_path.write_text("ignored\n", encoding="utf-8")

    monkeypatch.setattr(
        documentation_service,
        "GENERATED_SECTIONS",
        (("catalogus", "Catalogus", broken_path),),
    )
    monkeypatch.setattr(
        documentation_service,
        "_read_markdown_file",
        lambda path: (_ for _ in ()).throw(documentation_service.DocumentationReadError("broken")),
    )

    try:
        documentation_service.get_generated_documentation_sections()
    except documentation_service.DocumentationReadError as exc:
        assert "broken" in str(exc)
    else:
        raise AssertionError("Expected DocumentationReadError")
