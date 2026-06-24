import asyncio
import hashlib
import os
import time

from typing import Any, Dict, Optional, List

from .config import get_runtime_settings
from .handlers import HANDLERS, resolve_handler_name, plan_requires_handler
from .llm import query_model, parse_assistant_response
from .prompts import compose_messages
from .skills import SkillRegistry, SkillRouter
from .context import ContextEnvelope
from .context_provider import ContextProvider

_STATUS_CACHE: Optional[Dict[str, Any]] = None
_STATUS_CACHE_FINGERPRINT: Optional[str] = None
_STATUS_CACHE_LOCK = asyncio.Lock()


def _status_cache_ttl_seconds() -> int:
    """
    0 betekent: cache voor de levensduur van het backend-proces.
    Zet ASSISTANT_STATUS_CACHE_SECONDS op bijv. 300 voor 5 minuten TTL.
    """
    return int(os.getenv("ASSISTANT_STATUS_CACHE_SECONDS", "0"))


def _runtime_fingerprint(runtime: Dict[str, Any]) -> str:
    """
    Cache ongeldig maken als endpoint/model/token wijzigt.
    Token wordt alleen gehasht, niet gelogd of teruggegeven.
    """
    token_hash = hashlib.sha256(
        str(runtime.get("token", "")).encode("utf-8")
    ).hexdigest()

    raw = "|".join(
        [
            str(runtime.get("models_url", "")),
            str(runtime.get("model", "")),
            token_hash,
        ]
    )

    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def _cache_is_valid(
    cache: Optional[Dict[str, Any]],
    fingerprint: str,
    now: float,
) -> bool:
    if not cache:
        return False

    if cache.get("_fingerprint") != fingerprint:
        return False

    ttl = _status_cache_ttl_seconds()

    # ttl 0 = cache voor backend-sessie/proces
    if ttl <= 0:
        return True

    cached_at = float(cache.get("_cached_at", 0))
    return now - cached_at < ttl


async def process_assistant_query(
    query: str,
    language: str = "nl",
    context: Optional[Dict[str, Any]] = None,
    settings: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if not query or not query.strip():
        return {
            "intent": "error",
            "error": "Lege vraag",
            "summary": "Stel alstublieft een vraag.",
        }

    runtime = {**get_runtime_settings(), **(settings or {})}
    frontend_envelope = ContextEnvelope.from_dict(context)
    
    context_provider = ContextProvider(runtime)
    envelope = await context_provider.enrich(
        query=query,
        envelope=frontend_envelope,
    )
    
    registry = SkillRegistry(runtime["skill_dir"])
    router = SkillRouter(registry)

    active_skills = router.route(query, envelope)

    messages = compose_messages(
        query=query,
        language=language,
        active_skills=active_skills,
        context=envelope,
    )

    raw_response = await query_model(messages, runtime)
    plan = parse_assistant_response(raw_response)

    handler_result = None
    handler_name = resolve_handler_name(plan, active_skills)

    if handler_name and plan_requires_handler(plan):
        handler_result = await HANDLERS.execute(
            handler_name,
            plan,
            envelope,
            runtime,
        )

    return {
        "intent": plan.get("intent", "info"),
        "skill": plan.get("skill"),
        "action": plan.get("action"),
        "parameters": plan.get("parameters", {}),
        "confidence": plan.get("confidence"),
        "summary": plan.get("summary", raw_response),
        "selected_skills": [s.routing_summary() for s in active_skills],
        "handler_result": handler_result,
        "raw_response": raw_response,
    }
    
# async def get_assistant_status(settings: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
#     """Check runtime config, model reachability and loaded skills."""
#     runtime = {**get_runtime_settings(), **(settings or {})}
#     registry = SkillRegistry(runtime["skill_dir"])

#     if not runtime["token"] or not runtime["models_url"]:
#         return {
#             "status": "error",
#             "message": "Assistant runtime niet geconfigureerd",
#             "error": "Missing GITHUB_TOKEN or GITHUB_MODELS_URL",
#             "skills": registry.summaries(),
#         }

#     try:
#         await query_model([{"role": "user", "content": "Zeg alleen: OK"}], {**runtime, "max_tokens": 5})
#     except Exception as exc:
#         return {
#             "status": "error",
#             "message": "API niet bereikbaar — controleer endpoint, model-id en token",
#             "error": str(exc),
#             "skills": registry.summaries(),
#         }

#     return {
#         "status": "ok",
#         "message": "API bereikbaar en model beschikbaar",
#         "error": "",
#         "skills": registry.summaries(),
#     }

async def get_assistant_status(
    settings: Optional[Dict[str, Any]] = None,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Check runtime config, model reachability and loaded skills.

    Status wordt gecached zodat de frontend niet bij elke status-call
    opnieuw de LLM/API hoeft te pingen.

    force_refresh=True forceert een nieuwe echte model/API-check.
    """
    global _STATUS_CACHE, _STATUS_CACHE_FINGERPRINT

    runtime = {**get_runtime_settings(), **(settings or {})}
    registry = SkillRegistry(runtime["skill_dir"])

    fingerprint = _runtime_fingerprint(runtime)
    now = time.time()

    # Config ontbreekt: geen LLM-call nodig, maar wel cachebaar.
    if not runtime["token"] or not runtime["models_url"]:
        result = {
            "status": "error",
            "model_available": False,
            "message": "Assistant runtime niet geconfigureerd",
            "error": "Missing GITHUB_TOKEN or GITHUB_MODELS_URL",
            "skills": registry.summaries(),
            "cached": False,
            "cache_scope": "backend_session",
        }

        _STATUS_CACHE = {
            **result,
            "_cached_at": now,
            "_fingerprint": fingerprint,
        }
        _STATUS_CACHE_FINGERPRINT = fingerprint

        return result

    async with _STATUS_CACHE_LOCK:
        # Double-check binnen lock, zodat parallelle status-calls niet allemaal pingen.
        if not force_refresh and _cache_is_valid(_STATUS_CACHE, fingerprint, now):
            cached_result = {
                k: v
                for k, v in (_STATUS_CACHE or {}).items()
                if not k.startswith("_")
            }

            # Skills eventueel actueel houden zonder LLM opnieuw te pingen.
            cached_result["skills"] = registry.summaries()
            cached_result["cached"] = True
            cached_result["cache_scope"] = "backend_session"

            return cached_result

        try:
            await query_model(
                [{"role": "user", "content": "Zeg alleen: OK"}],
                {**runtime, "max_tokens": 5},
            )
        except Exception as exc:
            result = {
                "status": "error",
                "model_available": False,
                "message": "API niet bereikbaar — controleer endpoint, model-id en token",
                "error": str(exc),
                "skills": registry.summaries(),
                "cached": False,
                "cache_scope": "backend_session",
            }
        else:
            result = {
                "status": "ok",
                "model_available": True,
                "message": "API bereikbaar en model beschikbaar",
                "error": "",
                "skills": registry.summaries(),
                "cached": False,
                "cache_scope": "backend_session",
            }

        _STATUS_CACHE = {
            **result,
            "_cached_at": now,
            "_fingerprint": fingerprint,
        }
        _STATUS_CACHE_FINGERPRINT = fingerprint

        return result


def list_skills(settings: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Public helper for exposing loaded skills in diagnostics/admin UI."""
    runtime = {**get_runtime_settings(), **(settings or {})}
    return SkillRegistry(runtime["skill_dir"]).summaries()
