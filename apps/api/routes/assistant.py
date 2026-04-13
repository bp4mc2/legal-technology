"""
API routes for the natural language assistant.
"""
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
from api.services.assistant_service import process_natural_language_query, get_assistant_status

# Define schemas
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
  provider = fields.Str(description="Runtime provider (docker or ollama)")
  runtime = fields.Str(description="Runtime status (running or not_available)")
  model = fields.Str(description="Configured model name")
  model_available = fields.Bool(description="Whether Mistral model is available")
  models = fields.List(fields.Str(), description="List of available models")
  message = fields.Str(description="Additional message or error details")


# Create blueprint
blp = Blueprint(
  'assistant',
  'assistant',
  url_prefix='/api/assistant',
  description='Natural language assistant endpoints'
)


@blp.route('/status', methods=['GET'])
@blp.response(200, AssistantStatusSchema)
def get_status():
  """Check if the assistant runtime is available"""
  return get_assistant_status()


@blp.route('/ask', methods=['POST'])
@blp.arguments(AssistantQuerySchema)
@blp.response(200, AssistantResponseSchema)
def ask(data):
  """
  Process a natural language query and return structured action.
  
  Supports both Dutch and English queries.
  """
  query = data.get('query', '')
  language = data.get('language', 'nl')
  
  if language not in ['nl', 'en']:
    abort(400, message="Language must be 'nl' (Dutch) or 'en' (English)")
  
  result = process_natural_language_query(query, language)
  
  # Check for errors
  if result.get('intent') == 'error':
    return result, 503 if 'not available' in result.get('error', '').lower() else 400
  
  return result
