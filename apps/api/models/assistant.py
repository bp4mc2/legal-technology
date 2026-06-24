from marshmallow import Schema, fields

class AssistantQuerySchema(Schema):
  """Schema for assistant queries"""
  query = fields.Str(required=True, description="Natural language query")
  language = fields.Str(
    load_default='nl',
    description="Language code: 'nl' for Dutch, 'en' for English"
  )


class AssistantResponseSchema(Schema):
  """Schema for assistant responses"""
  intent = fields.Str(description="Detected intent (search, add, edit, delete, show, stats, info, error)")
  action = fields.Str(description="Action to perform")
  parameters = fields.Dict(description="Extracted parameters")
  summary = fields.Str(description="Human-readable summary")
  error = fields.Str(description="Error message if applicable")
  timestamp = fields.Str(description="ISO timestamp of response")
  language = fields.Str(description="Language of the response")
  provider = fields.Str(description="Configured runtime provider (docker or ollama)")


class AssistantStatusSchema(Schema):
  """Schema for assistant status"""
  status = fields.Str(description="Overall status (ok or error)")
  message = fields.Str(description="Additional message or error details")
  error = fields.Str(description="Error details")
