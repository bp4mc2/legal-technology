from marshmallow import Schema, fields
from api.models.legal_technology import LegalTechnologySchema
from api.models.definition import SKOSConceptRefSchema

class CapabilitySchema(Schema):
    """
      Functionele capability (taaktype met inputs/outputs))
      Dit is een afgeleid concept dat niet direct in de RDF staat, maar wordt geconstrueerd op basis van de taaktypes en hun relaties in de policy cycle.
    """
    
    # -------------------------
    # Identiteit (SKOS)
    # -------------------------
    uri = fields.Str(required=True)
    label = fields.Str(required=True)
    definition = fields.Str()

    # -------------------------
    # Proces
    # -------------------------
    inputs = fields.List(fields.Nested(SKOSConceptRefSchema), missing=[])
    outputs = fields.List(fields.Nested(SKOSConceptRefSchema), missing=[])

    follows = fields.List(fields.Nested(SKOSConceptRefSchema), missing=[])

    # -------------------------
    # Policy cycle
    # -------------------------
    order = fields.Int()

    # -------------------------
    # Technologie
    # -------------------------
    technologies = fields.List(fields.Nested(LegalTechnologySchema), missing=[])
    
    # -------------------------
    # Taak groep
    # -------------------------
    taskGroup = fields.Str()

    # -------------------------
    # Derived
    # -------------------------
    hasTechnology = fields.Bool()
    maturity = fields.Str()
    gaps = fields.List(fields.Str(), missing=[])