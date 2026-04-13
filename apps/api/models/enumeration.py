from marshmallow import Schema, fields


class EnumerationSchema(Schema):
    name = fields.Str(required=True, description="The name of the enumeration group (e.g. 'Functionaliteiten', 'Technologietypen', 'Taaktypen', 'Normstatussen', 'Gebruiksstatussen', 'Licentievormen', 'Gebruikersgroepen') as per SKOS ConceptScheme in ontology.")
    values = fields.List(fields.Str(), required=True, description="The possible values for this enumeration group, as defined in the ontology SKOS ConceptScheme.")
