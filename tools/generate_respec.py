from pathlib import Path
from collections import defaultdict
from datetime import date
import re

from rdflib import Graph
from jinja2 import Environment, FileSystemLoader


BASE_DIR = Path(__file__).parent

DATA_DIR = BASE_DIR / "../data"
QUERY_DIR = BASE_DIR / "../queries"
TEMPLATE_DIR = BASE_DIR / "../templates"
OUTPUT_DIR = BASE_DIR / "../media"
MODEL_DIR = BASE_DIR / "../model"

TBOX_FILE = MODEL_DIR / "juridische technologie.ttl"
TASKS_FILE = MODEL_DIR / "taken.ttl"
ABOX_FILE = DATA_DIR / "all-legal-technologies.ttl"

OUTPUT_FILES = {
    "catalogus": OUTPUT_DIR / "catalogus.md",
    "taxonomieen": OUTPUT_DIR / "taxonomieen.md",
    "organisaties": OUTPUT_DIR / "organisaties.md",
    "ontologie": OUTPUT_DIR / "ontologie.md",
    "generatieverantwoording": OUTPUT_DIR / "generatieverantwoording.md",
}


def read_query(name: str) -> str:
    path = QUERY_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Query niet gevonden: {path}")
    return path.read_text(encoding="utf-8")


def local_name(uri: str) -> str:
    if not uri:
        return ""
    if "#" in uri:
        return uri.rsplit("#", 1)[1]
    return uri.rstrip("/").rsplit("/", 1)[-1]


def slugify(value: str) -> str:
    value = str(value or "").strip().lower()

    replacements = {
        "á": "a",
        "à": "a",
        "ä": "a",
        "â": "a",
        "é": "e",
        "è": "e",
        "ë": "e",
        "ê": "e",
        "í": "i",
        "ì": "i",
        "ï": "i",
        "î": "i",
        "ó": "o",
        "ò": "o",
        "ö": "o",
        "ô": "o",
        "ú": "u",
        "ù": "u",
        "ü": "u",
        "û": "u",
        "ç": "c",
    }

    for src, target in replacements.items():
        value = value.replace(src, target)

    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value)
    value = value.strip("-")

    return value or "item"


def term_to_str(value):
    if value is None:
        return None
    return str(value)


def row_to_dict(row):
    return {key: term_to_str(value) for key, value in row.asdict().items()}


def execute_select(graph: Graph, query_file: str):
    query = read_query(query_file)
    try:
        return [row_to_dict(row) for row in graph.query(query)]
    except Exception as e:
        raise RuntimeError(f"Fout bij uitvoeren van SPARQL-query: {query_file}") from e


def first_value(rows, key):
    for row in rows:
        value = row.get(key)
        if value not in (None, ""):
            return value
    return None


def unique_items(items, key="uri"):
    seen = set()
    result = []

    for item in items:
        value = item.get(key)
        if value in seen:
            continue
        seen.add(value)
        result.append(item)

    return result


def markdown_link(label: str, anchor: str) -> str:
    if not label:
        label = anchor
    return f"[{label}](#{anchor})"


def build_metadata(graph: Graph):
    rows = execute_select(graph, "ontology_metadata.rq")

    if not rows:
        return {}

    row = rows[0]

    return {
        "ontology": row.get("ontology"),
        "title": row.get("title"),
        "creator": row.get("creator"),
        "created": row.get("created"),
        "version": row.get("version"),
        "comment": row.get("comment"),
    }


