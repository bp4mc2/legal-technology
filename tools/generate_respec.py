from pathlib import Path
from collections import defaultdict
from datetime import date
import re
import json
import shutil

from attrs import fields
from rdflib import Graph
from jinja2 import Environment, FileSystemLoader
from typing import Dict, List, Optional
from string import Template

from markdown.extensions import Extension
from markdown.preprocessors import Preprocessor

BASE_DIR = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
QUERY_DIR = PROJECT_ROOT / "queries"
TEMPLATE_DIR = PROJECT_ROOT / "templates"
MODEL_DIR = PROJECT_ROOT / "model"
DOCS_DIR = PROJECT_ROOT / "docs"
STATIC_DOCS_DIR = DOCS_DIR / "static"

BUILD_DIR = PROJECT_ROOT / "build" / "docs"
BUILD_INCLUDE_DIR = BUILD_DIR / "includes"
BUILD_RESPEC_DIR = BUILD_DIR / "respec"
BUILD_ASSETS_JS_DIR = BUILD_DIR / "assets" / "js"
BUILD_ASSETS_CSS_DIR = BUILD_DIR / "assets" / "css"
BUILD_ASSETS_IMG_DIR = BUILD_DIR / "assets" / "img"

TBOX_FILE = MODEL_DIR / "juridische technologie.ttl"
TASKS_FILE = MODEL_DIR / "taken.ttl"
BEGRIPPEN_FILE = MODEL_DIR / "begrippen.ttl"
ABOX_FILE = DATA_DIR / "all-legal-technologies.ttl"

OUTPUT_FILES = {
    # "catalogus-overzicht": BUILD_INCLUDE_DIR / "catalogus-overzicht.md",
    # "catalogus-details": BUILD_INCLUDE_DIR / "catalogus-details.md",
    "begrippenkader": BUILD_INCLUDE_DIR / "begrippenkader.html",
    "ontologie": BUILD_INCLUDE_DIR / "ontologie.md",
    "generatieverantwoording": BUILD_INCLUDE_DIR / "generatieverantwoording.md",
    "catalogus-details": BUILD_INCLUDE_DIR / "catalogus-details.html",
    "catalogus-overzicht": BUILD_INCLUDE_DIR / "catalogus-overzicht.html",
    "aandachtspunten": BUILD_INCLUDE_DIR / "aandachtspunten.md",
}

OUTPUT_HTML_FILES = {
    "index": BUILD_RESPEC_DIR / "index.html",
    "typologie": BUILD_RESPEC_DIR / "typologie.html",
    "catalogus": BUILD_RESPEC_DIR / "catalogus.html",
    "begrippenkader": BUILD_RESPEC_DIR / "begrippenkader.html",
    "ontologie": BUILD_RESPEC_DIR / "ontologie.html"
}

OUTPUT_JS_FILES = {
    "ontology-diagram-data": BUILD_ASSETS_JS_DIR / "ontology-diagram-data.js",
}

STATIC_INCLUDE_FILES = {
    "ontology-diagram": STATIC_DOCS_DIR / "includes" / "ontology-diagram.html",
}

STATIC_JS_FILES = {
    "ontology-diagram": STATIC_DOCS_DIR / "js" / "ontology-diagram.js",
    "technology-overview-filter": STATIC_DOCS_DIR / "js" / "technology-overview-filter.js"
}

STATIC_CSS_FILES = {
    "catalogus": STATIC_DOCS_DIR / "css" / "lto-detail.css",
}

STATIC_IMG_FILES = {
    "cyclus-svg": STATIC_DOCS_DIR / ".." / "cyclus.svg",
    "informatiemodel-svg": STATIC_DOCS_DIR / ".." / "informatiemodel.svg",
}

MANUAL_INCLUDE_FILES = {
    "typologie": DOCS_DIR / "typologie.md",
    "aandachtspunten": DOCS_DIR / "aandachtspunten.md",
}

_COLLECTIONS = {}

