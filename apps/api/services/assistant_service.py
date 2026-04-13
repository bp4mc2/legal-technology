"""
Natural language assistant service with Ollama/Mistral integration.
Handles natural language queries and converts them to structured commands.
"""
from typing import Dict, Any, Optional
import os
import configparser
import requests
import json
from datetime import datetime

ASSISTANT_CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../config/assistant.ini'))
LEGACY_GRAPHDB_CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../config/graphdb.ini'))

def _get_assistant_config() -> Dict[str, Any]:
  """Read assistant runtime config from INI with sane defaults."""
  config = configparser.ConfigParser()
  # Prefer dedicated assistant config, keep legacy fallback for smooth migration.
  config.read([ASSISTANT_CONFIG_PATH, LEGACY_GRAPHDB_CONFIG_PATH])
  return {
    'provider': config.get('assistant', 'provider', fallback='docker').lower(),
    'docker_model_url': config.get('assistant', 'docker_model_url', fallback='http://localhost:12434'),
    'docker_model_name': config.get('assistant', 'docker_model_name', fallback='ai/mistral'),
    'ollama_url': config.get('assistant', 'ollama_url', fallback='http://localhost:11434/api/generate'),
    'ollama_model': config.get('assistant', 'ollama_model', fallback='mistral'),
    'fallback_ollama': config.getboolean('assistant', 'fallback_ollama', fallback=True),
    'timeout': config.getint('assistant', 'timeout', fallback=120),
    'max_tokens': config.getint('assistant', 'max_tokens', fallback=220),
  }


_ASSISTANT_CONFIG = _get_assistant_config()

# Environment vars override INI values when explicitly set.
OLLAMA_URL = os.getenv('OLLAMA_URL', _ASSISTANT_CONFIG['ollama_url'])
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', _ASSISTANT_CONFIG['ollama_model'])
ASSISTANT_PROVIDER = os.getenv('ASSISTANT_PROVIDER', _ASSISTANT_CONFIG['provider']).lower()
DOCKER_MODEL_URL = os.getenv('DOCKER_MODEL_URL', _ASSISTANT_CONFIG['docker_model_url'])
DOCKER_MODEL_NAME = os.getenv('DOCKER_MODEL_NAME', _ASSISTANT_CONFIG['docker_model_name'])
ASSISTANT_FALLBACK_OLLAMA = os.getenv(
  'ASSISTANT_FALLBACK_OLLAMA',
  str(_ASSISTANT_CONFIG['fallback_ollama']).lower(),
).lower() == 'true'
ASSISTANT_TIMEOUT = int(os.getenv('ASSISTANT_TIMEOUT', str(_ASSISTANT_CONFIG['timeout'])))
ASSISTANT_MAX_TOKENS = int(os.getenv('ASSISTANT_MAX_TOKENS', str(_ASSISTANT_CONFIG['max_tokens'])))


def _get_runtime_settings() -> Dict[str, Any]:
  """Load assistant settings at runtime so INI changes are picked up without restart."""
  cfg = _get_assistant_config()
  provider = os.getenv('ASSISTANT_PROVIDER', cfg['provider']).lower()
  docker_model_url = os.getenv('DOCKER_MODEL_URL', cfg['docker_model_url'])
  docker_model_name = os.getenv('DOCKER_MODEL_NAME', cfg['docker_model_name'])
  ollama_url = os.getenv('OLLAMA_URL', cfg['ollama_url'])
  ollama_model = os.getenv('OLLAMA_MODEL', cfg['ollama_model'])
  fallback_ollama = os.getenv(
    'ASSISTANT_FALLBACK_OLLAMA',
    str(cfg['fallback_ollama']).lower(),
  ).lower() == 'true'
  timeout = int(os.getenv('ASSISTANT_TIMEOUT', str(cfg['timeout'])))
  max_tokens = int(os.getenv('ASSISTANT_MAX_TOKENS', str(cfg['max_tokens'])))

  return {
    'provider': provider,
    'docker_model_url': docker_model_url,
    'docker_model_name': docker_model_name,
    'ollama_url': ollama_url,
    'ollama_model': ollama_model,
    'fallback_ollama': fallback_ollama,
    'timeout': timeout,
    'max_tokens': max_tokens,
  }

