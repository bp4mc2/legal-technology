# Copilot Instructions — Legal Tech Typology

Always use docs/typologie.md as the primary framework.
Apply constraints in this order of priority:
1. Classification
2. Mapping
3. Output style and tagging
If constraints conflict or space is limited, keep 1 and 2 complete before applying 3.

When analysing legal technology:

## Always include:
- TL;DR (max 3 sentences)
- A structured table

## Always classify:
- methode / standaard / tool
- beschouwingsniveau (tekstueel / semantisch / ontologisch / logisch / technisch)
- type model (descriptief / normatief)
- gebruikers
- gebruiksstatus
- normstatus

## Always map:
- juridische taken (using typologie definitions)
- beleidscyclus:
  - opstellen
  - implementatie
  - uitvoering
  - evaluatie

## Style:
- concise
- bullet points
- no long paragraphs
- consistent terminology with typologie.md

## Do NOT:
- invent categories outside the typology
- skip classification fields

## Tagging rules

Always include YAML frontmatter in Markdown files with:
- name
- type
- beschouwingsniveau
- model_type
- gebruikers
- gebruiksstatus
- normstatus
- juridische_taken
- beleidscyclus

Validate YAML frontmatter field names and value types against schemas/legal-tech.schema.json.