class ImagePathRewritePreprocessor(Preprocessor):
    def __init__(self, md, img_prefix="../assets/img/"):
        super().__init__(md)
        self.img_prefix = img_prefix

    def normalize_target(self, target: str) -> str:
        target = target.strip()

        # Laat externe/absolute/al herschreven paden ongemoeid
        if (
            target.startswith("http://")
            or target.startswith("https://")
            or target.startswith("/")
            or target.startswith("../assets/img/")
            or target.startswith("assets/img/")
            or target.startswith("data:")
            or target.startswith("#")
        ):
            return target

        return self.img_prefix + Path(target).name

    def run(self, lines):
        text = "\n".join(lines)

        # Markdown image syntax: ![alt](cyclus.svg)
        text = re.sub(
            r'(!\[[^\]]*\]\()([^)]+)(\))',
            lambda m: f"{m.group(1)}{self.normalize_target(m.group(2))}{m.group(3)}",
            text,
        )

        # HTML img tags: <img src="cyclus.svg">
        text = re.sub(
            r'(<img\b[^>]*\bsrc=["\'])([^"\']+)(["\'])',
            lambda m: f'{m.group(1)}{self.normalize_target(m.group(2))}{m.group(3)}',
            text,
            flags=re.IGNORECASE,
        )

        return text.splitlines()


class ImagePathRewriteExtension(Extension):
    def __init__(self, **kwargs):
        self.config = {
            "img_prefix": ["../assets/img/", "Prefix voor lokale image-bestanden"]
        }
        super().__init__(**kwargs)

    def extendMarkdown(self, md):
        preprocessor = ImagePathRewritePreprocessor(
            md,
            img_prefix=self.getConfig("img_prefix")
        )
        # Vroeg registreren, vóór normale parsing
        md.preprocessors.register(preprocessor, "image_path_rewrite", 35)

def _collections(graph: Graph):
    global _COLLECTIONS
    if not _COLLECTIONS:
        _COLLECTIONS = build_collections(graph, "technology_collections.rq")

    return _COLLECTIONS

def get_item_from_collection(collections: Dict, item_id: Optional[str] = None):
    if item_id is None:
        return {}
    
    for collection in collections.values():
        for item in collection.get("items", []):
            if item.get("uri") == item_id:
                return item            
    return {} 

def build_collections(graph: Graph, query_file: str):
    rows = execute_select(graph, query_file)
    collections = {}

    for row in rows:
        collection_id = local_name(row.get("collection") or "")
        collection = collections.get(collection_id)
        if not collection:
            collection = collections.setdefault(collection_id, {
                "id": collection_id,
                "uri": row.get("collection"),
                "label": row.get("collectionLabel") or local_name(row.get("collection") or ""),
                "definition": row.get("collectionDefinition"),
                "items": [],
            })
        item = {}
        item["concept"] = local_name(row.get("concept") or "")
        item["uri"] = row.get("concept")
        item["label"] = row.get("conceptLabel") or local_name(row.get("concept") or "")
        item["anchor"] = slugify(item["label"])
        item["definition"] = row.get("conceptDefinition")
        collection["items"].append(item)

    return collections

def copy_source_file(source_path: Path, target_path: Path):
    if not source_path.exists():
        raise FileNotFoundError(f"Bronbestand niet gevonden: {source_path}")

    target_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, target_path)
    print(f"Gekopieerd: {source_path} -> {target_path}")

def cytoscape_id(value: str) -> str:
    value = local_name(value or "")
    value = re.sub(r"[^a-zA-Z0-9_]", "_", value)
    if not value:
        value = "Thing"
    if value[0].isdigit():
        value = "_" + value
    return value