# System prompts in Dutch and English
SYSTEM_PROMPTS = {
    'nl': """Je bent een juridische technologie assistent. Je helpt gebruikers bij het zoeken, toevoegen, bewerken en verwijderen van juridische technologieën.

Je hebt toegang tot de volgende acties:
- SEARCH: Zoeken naar juridische technologieën (bijv. "Zoek alle methodes voor regelgeving")
- ADD: Toevoegen van nieuwe technologieën
- EDIT: Bewerken van bestaande technologieën
- DELETE: Verwijderen van technologieën
- SHOW: Weergeven van details over een technologie
- STATS: Tonen van statistieken

Wanneer een gebruiker een vraag stelt, probeer de intentie te begrijpen en geef een gestructureerde respons in dit JSON-format:
{
  "intent": "search|add|edit|delete|show|stats|info",
  "action": "De uit te voeren actie",
  "parameters": {
    "query": "zoekterm",
    "type": "Methode|Standaard|Tool (optioneel)",
    "task": "taaktype (optioneel)",
    "id": "technologie-id (optioneel)"
  },
  "summary": "Samenvatting in Nederlands"
}

Bekend zijn:
- Ontologie domein: Juridische Technologie
- Types: Methode (gestructureerde aanpak), Standaard (informatiestandaard), Tool (informatievoorziening)
- Taken: Regelgeving, Wetsuitvoering, Analyse

Antwoord altijd in Nederlands behalve als de gebruiker expliciet Engels gebruikt.""",

    'en': """You are a legal technology assistant. You help users search, add, edit and delete legal technologies.

You have access to the following actions:
- SEARCH: Search for legal technologies (e.g., "Find all methods for legislation")
- ADD: Add new technologies
- EDIT: Edit existing technologies
- DELETE: Delete technologies
- SHOW: Display details about a technology
- STATS: Show statistics

When a user asks a question, try to understand the intent and provide a structured response in this JSON format:
{
  "intent": "search|add|edit|delete|show|stats|info",
  "action": "The action to perform",
  "parameters": {
    "query": "search term",
    "type": "Method|Standard|Tool (optional)",
    "task": "task type (optional)",
    "id": "technology-id (optional)"
  },
  "summary": "Summary in English"
}

Known concepts:
- Domain: Legal Technology
- Types: Method (structured approach), Standard (information standard), Tool (information system)
- Tasks: Legislation, Law Enforcement, Analysis

Always respond in English unless the user explicitly uses Dutch."""
}


def _compose_prompt(prompt: str, language: str) -> str:
  """Compose system + user prompt for non-chat endpoints."""
  system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS['nl'])
  return f'{system_prompt}\n\nUser: {prompt}'


def query_ollama(
  prompt: str,
  language: str = 'nl',
  timeout: int = 30,
  ollama_url: str = OLLAMA_URL,
  ollama_model: str = OLLAMA_MODEL,
  max_tokens: int = ASSISTANT_MAX_TOKENS,
) -> Optional[str]:
  """Query a local Ollama model endpoint."""
  try:
    response = requests.post(
      ollama_url,
      json={
        'model': ollama_model,
        'prompt': _compose_prompt(prompt, language),
        'stream': False,
        'temperature': 0.2,
        'options': {
          'num_predict': max_tokens,
        },
      },
      timeout=timeout
    )
    response.raise_for_status()
    return response.json().get('response', '')
  except requests.exceptions.ConnectionError:
    return None
  except requests.exceptions.Timeout:
    return None
  except Exception as e:
    return f'Error querying Ollama: {str(e)}'


def _resolve_docker_model_name(model_name: str) -> str:
  """Add :latest suffix when the configured model name has no tag."""
  return model_name if ':' in model_name else f'{model_name}:latest'


def query_docker_model(
  prompt: str,
  language: str = 'nl',
  timeout: int = 120,
  docker_model_url: str = DOCKER_MODEL_URL,
  docker_model_name: str = DOCKER_MODEL_NAME,
  max_tokens: int = ASSISTANT_MAX_TOKENS,
) -> Optional[str]:
  """Query Docker Model Runner using OpenAI-compatible chat completion API.

  Key requirements for Docker Model Runner:
  - stream must be False (default is streaming which never terminates)
  - model name needs the :latest tag
  - timeout should be generous (first inference can take 30-60s)
  """
  system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS['nl'])
  base_url = docker_model_url.rstrip('/')
  model_name = _resolve_docker_model_name(docker_model_name)

  payload = {
    'model': model_name,
    'messages': [
      {'role': 'system', 'content': system_prompt},
      {'role': 'user', 'content': prompt},
    ],
    'temperature': 0.2,
    'max_tokens': max_tokens,
    'stream': False,
  }

  endpoint = f'{base_url}/v1/chat/completions'
  last_error: Optional[str] = None

  try:
    response = requests.post(endpoint, json=payload, timeout=timeout)
    response.raise_for_status()
    data = response.json()
    choices = data.get('choices', [])
    if choices:
      return choices[0].get('message', {}).get('content', '')
    return data.get('output_text', '')
  except requests.exceptions.ConnectionError as e:
    last_error = f'Docker model runner not reachable at {endpoint}: {e}'
  except requests.exceptions.Timeout:
    last_error = f'Docker model runner timed out after {timeout}s for {endpoint}'
  except Exception as e:
    last_error = f'Docker model runner error ({type(e).__name__}): {e}'

  print(f'[assistant] {last_error}')
  return None


