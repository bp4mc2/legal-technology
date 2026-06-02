from marshmallow import Schema, fields


class ProductSchema(Schema):
    id = fields.Str(required=True, description="Stable identifier derived from the product IRI.")
    iri = fields.Str(required=True, description="Canonical IRI of the product concept.")
    label = fields.Str(required=True, description="Human-readable label of the product concept.")


class ProductTraceabilityRelationSchema(Schema):
    task_id = fields.Str(required=True, description="Stable identifier derived from the related task IRI.")
    task_iri = fields.Str(required=True, description="Canonical IRI of the related task concept.")
    task_label = fields.Str(required=True, description="Human-readable label of the related task concept.")
    predicate = fields.Str(required=True, description="Canonical ontology predicate that links the product to the task.")
    relation_kind = fields.Str(required=True, description="Grouped relation kind for UI consumption: input or output.")


class ProductTraceabilityRelationsSchema(Schema):
    input = fields.List(
        fields.Nested(ProductTraceabilityRelationSchema),
        required=True,
        description="Tasks that consume the product as input.",
    )
    output = fields.List(
        fields.Nested(ProductTraceabilityRelationSchema),
        required=True,
        description="Tasks that produce the product as output.",
    )


class ProductTraceabilitySchema(Schema):
    product = fields.Nested(ProductSchema, required=True)
    relations = fields.Nested(ProductTraceabilityRelationsSchema, required=True)


class ContributionEvidenceLinkSchema(Schema):
    title = fields.Str(required=False, allow_none=True, description="Human-readable evidence title when available.")
    location = fields.Str(required=False, allow_none=True, description="Evidence source location (for example URL or path).")
    reference = fields.Str(required=False, allow_none=True, description="Optional citation/reference string from source metadata.")


class ContributionTechnologySchema(Schema):
    id = fields.Str(required=True, description="Stable identifier for the contributing technology.")
    iri = fields.Str(required=True, description="Canonical IRI of the contributing technology.")
    label = fields.Str(required=True, description="Human-readable technology label.")
    evidence_links = fields.List(
        fields.Nested(ContributionEvidenceLinkSchema),
        required=True,
        description="Evidence links associated with this contribution node, when available.",
    )


class ProductContributionTaskNodeSchema(Schema):
    task_id = fields.Str(required=True, description="Stable identifier for the contribution task node.")
    task_iri = fields.Str(required=True, description="Canonical IRI of the contribution task node.")
    task_label = fields.Str(required=True, description="Human-readable task label.")
    predicate = fields.Str(required=True, description="Ontology predicate connecting product to task.")
    relation_kind = fields.Str(required=True, description="Contribution relation kind: input or output.")
    missing_node = fields.Bool(required=True, description="Indicates whether contribution traversal has missing node data.")
    missing_reason = fields.Str(required=False, allow_none=True, description="Explanation for missing-node situations.")
    technologies = fields.List(
        fields.Nested(ContributionTechnologySchema),
        required=True,
        description="Technologies contributing through the task node.",
    )


class ProductContributionGroupsSchema(Schema):
    input = fields.List(
        fields.Nested(ProductContributionTaskNodeSchema),
        required=True,
        description="Contribution chain nodes for product input semantics.",
    )
    output = fields.List(
        fields.Nested(ProductContributionTaskNodeSchema),
        required=True,
        description="Contribution chain nodes for product output semantics.",
    )


class ProductContributionChainSchema(Schema):
    product = fields.Nested(ProductSchema, required=True)
    chains = fields.Nested(ProductContributionGroupsSchema, required=True)
    partial_data = fields.Bool(required=True, description="True when one or more contribution nodes are incomplete or missing.")