def build_cytoscape_elements(classes, object_properties, datatype_properties):
    elements = []
    class_ids = {}

    # Nodes voor klassen
    for cls in classes:
        uri = cls.get("uri")
        cid = cytoscape_id(uri or cls.get("id") or cls.get("label"))
        label = cls.get("label") or cls.get("id") or cid

        class_ids[uri] = cid

        elements.append({
            "data": {
                "id": cid,
                "label": label,
                "uri": uri,
                "type": "class",
                "comment": cls.get("comment") or "",
            }
        })

    # Subclass edges
    for cls in classes:
        child_uri = cls.get("uri")
        parent_uri = cls.get("subClassOf")

        if child_uri and parent_uri and child_uri in class_ids and parent_uri in class_ids:
            source = class_ids[child_uri]
            target = class_ids[parent_uri]

            elements.append({
                "data": {
                    "id": f"{source}_subClassOf_{target}",
                    "source": source,
                    "target": target,
                    "label": "subClassOf",
                    "type": "subClassOf",
                }
            })

    # Object property edges
    for prop in object_properties:
        domain_uri = prop.get("domain")
        range_uri = prop.get("range")

        if not domain_uri or not range_uri:
            continue

        if domain_uri not in class_ids or range_uri not in class_ids:
            continue

        source = class_ids[domain_uri]
        target = class_ids[range_uri]
        prop_id = cytoscape_id(prop.get("uri") or prop.get("id") or prop.get("label"))

        elements.append({
            "data": {
                "id": f"{source}_{prop_id}_{target}",
                "source": source,
                "target": target,
                "label": prop.get("label") or prop.get("id") or prop_id,
                "uri": prop.get("uri"),
                "type": "objectProperty",
            }
        })

    # Datatype properties als node-attributen
    datatype_props_by_class = defaultdict(list)

    for prop in datatype_properties:
        domain_uri = prop.get("domain")
        if domain_uri not in class_ids:
            continue

        cid = class_ids[domain_uri]
        datatype_props_by_class[cid].append({
            "label": prop.get("label") or prop.get("id"),
            "range": local_name(prop.get("range") or "") or "Literal",
            "uri": prop.get("uri"),
        })

    # Attributen toevoegen aan bestaande nodes
    for element in elements:
        data = element.get("data", {})
        if data.get("type") == "class":
            cid = data.get("id")
            data["attributes"] = datatype_props_by_class.get(cid, [])

    return elements

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


def execute_select(graph: Graph, query_file: str, params: Optional[Dict] = None):
    query = read_query(query_file)
    if params:
        query = Template(query).safe_substitute(params)
        # query = query.format(**params)
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


def parse_field(value: Optional[str], fields: Optional[list] = None, collections: Optional[Dict] = None) -> List[Dict]:
    if not value:
        return []

    items = [item.strip() for item in value.split("@@") if item.strip()]
    result = []

    for item in items:
        parts = [part.strip() for part in item.split("||")]
        if fields and len(parts) != len(fields):
            continue
        
        # check if the part is an URI
        new_parts = []
        for i, part in enumerate(parts):
            if part.startswith("http://") or part.startswith("https://"):
                # try to get the label from the collections
                if collections:
                    item_from_collection = get_item_from_collection(collections, part)
                    if item_from_collection:
                        new_parts.append(item_from_collection)
                    else:
                        new_parts.append(part)
            else:
                new_parts.append(part)
        
        if fields:
            result.append({field: part for field, part in zip(fields, new_parts)})
            continue

        # Zonder expliciete fields willen we nog steeds objecten in de lijst,
        # en URI-waarden als resolved collectie-objecten meenemen.
        if len(new_parts) == 1:
            part = new_parts[0]
            if isinstance(part, dict):
                result.append(dict(part))
            else:
                result.append({"value": part})
            continue

        result.append({f"value{i + 1}": part for i, part in enumerate(new_parts)})

    return result

def get_organisation_by_id(graph: Graph, org_id: Optional[str]) -> Optional[Dict]:
    if not org_id:
        return {}

    rows = execute_select(graph, "organisation_by_id.rq", params={"_ORG_ID": org_id})

    if not rows:
        return {}

    row = rows[0]

    return {
        "uri": row.get("organisation"),
        "id": local_name(row.get("organisation") or ""),
        "anchor": slugify(row.get("naam") or ""),
        "naam": row.get("naam"),
        "contactinformatie": row.get("contactinformatie"),
    }

