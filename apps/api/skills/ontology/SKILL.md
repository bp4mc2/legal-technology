---
name: ontology
description: SPARQL powered ontology skill
version: 1.0.0
execution:
  type: handler
  handler: ontology_query
routing:
  triggers:
    - sparql
    - rdf
    - turtle
    - ontologie
    - ontology
    - juridisch
    - wet
  intents:
    - ontology_search
    - sparql_generation
    - concept_lookup
context:
  accepts:
    - page
    - selection
    - ontology
    - turtle
    - schema_summary
  requires_any:
    - ontology
    - turtle
    - schema_summary
output:
  mode: json
  schema: sparql_query_plan
---

Gebruik deze skill voor vragen over RDF, Turtle, ontologieën en SPARQL.

Regels:
- Gebruik alleen bekende prefixes, classes en properties uit de context.
- Genereer standaard SELECT queries.
- Voeg standaard LIMIT 100 toe bij SELECT queries.
- Maak geen INSERT, DELETE, DROP, LOAD, CLEAR of andere update queries.
- Als de ontology context onvoldoende informatie bevat, vraag om ontbrekende context.