def build_technologies(graph: Graph):
    detail_rows = execute_select(graph, "technology_detail.rq")
    classification_rows = execute_select(graph, "technology_classifications.rq")
    support_rows = execute_select(graph, "support_forms.rq")
    task_rows = execute_select(graph, "task_assignments.rq")
    relation_rows = execute_select(graph, "relations.rq")
    source_rows = execute_select(graph, "sources.rq")

    grouped_details = defaultdict(list)

    for row in detail_rows:
        tech_uri = row.get("tech")
        if tech_uri:
            grouped_details[tech_uri].append(row)

    technologies = []

    for tech_uri, rows in grouped_details.items():
        naam = first_value(rows, "naam") or local_name(tech_uri)
        anchor = slugify(naam)

        tech = {
            "uri": tech_uri,
            "id": local_name(tech_uri),
            "anchor": anchor,
            "naam": naam,

            "type": first_value(rows, "type"),
            "typeLabel": first_value(rows, "typeLabel"),

            "omschrijving": first_value(rows, "omschrijving"),
            "gebruiksstatusLabel": first_value(rows, "gebruiksstatusLabel"),
            "licentievormLabel": first_value(rows, "licentievormLabel"),
            "bijgewerktOp": first_value(rows, "bijgewerktOp"),

            "beheerder": first_value(rows, "beheerder"),
            "beheerderNaam": first_value(rows, "beheerderNaam"),

            "leverancier": first_value(rows, "leverancier"),
            "leverancierNaam": first_value(rows, "leverancierNaam"),

            "normstatusLabel": first_value(rows, "normstatusLabel"),
            "typeTechnologieLabel": first_value(rows, "typeTechnologieLabel"),

            "versienummer": first_value(rows, "versienummer"),
            "versiedatum": first_value(rows, "versiedatum"),

            "beoogdGebruik": first_value(rows, "beoogdGebruik"),
            "toegevoegdeWaarde": first_value(rows, "toegevoegdeWaarde"),
            "onderdelen": first_value(rows, "onderdelen"),
            "ontwikkelingEnBeheer": first_value(rows, "ontwikkelingEnBeheer"),

            "functionaliteiten": [],
            "gebruikersgroepen": [],
            "ondersteuningsvormen": [],
            "taken": [],
            "relaties": [],
            "bronnen": [],
        }

        technologies.append(tech)

    tech_by_uri = {tech["uri"]: tech for tech in technologies}
    anchor_by_uri = {tech["uri"]: tech["anchor"] for tech in technologies}

    for row in classification_rows:
        tech = tech_by_uri.get(row.get("tech"))
        if not tech:
            continue

        value_uri = row.get("value")
        if not value_uri:
            continue
        item = {
            "uri": value_uri,
            "id": local_name(value_uri),
            "label": row.get("label") or local_name(value_uri),
        }

        prop = row.get("property", "")

        if prop and prop.endswith("#gebodenFunctionaliteit"):
            tech["functionaliteiten"].append(item)
        elif prop and prop.endswith("#beoogdeGebruikers"):
            tech["gebruikersgroepen"].append(item)

    for row in support_rows:
        tech = tech_by_uri.get(row.get("tech"))
        if not tech:
            continue

        tech["ondersteuningsvormen"].append({
            "support": row.get("support"),
            "beschouwingsniveau": row.get("beschouwingsniveau"),
            "beschouwingsniveauLabel": row.get("beschouwingsniveauLabel"),
            "modelsoort": row.get("modelsoort"),
            "modelsoortLabel": row.get("modelsoortLabel"),
        })

    for row in task_rows:
        tech = tech_by_uri.get(row.get("tech"))
        if not tech:
            continue

        tech["taken"].append({
            "taakinvulling": row.get("taakinvulling"),
            "omschrijving": row.get("omschrijving"),
            "taaktype": row.get("taaktype"),
            "taaktypeLabel": row.get("taaktypeLabel"),
        })

    for row in relation_rows:
        tech = tech_by_uri.get(row.get("tech"))
        if not tech:
            continue

        related_uri = row.get("gerelateerdeTechnologie")
        related_label = row.get("gerelateerdeTechnologieNaam") or (local_name(related_uri) if related_uri else "")
        related_anchor = anchor_by_uri.get(related_uri, slugify(related_label))

        tech["relaties"].append({
            "relatie": row.get("relatie"),
            "typeRelatieLabel": row.get("typeRelatieLabel"),
            "beschrijvingRelatie": row.get("beschrijvingRelatie"),
            "gerelateerdeTechnologie": related_uri,
            "gerelateerdeTechnologieNaam": related_label,
            "gerelateerdeAnchor": related_anchor,
        })

    for row in source_rows:
        tech = tech_by_uri.get(row.get("tech"))
        if not tech:
            continue

        tech["bronnen"].append({
            "bron": row.get("bron"),
            "titel": row.get("titel"),
            "pagina": row.get("pagina"),
            "verwijzing": row.get("verwijzing"),
        })

    for tech in technologies:
        tech["functionaliteiten"] = unique_items(tech["functionaliteiten"])
        tech["gebruikersgroepen"] = unique_items(tech["gebruikersgroepen"])
        tech["ondersteuningsvormen"] = unique_items(
            tech["ondersteuningsvormen"],
            key="support"
        )
        tech["taken"] = unique_items(tech["taken"], key="taakinvulling")
        tech["relaties"] = unique_items(tech["relaties"], key="relatie")
        tech["bronnen"] = unique_items(tech["bronnen"], key="bron")

        tech["functionaliteiten"].sort(key=lambda x: (x.get("label") or "").lower())
        tech["gebruikersgroepen"].sort(key=lambda x: (x.get("label") or "").lower())
        tech["taken"].sort(key=lambda x: (x.get("taaktypeLabel") or "").lower())
        tech["relaties"].sort(key=lambda x: (x.get("typeRelatieLabel") or "").lower())
        tech["bronnen"].sort(key=lambda x: (x.get("titel") or "").lower())

    technologies.sort(key=lambda t: (t.get("naam") or "").lower())

    return technologies


