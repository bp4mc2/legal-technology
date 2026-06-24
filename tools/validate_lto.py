from pathlib import Path

from rdflib import Graph, Namespace
from pyshacl import validate

SH = Namespace("http://www.w3.org/ns/shacl#")

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "all-legal-technologies.ttl"
SHAPES_PATH = ROOT / "model" / "juridische technologie.ttl"
TASKS_PATH = ROOT / "model" / "taken.ttl"


def _copy_non_shacl_triples(source: Graph, target: Graph):
    for subject, predicate, obj in source:
        if str(predicate).startswith(str(SH)):
            continue
        if str(subject).startswith(str(SH)):
            continue
        if str(obj).startswith(str(SH)):
            continue
        target.add((subject, predicate, obj))

# Load data and model
print(f"Loading data from {DATA_PATH.relative_to(ROOT)}...")
g = Graph()
g.parse(str(DATA_PATH), format="turtle")
g.parse(str(TASKS_PATH), format="turtle")

model_support = Graph()
model_support.parse(str(SHAPES_PATH), format="turtle")
_copy_non_shacl_triples(model_support, g)

print(f"Loading shapes from {SHAPES_PATH.relative_to(ROOT)}...")
s = Graph()
s.parse(str(SHAPES_PATH), format="turtle")

print(f"Loading ontology support from {TASKS_PATH.relative_to(ROOT)}...")
o = Graph()
o.parse(str(SHAPES_PATH), format="turtle")
o.parse(str(TASKS_PATH), format="turtle")

print(f"Data graph: {len(g)} triples")
print(f"Shapes graph: {len(s)} triples")
print(f"Ontology graph: {len(o)} triples")

# Run SHACL validation
print("\nRunning SHACL validation...")
conforms, results_graph, results_text = validate(g, shacl_graph=s, ont_graph=o, inference='rdfs')
print(f"Conforms: {conforms}")
if not conforms:
    print(results_text[:3000])
