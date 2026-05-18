from marshmallow import Schema, fields


class EnumerationSchema(Schema):
    name = fields.Str(required=True, description="The name of the enumeration group (e.g. 'Functionaliteiten', 'Technologietypen', 'Taaktypen', 'Normstatussen', 'Gebruiksstatussen', 'Licentievormen', 'Gebruikersgroepen') as per SKOS ConceptScheme in ontology.")
    values = fields.List(fields.Raw(), required=True, description="The possible values for this enumeration group. Values may be plain labels or objects with label/iri.")


class TaskTypeSchema(Schema):
    iri = fields.Str(required=True, description="The IRI of the task type concept.")
    label = fields.Str(required=True, description="The human-readable label of the task type.")
    description = fields.Str(required=False, allow_none=True, description="The task type description from skos:definition.")
    group_iri = fields.Str(required=False, allow_none=True, description="The IRI of the task group OrderedCollection.")
    group_label = fields.Str(required=False, allow_none=True, description="The human-readable label of the task group.")
    group_order = fields.Int(required=False, allow_none=True, description="Order of task group based on collection identifier/label.")
    task_order = fields.Int(required=False, allow_none=True, description="Order of task inside the group's memberList.")
