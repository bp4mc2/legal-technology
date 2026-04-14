from marshmallow import Schema, fields




class OndersteuningVoorSchema(Schema):
    beschouwingsniveau = fields.Str(required=True)
    modelsoort = fields.Str(required=True)

class GeschiktVoorTaakSchema(Schema):
    omschrijving = fields.Str(required=True)
    taaktype = fields.Str(required=True)


class BronverwijzingSchema(Schema):
    titel = fields.Str(required=True)
    locatie = fields.Str(required=True)
    verwijzing = fields.Str(required=False)

class DocumentatieSchema(Schema):
    beoogdGebruik = fields.Str(required=False)
    toegevoegdeWaarde = fields.Str(required=False)
    onderdelen = fields.Str(required=False)
    ontwikkelingEnBeheer = fields.Str(required=False)


class VersiebeschrijvingSchema(Schema):
    versienummer = fields.Str(required=False)
    versiedatum = fields.Str(required=False)


class LegalTechnologySchema(Schema):
    id = fields.Str(required=True)
    abbrevation = fields.Str(required=False)
    versienummer = fields.Str(required=False)
    versiedatum = fields.Str(required=False)
    subtype = fields.Str(required=False)
    naam = fields.Str(required=True)
    omschrijving = fields.Str(required=True)
    gebruiksstatus = fields.Str(required=True, description="Gebruiksstatus (SKOS concept)")
    licentievorm = fields.Str(required=True, description="Licentievorm (SKOS concept)")
    geboden_functionaliteit = fields.List(fields.Str(), required=True, description="Functionaliteiten (SKOS concepten)")
    technologietype = fields.Str(required=False, description="Type of technology (SKOS concept)")
    taaktype = fields.Str(required=False, description="Type of task (SKOS concept)")
    beoogde_gebruikers = fields.List(fields.Str(), required=True, description="Gebruikersgroepen (SKOS concepten)")
    bijgewerkt_op = fields.Str(required=True)
    ondersteuning_voor = fields.List(fields.Nested(OndersteuningVoorSchema), required=True)
    geschikt_voor_taak = fields.List(fields.Nested(GeschiktVoorTaakSchema), required=True)
    documentatie = fields.Nested(DocumentatieSchema, required=False)
    bronverwijzing = fields.List(fields.Nested(BronverwijzingSchema), required=False)
    normstatus = fields.Str(required=False, description="Normstatus (SKOS concept)")
    beheerder = fields.Str(required=False, description="IRI van bestaande lto:Organisatie (herbruikbare resource)")
    leverancier = fields.Str(required=False, description="IRI van bestaande lto:Organisatie (herbruikbare resource)")
    type_technologie = fields.List(fields.Str(), required=False, description="Type technologie (SKOS concepten)")





class LegalTechnologyCreateSchema(Schema):
    abbrevation = fields.Str(required=False)
    versienummer = fields.Str(required=False)
    versiedatum = fields.Str(required=False)
    subtype = fields.Str(required=False)
    naam = fields.Str(required=True)
    omschrijving = fields.Str(required=True)
    gebruiksstatus = fields.Str(required=True)
    licentievorm = fields.Str(required=True)
    geboden_functionaliteit = fields.List(fields.Str(), required=True)
    technologietype = fields.Str(required=False)
    taaktype = fields.Str(required=False)
    beoogde_gebruikers = fields.List(fields.Str(), required=True)
    bijgewerkt_op = fields.Str(required=True)
    ondersteuning_voor = fields.List(fields.Nested(OndersteuningVoorSchema), required=True)
    geschikt_voor_taak = fields.List(fields.Nested(GeschiktVoorTaakSchema), required=True)
    documentatie = fields.Nested(DocumentatieSchema, required=False)
    bronverwijzing = fields.List(fields.Nested(BronverwijzingSchema), required=False)
    normstatus = fields.Str(required=False)
    beheerder = fields.Str(required=False)
    leverancier = fields.Str(required=False)
    type_technologie = fields.List(fields.Str(), required=False)




class LegalTechnologyUpdateSchema(Schema):
    id = fields.Str(required=False)
    abbrevation = fields.Str(required=False)
    versienummer = fields.Str(required=False)
    versiedatum = fields.Str(required=False)
    subtype = fields.Str(required=False)
    naam = fields.Str()
    omschrijving = fields.Str()
    gebruiksstatus = fields.Str()
    licentievorm = fields.Str()
    geboden_functionaliteit = fields.List(fields.Str())
    technologietype = fields.Str()
    taaktype = fields.Str()
    beoogde_gebruikers = fields.List(fields.Str())
    bijgewerkt_op = fields.Str()
    ondersteuning_voor = fields.List(fields.Nested(OndersteuningVoorSchema))
    geschikt_voor_taak = fields.List(fields.Nested(GeschiktVoorTaakSchema))
    documentatie = fields.Nested(DocumentatieSchema, required=False)
    bronverwijzing = fields.List(fields.Nested(BronverwijzingSchema), required=False)
    normstatus = fields.Str()
    beheerder = fields.Str()
    leverancier = fields.Str()
    type_technologie = fields.List(fields.Str())
