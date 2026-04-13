from marshmallow import Schema, fields


class DefinitionSchema(Schema):
    """SKOS Definition schema as per ontology and terms.ttl"""
    uri = fields.Str(required=True, description="SKOS Concept URI")
    label = fields.Str(required=True, description="SKOS prefLabel")
    altLabel = fields.List(fields.Str(), description="SKOS altLabel (alternative labels)")
    definition = fields.Str(required=True, description="SKOS definition")
    scopeNote = fields.List(fields.Str(), description="SKOS scopeNote (scope information)")
    editorialNote = fields.List(fields.Str(), description="SKOS editorialNote (editorial notes)")
    language = fields.Str(required=False, description="Language tag (e.g. 'nl', 'en')")
    related = fields.List(fields.Dict(), description="Related concepts")
    broaderGeneric = fields.List(fields.Dict(), description="Broader generic concepts")
    narrowerGeneric = fields.List(fields.Dict(), description="Narrower generic concepts")


class DefinitionCreateSchema(Schema):
    """Create SKOS Definition as per ontology and terms.ttl"""
    uri = fields.Str(required=True)
    label = fields.Str(required=True)
    altLabel = fields.List(fields.Str(), required=False)
    definition = fields.Str(required=True)
    scopeNote = fields.List(fields.Str(), required=False)
    editorialNote = fields.List(fields.Str(), required=False)
    language = fields.Str(description="Language tag (optional, default 'nl')")


class DefinitionUpdateSchema(Schema):
    """Update SKOS Definition as per ontology and terms.ttl"""
    label = fields.Str()
    altLabel = fields.List(fields.Str(), required=False)
    definition = fields.Str()
    scopeNote = fields.List(fields.Str(), required=False)
    editorialNote = fields.List(fields.Str(), required=False)
    language = fields.Str()
