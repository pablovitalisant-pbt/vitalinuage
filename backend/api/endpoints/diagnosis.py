from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
import google.generativeai as genai
import logging
import asyncio
from typing import List, Optional

# Setup Logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/diagnosis",
    tags=["Diagnosis AI"]
)

# Output Schema
class CIE10Suggestion(BaseModel):
    code: str
    description: str
    relevance_reason: str

class DiagnosisResponse(BaseModel):
    suggestions: List[CIE10Suggestion]

class DiagnosisRequest(BaseModel):
    text: str

# Service Logic with Retry
async def get_gemini_diagnosis(text: str) -> List[dict]:
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        logger.error("GOOGLE_API_KEY not found in environment")
        raise HTTPException(status_code=500, detail="AI Service Misconfigured")
    
    genai.configure(api_key=api_key)
    
    # Model Configuration
    target_model = "gemini-2.0-flash-exp"
    
    generation_config = {
        "temperature": 0.2,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 1024,
        "response_mime_type": "application/json",
    }
    
    model = genai.GenerativeModel(
        model_name=target_model,
        generation_config=generation_config,
        system_instruction="""
        Eres un asistente médico experto en codificación CIE-10 (Clasificación Internacional de Enfermedades).
        Tu tarea es analizar el texto clínico proporcionado y sugerir los 3 códigos CIE-10 más probables.
        
        Debes retornar ÚNICAMENTE un JSON con la siguiente estructura:
        [
            {
                "code": "A00.0",
                "description": "Cólera debido a Vibrio cholerae 01, biotipo cholerae",
                "relevance_reason": "Breve explicación de por qué este código coincide con el texto."
            }
        ]
        
        Si el texto es ambiguo, sugiere los códigos más generales apropiados.
        Si no hay información médica suficiente, retorna una lista vacía.
        """
    )
    
    retries = 3
    delay = 1
    
    for attempt in range(retries):
        try:
            logger.info(f"Invoking Gemini ({target_model}) - Attempt {attempt+1}")
            response = await model.generate_content_async(text)
            
            # Robust JSON parsing
            import json
            raw_text = response.text if hasattr(response, 'text') else str(response)

            logger.info(f"[DIAGNOSIS RAW] {raw_text[:800]}")

            try:
                suggestions = json.loads(raw_text)

                # Ensure it's a list
                if isinstance(suggestions, dict):
                    suggestions = suggestions.get('suggestions', [])
                elif not isinstance(suggestions, list):
                    suggestions = []

                return suggestions
            except json.JSONDecodeError as je:
                logger.error(f"JSON parsing error: {je}. Raw response: {raw_text[:800]}")
                return []
            
        except Exception as e:
            logger.warning(f"Gemini API Error (Attempt {attempt+1}): {e}")
            if "429" in str(e) or "ResourceExhausted" in str(e):
                await asyncio.sleep(delay * (2 ** attempt)) # Exponential Backoff
                continue
            elif attempt == retries - 1:
                # Last attempt failed
                logger.error("All Gemini retries failed.")
                raise HTTPException(status_code=503, detail="AI Service Unavailable currently")
            else:
                await asyncio.sleep(delay)
                
    return []

@router.post("/suggest-cie10", response_model=DiagnosisResponse)
async def suggest_cie10(request: DiagnosisRequest):
    """
    Suggest CIE-10 codes based on clinical text using Gemini AI.
    """
    try:
        logger.info(f"[DIAGNOSIS AUDIT] Request received. Text length: {len(request.text)}")
        
        if not request.text or len(request.text.strip()) < 3:
            logger.warning("[DIAGNOSIS AUDIT] Text too short")
            raise HTTPException(status_code=400, detail="Text too short for diagnosis")
        
        # Check API Key
        api_key = os.getenv("GOOGLE_API_KEY", "")
        if not api_key:
            logger.error("[DIAGNOSIS AUDIT] GOOGLE_API_KEY not configured in environment")
            raise HTTPException(
                status_code=503, 
                detail="Diagnosis service not configured. Please contact support."
            )
        
        logger.info("[DIAGNOSIS AUDIT] Calling Gemini API...")
        suggestions = await get_gemini_diagnosis(request.text)
        logger.info(f"[DIAGNOSIS AUDIT] Gemini returned {len(suggestions)} suggestions")
        
        return {"suggestions": suggestions}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"[DIAGNOSIS AUDIT] Unexpected error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Diagnosis service error: {type(e).__name__}"
        )