def build_taxonomies(graph: Graph):
    taxonomy_rows = execute_select(graph, "taxonomies.rq")
    member_rows = execute_select(graph, "taxonomy_members.rq")

    taxonomies = []

    for row in taxonomy_rows:
        uri = row.get("collection") or ""
        label = row.get("label") or local_name(uri)

        taxonomies.append({
            "uri": uri,
            "id": local_name(uri),
            "anchor": slugify(label),
            "label": label,
            "definition": row.get("definition"),
            "members": [],
        })

    taxonomy_by_uri = {taxonomy["uri"]: taxonomy for taxonomy in taxonomies}

    for row in member_rows:
        taxonomy = taxonomy_by_uri.get(row.get("collection"))
        if not taxonomy:
            continue

        member_uri = row.get("member") or ""
        member_label = row.get("label") or local_name(member_uri)

        taxonomy["members"].append({
            "uri": member_uri,
            "id": local_name(member_uri),
            "anchor": slugify(member_label),
            "label": member_label,
            "definition": row.get("definition"),
        })

    for taxonomy in taxonomies:
        taxonomy["members"] = unique_items(taxonomy["members"])
        taxonomy["members"].sort(key=lambda m: (m.get("label") or "").lower())

    taxonomies.sort(key=lambda t: (t.get("label") or "").lower())

    return taxonomies


def build_organisations(graph: Graph):
    rows = execute_select(graph, "organisations.rq")

    organisations = []

    for row in rows:
        uri = row.get("organisation")
        naam = row.get("naam") or local_name(uri or "")

        organisations.append({
            "uri": uri,
            "id": local_name(uri or ""),
            "anchor": slugify(naam),
            "naam": naam,
            "contactinformatie": row.get("contactinformatie"),
        })

    organisations = unique_items(organisations)
    organisations.sort(key=lambda o: (o.get("naam") or "").lower())

    return organisations


def build_classes(graph: Graph):
    rows = execute_select(graph, "classes.rq")

    classes = []

    for row in rows:
        uri = row.get("class")
        label = row.get("label") or local_name(uri or "")

        classes.append({
            "uri": uri,
            "id": local_name(uri or ""),
            "anchor": slugify(label),
            "label": label,
            "comment": row.get("comment"),
            "subClassOf": row.get("subClassOf"),
            "subClassOfLabel": row.get("subClassOfLabel"),
        })

    classes = unique_items(classes)
    classes.sort(key=lambda c: (c.get("label") or "").lower())

    return classes


def build_properties(graph: Graph):
    object_rows = execute_select(graph, "object_properties.rq")
    datatype_rows = execute_select(graph, "datatype_properties.rq")

    object_properties = []
    datatype_properties = []

    for row in object_rows:
        uri = row.get("property")
        label = row.get("label") or local_name(uri or "")

        object_properties.append({
            "uri": uri,
            "id": local_name(uri or ""),
            "anchor": slugify(label),
            "label": label,
            "comment": row.get("comment"),
            "domain": row.get("domain"),
            "domainLabel": row.get("domainLabel"),
            "range": row.get("range"),
            "rangeLabel": row.get("rangeLabel"),
        })

    for row in datatype_rows:
        uri = row.get("property") or ""
        label = row.get("label") or local_name(uri)

        datatype_properties.append({
            "uri": uri,
            "id": local_name(uri),
            "anchor": slugify(label),
            "label": label,
            "comment": row.get("comment"),
            "domain": row.get("domain"),
            "domainLabel": row.get("domainLabel"),
            "range": row.get("range"),
            "rangeLabel": row.get("rangeLabel"),
        })

    object_properties = unique_items(object_properties)
    datatype_properties = unique_items(datatype_properties)

    object_properties.sort(key=lambda p: (p.get("label") or "").lower())
    datatype_properties.sort(key=lambda p: (p.get("label") or "").lower())

    return object_properties, datatype_properties


