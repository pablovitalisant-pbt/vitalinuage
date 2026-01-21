from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import logging
import asyncio
from typing import List, Optional, Dict, Any
import time
import re
import html

import httpx

# Setup Logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/diagnosis",
    tags=["Diagnosis AI"]
)

# Output Schema (kept to avoid breaking frontend)
class CIE10Suggestion(BaseModel):
    code: str
    description: str
    relevance_reason: str

class DiagnosisResponse(BaseModel):
    suggestions: List[CIE10Suggestion]

class DiagnosisRequest(BaseModel):
    text: str


# -----------------------------
# WHO ICD-11 API client (OAuth2)
# -----------------------------
WHO_TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token"
WHO_RELEASE = os.getenv("ICD_RELEASE", "2024-01")  # can be overridden via env later
WHO_SEARCH_URL = f"https://id.who.int/icd/release/11/{WHO_RELEASE}/mms/search"

# Token cache (in-memory)
_WHO_TOKEN: Optional[str] = None
_WHO_TOKEN_EXP: float = 0.0


def _strip_html(s: str) -> str:
    # Removes <em class='found'>...</em> etc.
    if not s:
        return s
    s = html.unescape(s)
    s = re.sub(r"<[^>]+>", "", s)
    return s.strip()


async def _get_who_token() -> str:
    """
    Gets and caches WHO OAuth2 token. No assumptions:
    - If env vars missing -> 503 (service misconfigured)
    - If token endpoint fails -> 503 (service unavailable)
    """
    global _WHO_TOKEN, _WHO_TOKEN_EXP

    now = time.time()
    if _WHO_TOKEN and now < (_WHO_TOKEN_EXP - 30):  # 30s safety margin
        return _WHO_TOKEN

    client_id = os.getenv("ICD_CLIENT_ID", "")
    client_secret = os.getenv("ICD_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        logger.error("[DIAGNOSIS AUDIT] ICD_CLIENT_ID/ICD_CLIENT_SECRET missing")
        raise HTTPException(
            status_code=503,
            detail="Diagnosis service not configured (ICD credentials missing)."
        )

    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "icdapi_access",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                WHO_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if r.status_code != 200:
                logger.error(f"[DIAGNOSIS AUDIT] WHO token error {r.status_code}: {r.text[:200]}")
                raise HTTPException(status_code=503, detail="ICD token service unavailable")

            payload = r.json()
            token = payload.get("access_token")
            expires_in = payload.get("expires_in", 0)

            if not token:
                logger.error(f"[DIAGNOSIS AUDIT] WHO token missing access_token: {str(payload)[:200]}")
                raise HTTPException(status_code=503, detail="ICD token service invalid response")

            _WHO_TOKEN = token
            # expires_in is seconds
            _WHO_TOKEN_EXP = now + (int(expires_in) if expires_in else 900)

            return token

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DIAGNOSIS AUDIT] WHO token exception: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=503, detail="ICD token service unavailable")


async def _who_get_json(url: str, token: str) -> Dict[str, Any]:
    # WHO redirects http -> https (301). Force HTTPS and follow redirects.
    if url.startswith("http://"):
        url = "https://" + url[len("http://"):]

    headers = {
        "Authorization": f"Bearer {token}",
        "API-Version": "v2",
        "Accept": "application/json",
        "Accept-Language": "es",
    }

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        r = await client.get(url, headers=headers)
        if r.status_code != 200:
            logger.warning(
                f"[DIAGNOSIS AUDIT] WHO GET {r.status_code} url={url} body={r.text[:200]}"
            )
            raise HTTPException(status_code=503, detail="ICD service unavailable")
        return r.json()


def _extract_code(entity_json: Dict[str, Any]) -> str:
    """
    WHO entity responses can vary; we look for known code fields.
    If not found, return empty string (caller can fallback).
    """
    for key in ("code", "theCode", "icdCode"):
        val = entity_json.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def _extract_title(entity_json: Dict[str, Any]) -> str:
    """
    Try common title fields; fallback to empty.
    """
    title = entity_json.get("title")
    if isinstance(title, str) and title.strip():
        return _strip_html(title)

    # Sometimes title is nested
    if isinstance(title, dict):
        t = title.get("@value") or title.get("value")
        if isinstance(t, str) and t.strip():
            return _strip_html(t)

    return ""


async def get_icd11_suggestions(text: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Search ICD-11 via WHO official API and return list of dicts {code, description, relevance_reason}.
    """
    token = await _get_who_token()

    # Search (flexisearch for partial/approx)
    q = text.strip()
    search_url = f"{WHO_SEARCH_URL}?q={httpx.QueryParams({'q': q})['q']}&useFlexisearch=true&flatResults=true&limit={limit}"

    search_json = await _who_get_json(search_url, token)
    entities = search_json.get("destinationEntities", []) or []

    suggestions: List[Dict[str, str]] = []

    # For each entity, call its id URL to retrieve code/title reliably
    for ent in entities[:limit]:
        ent_id = ent.get("id") or ent.get("stemId")
        raw_title = ent.get("title") or ""

        if not ent_id:
            continue

        # Fetch entity details
        ent_json = await _who_get_json(ent_id, token)
        code = _extract_code(ent_json)
        title = _extract_title(ent_json) or _strip_html(raw_title)

        # Fallback for code if API doesn't return it (rare)
        if not code:
            code = title[:12] if title else "ICD11"

        # Reason: we can use score/matchingPVs evidence if present
        reason = "Coincidencia encontrada en ICD-11 (OMS)."
        # If there is a score in matchingPVs, mention it
        m = ent.get("matchingPVs")
        if isinstance(m, list) and len(m) > 0:
            # Take best score if available
            scores = [pv.get("score") for pv in m if isinstance(pv, dict) and isinstance(pv.get("score"), (int, float))]
            if scores:
                reason = f"Coincidencia ICD-11 (OMS). Score aprox: {max(scores):.2f}"

        suggestions.append(
            {
                "code": code,
                "description": title or _strip_html(raw_title) or "Sin descripción",
                "relevance_reason": reason,
            }
        )

    return suggestions


@router.post("/suggest-cie10", response_model=DiagnosisResponse)
async def suggest_cie10(request: DiagnosisRequest):
    """
    Backwards-compatible route name.
    Internally uses WHO ICD-11 official API search.
    """
    logger.info(f"[DIAGNOSIS AUDIT] Request received. Text length: {len(request.text) if request and request.text else 0}")

    if not request.text or len(request.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Text too short for diagnosis")

    try:
        suggestions = await get_icd11_suggestions(request.text, limit=5)
        logger.info(f"[DIAGNOSIS AUDIT] ICD-11 returned {len(suggestions)} suggestions")
        return {"suggestions": suggestions}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DIAGNOSIS AUDIT] Unexpected error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Diagnosis service error: {type(e).__name__}")