def build_technologies(graph: Graph):
    technology_rows = execute_select(graph, "technologies_overview.rq")
    technologies = []
    
    for technology in technology_rows:
        tech_uri = technology.get("tech")
        if not tech_uri:
            continue
        
        id = local_name(tech_uri)
        anchor = slugify(f"{technology.get('naam')} {id}")
        
        technology_details = execute_select(graph, "technology_details.rq", params={"_TECH_IRI": tech_uri})
        tech_details = technology_details[0] if technology_details else {}
        
        tech = {
            "uri": tech_uri,
            "id": id,
            "anchor": anchor,
            "naam": tech_details.get('naam'),

            "type": tech_details.get("subtypeClass"),
            "typeLabel": tech_details.get("subtypeClassLabel"),

            "afkorting": tech_details.get("abbrevation"),
            "omschrijving": tech_details.get("omschrijving"),
            "gebruiksstatus": get_item_from_collection(_collections(graph), tech_details.get("gebruiksstatus")),
            "licentievorm": get_item_from_collection(_collections(graph), tech_details.get("licentievorm")),
            "bijgewerktOp": tech_details.get("bijgewerktOp"),

            "beheerder": get_organisation_by_id(graph, tech_details.get("beheerder")),
            "leverancier": get_organisation_by_id(graph, tech_details.get("leverancier")),

            "normstatus": get_item_from_collection(_collections(graph), tech_details.get("normstatus")),
            "typeTechnologie": get_item_from_collection(_collections(graph), tech_details.get("type_technologie")),

            "versienummer": tech_details.get("versienummer"),
            "versiedatum": tech_details.get("versiedatum"),

            "ontwikkelingEnBeheer": tech_details.get("ontwikkelingEnBeheer"),

            "functionaliteiten": parse_field(tech_details.get("geboden_functionaliteit"), collections=_collections(graph)),
            "gebruikersgroepen": parse_field(tech_details.get("beoogde_gebruikers"), collections=_collections(graph)),
            "ondersteuningsvormen": parse_field(tech_details.get("ondersteuning_voor", ""), fields=['beschouwingsniveau', 'modelsoort'], collections=_collections(graph)),
            "taken": parse_field(tech_details.get("geschikt_voor_taak", ""), fields=['taak_omschrijving', 'taaktype'], collections=_collections(graph)),
            "relaties": parse_field(tech_details.get("relaties", ""), collections=_collections(graph)),
            "bronnen": parse_field(tech_details.get("bronverwijzing", ""), fields=['bron_titel', 'bron_locatie', 'bron_verwijzing'], collections=_collections(graph)),
            "documentatie": parse_field(tech_details.get("documentatie", ""), fields=['beoogdGebruik', 'toegevoegdeWaarde', 'onderdelen', 'ontwikkelingEnBeheer'], collections=_collections(graph)),
        }


        technologies.append(tech)

    return technologies


def build_terms(graph: Graph):
    term_rows = execute_select(graph, "begrippen.rq")

    terms = []

    for row in term_rows:
        uri = row.get("concept") or ""
        label = row.get("label") or local_name(uri)

        terms.append({
            "uri": uri,
            "id": local_name(uri),
            "anchor": slugify(label),
            "label": label,
            "definition": row.get("definition"),
            "scope": row.get("scope"),
            "editorial": row.get("editorial"),
            "related": row.get("related"),
            "relatedLabel": row.get("relatedLabel"),
            "broader": row.get("broader"),
            "broaderLabel": row.get("broaderLabel"),
            "narrower": row.get("narrower"),
            "narrowerLabel": row.get("narrowerLabel"),
        })

    return terms


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


def render(env, template_name: str, output_file: Path, **context):
    template = env.get_template(template_name)
    content = template.render(**context)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(content.strip() + "\n", encoding="utf-8")

    print(f"Geschreven: {output_file}")

def render_markdown(markdown_text: str) -> str:
    """
    Render Markdown text to HTML using the 'markdown' library.
    If the 'markdown' library is not available, return the original text.
    """
    try:
        import markdown
        from markdown.extensions.toc import TocExtension
        from markdown.extensions.tables import TableExtension

        md = markdown.Markdown(
            extensions=[
                TocExtension(
                    slugify=lambda value, sep: slugify(value)
                ), TableExtension(), ImagePathRewriteExtension(img_prefix="../assets/img/")
            ]
        )
        html = md.convert(markdown_text)
        return html
    except ImportError:
        print("Markdown library not found. Returning original text.")
        return markdown_text

def inline_include_files(include_files):
    """
    Bestaande helper, maar nu alleen nog verantwoordelijk voor
    het inlinen/renderen van include-bestanden zonder page-heading-logica.
    """
    result = []
    for include_item in include_files:
        item = dict(include_item)
        include_path = item.get("path")
        content_format = item.get("format")

        if include_path and "content" not in item:
            source_path = (BUILD_RESPEC_DIR / include_path).resolve()
            raw_content = source_path.read_text(encoding="utf-8")

            if content_format == "markdown":
                item["content"] = render_markdown(raw_content)
            else:
                item["content"] = raw_content

        result.append(item)
    return result