def build_shapes(graph: Graph):
    rows = execute_select(graph, "shapes.rq")

    grouped = defaultdict(list)

    for row in rows:
        shape_uri = row.get("shape")
        if shape_uri:
            grouped[shape_uri].append(row)

    shapes = []

    for shape_uri, rows in grouped.items():
        label = first_value(rows, "shapeLabel") or local_name(shape_uri)

        shape = {
            "uri": shape_uri,
            "id": local_name(shape_uri),
            "anchor": slugify(label),
            "label": label,
            "targetClass": first_value(rows, "targetClass"),
            "targetClassLabel": first_value(rows, "targetClassLabel"),
            "properties": [],
        }

        for row in rows:
            path = row.get("path")
            if not path:
                continue

            prop_label = row.get("propertyLabel") or local_name(path)

            shape["properties"].append({
                "propertyShape": row.get("propertyShape"),
                "order": row.get("order"),
                "path": path,
                "pathLabel": row.get("pathLabel") or local_name(path),
                "propertyLabel": prop_label,
                "description": row.get("description"),
                "minCount": row.get("minCount"),
                "maxCount": row.get("maxCount"),
                "datatype": row.get("datatype"),
                "class": row.get("class"),
                "node": row.get("node"),
                "nodeKind": row.get("nodeKind"),
            })

        shape["properties"] = unique_items(shape["properties"], key="propertyShape")

        def sort_key(prop):
            order = prop.get("order")
            try:
                return int(order)
            except (TypeError, ValueError):
                return 999999

        shape["properties"].sort(key=sort_key)
        shapes.append(shape)

    shapes.sort(key=lambda s: (s.get("label") or "").lower())

    return shapes


def render_fragment(env, template_name: str, output_file: Path, **context):
    template = env.get_template(template_name)
    content = template.render(**context)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(content.strip() + "\n", encoding="utf-8")

    print(f"Geschreven: {output_file}")


def main():
    if not TBOX_FILE.exists():
        raise FileNotFoundError(f"TBox-bestand niet gevonden: {TBOX_FILE}")

    if not ABOX_FILE.exists():
        raise FileNotFoundError(f"ABox-bestand niet gevonden: {ABOX_FILE}")

    graph = Graph()
    graph.parse(TBOX_FILE, format="turtle")
    if TASKS_FILE.exists():
        graph.parse(TASKS_FILE, format="turtle")
    graph.parse(ABOX_FILE, format="turtle")

    metadata = build_metadata(graph)
    technologies = build_technologies(graph)
    taxonomies = build_taxonomies(graph)
    organisations = build_organisations(graph)

    # Deze drie onderdelen zijn optioneel, maar handig voor ontologie.md.
    # Ze vereisen de queries classes.rq, object_properties.rq,
    # datatype_properties.rq en shapes.rq.
    classes = build_classes(graph)
    object_properties, datatype_properties = build_properties(graph)
    shapes = build_shapes(graph)

    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=False,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    common_context = {
        "metadata": metadata,
        "tbox_file": str(TBOX_FILE),
        "tasks_file": str(TASKS_FILE),
        "abox_file": str(ABOX_FILE),
        "generated_on": date.today().isoformat(),
    }

    render_fragment(
        env,
        "catalogus.md.j2",
        OUTPUT_FILES["catalogus"],
        technologies=technologies,
        **common_context,
    )

    render_fragment(
        env,
        "taxonomieen.md.j2",
        OUTPUT_FILES["taxonomieen"],
        taxonomies=taxonomies,
        **common_context,
    )

    render_fragment(
        env,
        "organisaties.md.j2",
        OUTPUT_FILES["organisaties"],
        organisations=organisations,
        **common_context,
    )

    render_fragment(
        env,
        "ontologie.md.j2",
        OUTPUT_FILES["ontologie"],
        classes=classes,
        object_properties=object_properties,
        datatype_properties=datatype_properties,
        shapes=shapes,
        **common_context,
    )

    render_fragment(
        env,
        "generatieverantwoording.md.j2",
        OUTPUT_FILES["generatieverantwoording"],
        technologies=technologies,
        taxonomies=taxonomies,
        organisations=organisations,
        classes=classes,
        object_properties=object_properties,
        datatype_properties=datatype_properties,
        shapes=shapes,
        **common_context,
    )

    print()
    print("Klaar.")
    print(f"Aantal technologieën: {len(technologies)}")
    print(f"Aantal taxonomieën: {len(taxonomies)}")
    print(f"Aantal organisaties: {len(organisations)}")
    print(f"Aantal klassen: {len(classes)}")
    print(f"Aantal objecteigenschappen: {len(object_properties)}")
    print(f"Aantal datatype-eigenschappen: {len(datatype_properties)}")
    print(f"Aantal shapes: {len(shapes)}")


if __name__ == "__main__":
    main()
