
import httpx
import asyncio
import time
import json
from typing import List, Dict, Any, Optional

from ..config import get_runtime_settings
from ..exceptions import AssistantConfigurationError

import logging
logger = logging.getLogger(__name__)

_model_lock = None
_model_lock_loop = None
_last_call = 0.0

def _get_model_lock() -> asyncio.Lock:
    global _model_lock, _model_lock_loop
    loop = asyncio.get_running_loop()
    if _model_lock is None or _model_lock_loop is not loop:
        _model_lock = asyncio.Lock()
        _model_lock_loop = loop
    return _model_lock


async def query_model(messages: List[Dict[str, str]], settings: Optional[Dict[str, Any]] = None) -> str:
    """Call the configured chat-completions compatible model endpoint."""
    global _last_call

    runtime = {**get_runtime_settings(), **(settings or {})}
    if not runtime["token"] or not runtime["models_url"]:
        raise AssistantConfigurationError(
            "Assistant runtime niet geconfigureerd. Controleer GITHUB_TOKEN en GITHUB_MODELS_URL."
        )

    payload = {
        "model": runtime["model"],
        "messages": messages,
        "max_tokens": runtime["max_tokens"],
        "temperature": runtime["temperature"],
    }
        
    logger.debug(
        "LLM request payload:\n%s",
        json.dumps(
            {
                **payload,
                # token en endpoint bewust niet volledig loggen
                "models_url": runtime.get("models_url"),
            },
            ensure_ascii=False,
            indent=2,
        ),
    )

    lock = _get_model_lock()
    async with lock:
        _last_call = time.time()
        async with httpx.AsyncClient(timeout=runtime.get("sparql_timeout", 30.0)) as client:
            response = await client.post(
                runtime["models_url"],
                json=payload,
                headers={
                    "Authorization": f"Bearer {runtime['token']}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
                        
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            logger.debug("LLM raw response:\n%s", content)
            
            return content