def extract_first_markdown_header(text: str):
    """
    Haal de eerste H1 (# Titel) uit markdown en geef terug:
    (heading, markdown_zonder_die_eerste_h1)

    Andere koppen blijven intact.
    """
    lines = text.splitlines()
    heading = None
    result = []
    found = False

    i = 0
    while i < len(lines):
        line = lines[i]
        if not found and line.startswith("# "):
            heading = line[2:].strip()
            found = True
            i += 1
            # verwijder ook lege regels direct na de H1
            while i < len(lines) and not lines[i].strip():
                i += 1
            continue
        result.append(line)
        i += 1

    return heading, "\n".join(result)


def prepare_page(page: Dict) -> Dict:
    """
    Verwerk alle includes van één page en leid optioneel page.heading af
    uit precies één include met provides_page_heading=True.
    """
    page = dict(page)
    include_files = []
    derived_heading = page.get("heading")
    heading_provider_count = 0

    for include_item in page.get("include_files", []):
        item = dict(include_item)
        include_path = item.get("path")
        content_format = item.get("format")
        provides_page_heading = item.get("provides_page_heading", False)

        if include_path and "content" not in item:
            source_path = (BUILD_RESPEC_DIR / include_path).resolve()
            raw_content = source_path.read_text(encoding="utf-8")

            if content_format == "markdown":
                if provides_page_heading:
                    heading_provider_count += 1
                    extracted_heading, raw_content = extract_first_markdown_header(raw_content)
                    if extracted_heading and not derived_heading:
                        derived_heading = extracted_heading
                item["content"] = render_markdown(raw_content)
            else:
                item["content"] = raw_content

        include_files.append(item)

    if heading_provider_count > 1:
        raise ValueError(
            f"Page '{page.get('key')}' heeft meerdere includes met provides_page_heading=True"
        )

    page["include_files"] = include_files
    page["heading"] = derived_heading or page.get("title")
    return page


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
    if BEGRIPPEN_FILE.exists():
        graph.parse(BEGRIPPEN_FILE, format="turtle")
        
    metadata = build_metadata(graph)
    technologies = build_technologies(graph)
    # taxonomies = build_taxonomies(graph)
    terms = build_terms(graph)
    organisations = build_organisations(graph)

    # Deze drie onderdelen zijn optioneel, maar handig voor ontologie.md.
    # Ze vereisen de queries classes.rq, object_properties.rq,
    # datatype_properties.rq en shapes.rq.
    classes = build_classes(graph)
    object_properties, datatype_properties = build_properties(graph)
    shapes = build_shapes(graph)

    cytoscape_elements = build_cytoscape_elements(
        classes,
        object_properties,
        datatype_properties,
    )

    BUILD_INCLUDE_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_RESPEC_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_ASSETS_JS_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_ASSETS_CSS_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_ASSETS_IMG_DIR.mkdir(parents=True, exist_ok=True)
    
    copy_source_file(
        MANUAL_INCLUDE_FILES["typologie"],
        BUILD_INCLUDE_DIR / "typologie.md",
    )

    copy_source_file(
        MANUAL_INCLUDE_FILES["aandachtspunten"],
        BUILD_INCLUDE_DIR / "aandachtspunten.md",
    )


    copy_source_file(
        STATIC_INCLUDE_FILES["ontology-diagram"],
        BUILD_INCLUDE_DIR / "ontology-diagram.html",
    )

    copy_source_file(
        STATIC_JS_FILES["ontology-diagram"],
        BUILD_ASSETS_JS_DIR / "ontology-diagram.js",
    )
    
    copy_source_file(
        STATIC_CSS_FILES["catalogus"],
        BUILD_ASSETS_CSS_DIR / "lto-detail.css",
    )
    
    copy_source_file(
        STATIC_IMG_FILES["cyclus-svg"],
        BUILD_ASSETS_IMG_DIR / "cyclus.svg",
    )
    
    copy_source_file(
        STATIC_IMG_FILES["informatiemodel-svg"],
        BUILD_ASSETS_IMG_DIR / "informatiemodel.svg",
    )

    copy_source_file(
        STATIC_JS_FILES["technology-overview-filter"],
        BUILD_ASSETS_JS_DIR / "technology-overview-filter.js",
    )

    diagram_data_js = (
        "window.ontologyDiagramElements = " +
        json.dumps(cytoscape_elements, ensure_ascii=False, indent=2) +
        ";\n"
    )

    OUTPUT_JS_FILES["ontology-diagram-data"].write_text(
        diagram_data_js,
        encoding="utf-8"
    )

    print(f"Geschreven: {OUTPUT_JS_FILES['ontology-diagram-data']}")

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
        
    render(
        env,
        "catalogus-overzicht.html.j2",
        OUTPUT_FILES["catalogus-overzicht"],
        technologies=technologies,
        technology_collection=_collections(graph).get("Technologietypen", {}).get("items", []),
        status_collection=_collections(graph).get("Gebruiksstatussen", {}).get("items", []),
        **common_context,
    )

    render(
        env,
        "catalogus-details.html.j2",
        OUTPUT_FILES["catalogus-details"],
        technologies=technologies,
        **common_context,
    )

    render(
        env,
        "begrippenkader.html.j2",
        OUTPUT_FILES["begrippenkader"],
        terms=terms,
        enumerations=_collections(graph),
        **common_context,
    )

    render(
        env,
        "ontologie.md.j2",
        OUTPUT_FILES["ontologie"],
        classes=classes,
        object_properties=object_properties,
        datatype_properties=datatype_properties,
        shapes=shapes,
        **common_context,
    )

    render(
        env,
        "generatieverantwoording.md.j2",
        OUTPUT_FILES["generatieverantwoording"],
        technologies=technologies,
        terms=terms,
        organisations=organisations,
        classes=classes,
        object_properties=object_properties,
        datatype_properties=datatype_properties,
        shapes=shapes,
        **common_context,
    )
    
    pages = [
        {
            "key": "typologie",
            "title": "Typologie juridische technologieën",
            "description": "De beschrijving van de typologie van juridische technologieën.",
            "heading": None,
            "include_files": [
                {"path": "../includes/typologie.md", "format": "markdown", "provides_page_heading": True},
            ],
            "output_file": "typologie.html",
        },
        {
            "key": "catalogus",
            "title": "Catalogus juridische technologieën",
            "description": "Deze pagina biedt een overzicht van juridische technologieën die een rol kunnen spelen bij de ontwikkeling, toepassing en evaluatie van wet- en regelgeving. Per technologie is beknopte informatie opgenomen over de aard, status, functionaliteiten en actualiteit, met doorklikmogelijkheden naar meer uitgebreide beschrijvingen.",
            "heading": None,
            "include_files": [
                {"path": "../includes/catalogus-overzicht.html", "format": "html"},
                {"path": "../includes/catalogus-details.html", "format": "html"},
            ],
            "output_file": "catalogus.html",
        },
        {
            "key": "begrippenkader",
            "title": "Begrippenkader",
            "description": "Overzicht van begrippen, definities en classificaties.",
            "heading": None,
            "include_files": [
                {"path": "../includes/begrippenkader.html", "format": "html", "provides_page_heading": True},
            ],
            "output_file": "begrippenkader.html",
        },
        {
            "key": "ontologie",
            "title": "Ontologie",
            "description": "Technische beschrijving van klassen, eigenschappen en SHACL-shapes.",
            "heading": None,
            "include_files": [
                {"path": "../includes/ontologie.md", "format": "markdown", "provides_page_heading": True},
                {"path": "../includes/ontology-diagram.html", "format": "html"},
            ],
            "output_file": "ontologie.html",
        },
    ]

    pages = [prepare_page(page) for page in pages]
    
    stats = {
        "technologies": len(technologies),
        "terms": len(terms),
        "organisations": len(organisations),
        "classes": len(classes),
        "object_properties": len(object_properties),
        "datatype_properties": len(datatype_properties),
        "shapes": len(shapes),
    }

    render(
        env,
        "respec_index.html.j2",
        OUTPUT_HTML_FILES["index"],
        pages=pages,
        generation_justification="../includes/generatieverantwoording.md",
        aandachtspunten="../includes/aandachtspunten.md",
        **common_context,
    )

    for page in pages:
        render(
            env,
            "respec_page.html.j2",
            OUTPUT_HTML_FILES[page["key"]],
            page=page,
            pages=pages,
            stats=stats,
            **common_context,
        )    

    print()
    print("Klaar.")
    print(f"Aantal technologieën: {len(technologies)}")
    print(f"Aantal begrippen: {len(terms)}")
    print(f"Aantal organisaties: {len(organisations)}")
    print(f"Aantal klassen: {len(classes)}")
    print(f"Aantal objecteigenschappen: {len(object_properties)}")
    print(f"Aantal datatype-eigenschappen: {len(datatype_properties)}")
    print(f"Aantal shapes: {len(shapes)}")


if __name__ == "__main__":
    main()
