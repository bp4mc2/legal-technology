from typing import Any, Dict
import json

def parse_assistant_response(response: str) -> Dict[str, Any]:
    """Extract JSON from model response; fallback to info response."""
    try:
        start_idx = response.find("{")
        end_idx = response.rfind("}") + 1
        if start_idx != -1 and end_idx > start_idx:
            return json.loads(response[start_idx:end_idx])
    except json.JSONDecodeError:
        pass

    return {
        "intent": "info",
        "skill": None,
        "action": "provide_information",
        "parameters": {},
        "confidence": 0.0,
        "summary": response,
    }