def query_provider(prompt: str, language: str = 'nl') -> Optional[str]:
  """Query configured provider with optional fallback."""
  settings = _get_runtime_settings()

  if settings['provider'] == 'docker':
    docker_response = query_docker_model(
      prompt,
      language,
      settings['timeout'],
      settings['docker_model_url'],
      settings['docker_model_name'],
      settings['max_tokens'],
    )
    if docker_response is not None:
      return docker_response
    if settings['fallback_ollama']:
      return query_ollama(
        prompt,
        language,
        settings['timeout'],
        settings['ollama_url'],
        settings['ollama_model'],
        settings['max_tokens'],
      )
    return None

  return query_ollama(
    prompt,
    language,
    settings['timeout'],
    settings['ollama_url'],
    settings['ollama_model'],
    settings['max_tokens'],
  )


def parse_assistant_response(response: str) -> Dict[str, Any]:
  """
  Parse the assistant response and extract structured action.
  
  Args:
    response: The raw response from the model
    
  Returns:
    Dictionary with intent, action, parameters, and summary
  """
  # Try to extract JSON from response
  try:
    # Look for JSON block in response
    start_idx = response.find('{')
    end_idx = response.rfind('}') + 1
    if start_idx != -1 and end_idx > start_idx:
      json_str = response[start_idx:end_idx]
      parsed = json.loads(json_str)
      return parsed
  except json.JSONDecodeError:
    pass
  
  # Fallback: return raw response in structured format
  return {
    'intent': 'info',
    'action': 'provide_information',
    'parameters': {},
    'summary': response
  }


def process_natural_language_query(query: str, language: str = 'nl') -> Dict[str, Any]:
  """
  Process a natural language query from the user.
  Integrates with Ollama to understand intent and parameters.
  
  Args:
    query: User's natural language query
    language: 'nl' or 'en'
    
  Returns:
    Structured response with intent, action, and parameters
  """
  if not query or not query.strip():
    return {
      'intent': 'error',
      'error': 'Empty query' if language == 'en' else 'Lege vraag',
      'summary': 'Please provide a question.' if language == 'en' else 'Stel alstublieft een vraag.'
    }
  
  # Query configured provider
  response = query_provider(query, language)
  
  if response is None:
    return {
      'intent': 'error',
      'error': 'Assistant model runtime not available',
      'summary': (
        'Could not connect to local model runtime. Check Docker Model Runner or Ollama.'
        if language == 'en'
        else 'Kon geen verbinding maken met het lokale model. Controleer Docker Model Runner of Ollama.'
      )
    }
  
  # Parse the response
  parsed = parse_assistant_response(response)
  settings = _get_runtime_settings()
  
  # Add metadata
  parsed['timestamp'] = datetime.now().isoformat()
  parsed['language'] = language
  parsed['provider'] = settings['provider']
  
  return parsed


def get_assistant_status() -> Dict[str, Any]:
  """Check configured assistant runtime and model availability."""
  settings = _get_runtime_settings()

  if settings['provider'] == 'docker':
    base_url = settings['docker_model_url'].rstrip('/')
    configured_model = _resolve_docker_model_name(settings['docker_model_name'])
    endpoints = [
      f'{base_url}/v1/models',
      f'{base_url}/models',
    ]
    for endpoint in endpoints:
      try:
        response = requests.get(endpoint, timeout=2)
        if response.status_code == 404:
          continue
        response.raise_for_status()
        payload = response.json()
        model_entries = payload.get('data', payload.get('models', []))
        names = []
        for entry in model_entries:
          name = entry.get('id') or entry.get('name')
          if name:
            names.append(name)
        model_available = any(configured_model == name for name in names) if names else True
        return {
          'status': 'ok',
          'provider': 'docker',
          'runtime': 'running',
          'model': configured_model,
          'model_available': model_available,
          'models': names,
        }
      except requests.exceptions.ConnectionError:
        break
      except Exception:
        continue

    return {
      'status': 'error',
      'provider': 'docker',
      'runtime': 'not_available',
      'model': configured_model,
      'model_available': False,
      'message': 'Docker model runtime not reachable on DOCKER_MODEL_URL. Default is http://localhost:12434.',
    }

  try:
    response = requests.get('http://localhost:11434/api/tags', timeout=2)
    if response.status_code == 200:
      models = response.json().get('models', [])
      names = [m.get('name') for m in models if m.get('name')]
      model_available = any(name.startswith(settings['ollama_model']) for name in names)
      return {
        'status': 'ok',
        'provider': 'ollama',
        'runtime': 'running',
        'model': settings['ollama_model'],
        'model_available': model_available,
        'models': names,
      }
  except requests.exceptions.ConnectionError:
    pass
  except Exception:
    pass

  return {
    'status': 'error',
    'provider': 'ollama',
    'runtime': 'not_available',
    'model': settings['ollama_model'],
    'model_available': False,
    'message': 'Ollama is not running. Start it with: ollama serve',
  }
