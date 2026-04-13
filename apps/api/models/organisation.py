from marshmallow import Schema, fields


class OrganisatieSchema(Schema):
    """Schema for lto:Organisatie resources."""
    iri = fields.Str(required=True, description="IRI of the organisation (e.g. http://example.org/org/123)")
    naam = fields.Str(required=True, description="Naam van de organisatie")
    contactinformatie = fields.Str(required=True, description="Contactinformatie van de organisatie")


class OrganisatieCreateSchema(Schema):
    """Schema for creating a new organisation."""
    naam = fields.Str(required=True, description="Naam van de organisatie")
    contactinformatie = fields.Str(required=True, description="Contactinformatie van de organisatie")


class OrganisatieUpdateSchema(Schema):
    """Schema for updating an organisation."""
    naam = fields.Str()
    contactinformatie = fields.Str()
