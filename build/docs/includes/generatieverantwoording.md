## Generatieverantwoording

Dit document is automatisch gegenereerd uit RDF/Turtle-bronnen. De inhoud van de catalogus, taxonomieën, organisaties en ontologie wordt direct afgeleid uit deze bronbestanden.

### Bronbestanden

| Type | Bestand |
|---|---|
| TBox | `C:\Users\Erwin Straver\projects\wendbare wetsuitvoering\model\juridische technologie.ttl` |
| ABox | `C:\Users\Erwin Straver\projects\wendbare wetsuitvoering\data\all-legal-technologies.ttl` |

### Generatie

De documentatie is gegenereerd met behulp van:

- Python (RDFLib voor het parsen van RDF/Turtle)
- SPARQL-queries voor het selecteren van gegevens
- Jinja2-templates voor het genereren van Markdown
- ReSpec voor de uiteindelijke weergave van het document

Datum van generatie: `2026-06-24`

Ontologieversie: `0.2.0`

Datum van de ontologie: `2026-03-31`

### Statistieken

| Onderdeel | Aantal |
|---|---|
| Juridische technologieën | 57 |
| Taxonomieën | 0 |
| Organisaties | 8 |
| Klassen | 11 |
| Objecteigenschappen | 21 |
| Datatype-eigenschappen | 12 |
| SHACL-shapes | 23 |

### Werkwijze

De generatie van dit document volgt de volgende stappen:

1. Het laden van de TBox en ABox in een RDF graph.
2. Het uitvoeren van SPARQL-queries om gegevens te verzamelen.
3. Het opbouwen van Python-datastructuren op basis van de query-resultaten.
4. Het renderen van Markdown-fragmenten met behulp van Jinja2.
5. Het opnemen van deze fragmenten in het ReSpec-document via `data-include`.

### Opmerkingen

- Handmatige wijzigingen in de gegenereerde Markdown-bestanden kunnen bij een volgende generatie worden overschreven.
- De inhoud van dit document is afhankelijk van de kwaliteit en volledigheid van de RDF-bronnen.
- Onvolledige of ontbrekende gegevens in de TBox of ABox kunnen leiden tot lege velden in dit document.

### Reproduceerbaarheid

De generatie van dit document kan opnieuw worden uitgevoerd met:

```bash
python generate_respec.py
