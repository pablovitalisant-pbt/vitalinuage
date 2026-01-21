from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import logging
import time
import re
import html
from typing import List, Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/diagnosis",
    tags=["Diagnosis AI"]
)

# =====================
# Schemas (frontend-safe)
# =====================

class CIE10Suggestion(BaseModel):
    code: str
    description: str
    relevance_reason: str

class DiagnosisResponse(BaseModel):
    suggestions: List[CIE10Suggestion]

class DiagnosisRequest(BaseModel):
    text: str


# =====================
# WHO ICD-11 config
# =====================

WHO_TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token"
WHO_RELEASE = os.getenv("ICD_RELEASE", "2024-01")
WHO_SEARCH_URL = f"https://id.who.int/icd/release/11/{WHO_RELEASE}/mms/search"

_WHO_TOKEN: Optional[str] = None
_WHO_TOKEN_EXP: float = 0.0


# =====================
# Helpers
# =====================

def _fix_mojibake(s: str) -> str:
    """
    Fix common UTF-8-as-Latin1 mojibake (e.g., 'especificaciÃ³n' -> 'especificación').
    Only attempts repair when it detects typical markers to avoid corrupting valid text.
    """
    if not s:
        return s
    # heuristic markers
    if "Ã" not in s and "Â" not in s:
        return s
    try:
        return s.encode("latin1").decode("utf-8")
    except Exception:
        return s


def _strip_html(s: str) -> str:
    if not s:
        return s
    s = html.unescape(s)
    s = re.sub(r"<[^>]+>", "", s)
    s = _fix_mojibake(s)
    return s.strip()


async def _get_who_token() -> str:
    global _WHO_TOKEN, _WHO_TOKEN_EXP

    now = time.time()
    if _WHO_TOKEN and now < (_WHO_TOKEN_EXP - 30):
        return _WHO_TOKEN

    client_id = os.getenv("ICD_CLIENT_ID")
    client_secret = os.getenv("ICD_CLIENT_SECRET")

    if not client_id or not client_secret:
        logger.error("[DIAGNOSIS] ICD credentials missing")
        raise HTTPException(503, "ICD service not configured")

    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "icdapi_access",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                WHO_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

        if r.status_code != 200:
            logger.error(f"[DIAGNOSIS] WHO token error {r.status_code}: {r.text[:200]}")
            raise HTTPException(503, "ICD token service unavailable")

        payload = r.json()
        token = payload.get("access_token")
        expires = payload.get("expires_in", 900)

        if not token:
            raise HTTPException(503, "ICD token invalid response")

        _WHO_TOKEN = token
        _WHO_TOKEN_EXP = now + int(expires)
        return token

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DIAGNOSIS] WHO token exception: {e}")
        raise HTTPException(503, "ICD token service unavailable")


async def _who_get_json(url: str, token: str) -> Dict[str, Any]:
    if url.startswith("http://"):
        url = "https://" + url[len("http://"):]

    headers = {
        "Authorization": f"Bearer {token}",
        "API-Version": "v2",
        "Accept": "application/json",
        "Accept-Language": "es",
    }

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        r = await client.get(url, headers=headers)

    if r.status_code != 200:
        logger.warning(f"[DIAGNOSIS] WHO GET {r.status_code} {url}")
        raise HTTPException(503, "ICD service unavailable")

    # DEBUG: Log response encoding
    logger.info(f"[DEBUG] WHO response encoding: {r.encoding}")
    logger.info(f"[DEBUG] WHO Content-Type: {r.headers.get('Content-Type')}")
    
    # Force UTF-8 if not already set
    if r.encoding != 'utf-8':
        logger.warning(f"[DEBUG] Forcing UTF-8, was: {r.encoding}")
        r.encoding = 'utf-8'
    
    json_data = r.json()
    
    # DEBUG: Sample first entity title
    if isinstance(json_data, dict):
        entities = json_data.get("destinationEntities", [])
        if entities and len(entities) > 0:
            sample_title = entities[0].get("title", "")
            logger.info(f"[DEBUG] Sample raw title from JSON: {repr(sample_title)}")
    
    return json_data


def _extract_code(j: Dict[str, Any]) -> str:
    for k in ("code", "theCode", "icdCode"):
        v = j.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def _extract_title(j: Dict[str, Any]) -> str:
    t = j.get("title")
    logger.info(f"[DEBUG] _extract_title input: {repr(t)}")
    if isinstance(t, str):
        result = _strip_html(t)
        logger.info(f"[DEBUG] _extract_title after _strip_html: {repr(result)}")
        return result
    if isinstance(t, dict):
        raw = t.get("@value") or t.get("value") or ""
        result = _strip_html(raw)
        logger.info(f"[DEBUG] _extract_title dict after _strip_html: {repr(result)}")
        return result
    return ""




# =====================
# Core logic
# =====================

async def get_icd11_suggestions(text: str, limit: int = 5) -> List[Dict[str, str]]:
    token = await _get_who_token()

    q = text.strip()
    search_url = (
        f"{WHO_SEARCH_URL}"
        f"?q={httpx.QueryParams({'q': q})['q']}"
        f"&useFlexisearch=true&flatResults=true&limit={limit}"
    )

    search_json = await _who_get_json(search_url, token)
    entities = search_json.get("destinationEntities", []) or []

    results: List[Dict[str, str]] = []

    for ent in entities[:limit]:
        raw_title = _strip_html(ent.get("title") or "")
        logger.info(f"[DEBUG] After first _strip_html: {repr(raw_title)}")
        raw_title = _fix_mojibake(raw_title)
        logger.info(f"[DEBUG] After first _fix_mojibake: {repr(raw_title)}")
        code = _extract_code(ent) or "ICD11"
        title = _extract_title(ent) or raw_title or "Sin descripción"
        logger.info(f"[DEBUG] After _extract_title: {repr(title)}")
        title = _fix_mojibake(title)
        logger.info(f"[DEBUG] Final title after second _fix_mojibake: {repr(title)}")
        
        # Check for mojibake markers
        if "Ã" in title or "Â" in title:
            logger.error(f"[DEBUG] MOJIBAKE DETECTED IN FINAL TITLE: {repr(title)}")

        results.append({
            "code": code,
            "description": title,
            "relevance_reason": "Coincidencia ICD-11 oficial (OMS)."
        })

    return results


# =====================
# Endpoint
# =====================

@router.post("/suggest-cie10", response_model=DiagnosisResponse)
async def suggest_cie10(request: DiagnosisRequest):
    if not request.text or len(request.text.strip()) < 3:
        raise HTTPException(400, "Text too short")

    suggestions = await get_icd11_suggestions(request.text, limit=5)
    return {"suggestions": suggestions}
