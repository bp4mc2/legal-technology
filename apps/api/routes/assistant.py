"""
API routes for the natural language assistant.
"""
from flask import Flask, jsonify, request
from flask_smorest import Blueprint, abort
from marshmallow import Schema, fields
# from api.models.assistant import AssistantQuerySchema, AssistantResponseSchema, AssistantStatusSchema
from api.services.assistant_service import get_assistant_status, list_skills, process_assistant_query

# Create blueprint
blp = Blueprint(
  'assistant',
  'assistant',
  url_prefix='/api/assistant',
  description='Natural language assistant endpoints'
)


@blp.route('/status', methods=['GET'])
async def assistant_status():
    """Async status check for assistant runtime and model availability."""

    force_refresh = request.args.get("refresh") in {"1", "true", "yes"}

    result = await get_assistant_status(
        force_refresh=force_refresh,
    )

    return jsonify(result)


@blp.route('/skills', methods=['GET'])
def list_all_skills():
    q = request.args.get('q', '').strip().lower()
    skills = list_skills()

    if q:
        skills = {
            skill.get("name", ""): skill
            for skill in skills
            if q in skill.get("name", "").lower()
            or q in str(skill.get("meta", {}).get("description", "")).lower()
        }

    return jsonify(skills)


# sync route for processing assistant queries - this can be extended to async if needed

@blp.route('/ask', methods=['POST'])
# @blp.arguments(AssistantQuerySchema)
# @blp.response(200, AssistantResponseSchema)
async def ask():
  """
  Process a natural language query and return structured action.
  
  Supports both Dutch and English queries.
  """
  data = request.get_json(silent=True) or {}
  
  query = data.get('query', '')
  language = data.get('language', 'nl')
  context = data.get('context', {})
    
  if language not in ['nl', 'en']:
    abort(400, message="Language must be 'nl' (Dutch) or 'en' (English)")
  
  # result = process_natural_language_query(query, language)
  
  result = await process_assistant_query(query, language, context)
  
  # result = {
  #   'intent': 'search',
  #   'action': 'search_concept',
  #   'parameters': {
  #     'concept': query
  #   },
  #   'summary': f"Search for concept matching '{query}' in language '{language}'",
  #   'language': language,
  #   'provider': 'docker'
  # }
  
  # Check for errors
  # if result.get('intent') == 'error':
  #   return result, 503 if 'not available' in result.get('error', '').lower() else 400
  
  return jsonify(result)
