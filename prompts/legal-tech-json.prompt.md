# Legal Tech JSON Generator

Follow apps/docs/typologie.md strictly as the primary framework for all JSON generation.

## Input
Technologie: {{naam}}
If {{naam}} is missing or invalid, return only this JSON: {"error":"missing_or_invalid_technologie_naam"}

## Requirements
- Step 1: Generate a JSON object that conforms to schemas/legal-tech.schema.json
- Step 2: Use exact enum values from the schema
- Step 3: Use typology terms exactly as defined in apps/docs/typologie.md
- Step 4: Do not include extra fields outside the schema
- Step 5: Use arrays for:
  - beschouwingsniveau
  - gebruikers
  - juridische_taken
  - beleidscyclus

## Output
ONLY valid JSON (no explanation)
