from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.translator import TranslateRequest, TranslateResponse, AudioVisualizationData
from app.utils.auth import get_current_active_user
from app.models.user import User
from app.config import settings
import random
import httpx
from typing import Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/translate", response_model=TranslateResponse)
async def translate_video(
    request: TranslateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Placeholder endpoint for video translation.
    
    In the future, this will:
    1. Accept video frames or video data
    2. Process the video using ML model
    3. Translate speech to target language
    4. Generate audio in target language
    5. Return translated text and audio URL
    """
    
    # Placeholder response - simulate translation
    dummy_translations = {
        "en": ["Hello, how are you?", "Welcome to the translator", "This is a test message"],
        "es": ["Hola, ¿cómo estás?", "Bienvenido al traductor", "Este es un mensaje de prueba"],
        "fr": ["Bonjour, comment allez-vous?", "Bienvenue au traducteur", "Ceci est un message de test"],
    }
    
    translated_text = random.choice(dummy_translations.get(request.target_language, dummy_translations["en"]))
    
    return TranslateResponse(
        text=translated_text,
        audio_url="https://example.com/audio/placeholder.mp3",  # Placeholder URL
        confidence=0.95,
        source_language=request.source_language,
        target_language=request.target_language
    )


@router.get("/translate/status")
async def translation_status(current_user: User = Depends(get_current_active_user)):
    """Check translation service status"""
    colab_status = "not_configured"
    colab_message = "Colab inference URL not set"
    
    # Check if Colab inference is available
    if settings.COLAB_INFERENCE_URL:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{settings.COLAB_INFERENCE_URL}/api/health")
                if response.status_code == 200:
                    colab_status = "connected"
                    colab_data = response.json()
                    colab_message = f"Model: {colab_data.get('model_type', 'unknown')}"
                else:
                    colab_status = "error"
                    colab_message = f"HTTP {response.status_code}"
        except Exception as e:
            colab_status = "unreachable"
            colab_message = str(e)
    
    return {
        "status": "operational",
        "message": "Translation service is running",
        "supported_languages": ["ASL", "BSL", "ISL", "JSL"],
        "user": current_user.username,
        "colab_inference": {
            "status": colab_status,
            "message": colab_message,
            "url": settings.COLAB_INFERENCE_URL if settings.COLAB_INFERENCE_URL else None
        }
    }


@router.post("/translate/frame")
async def translate_frame(
    frame_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """
    Process a single video frame for real-time ASL translation.
    
    Receives a base64-encoded video frame from the frontend,
    forwards it to the Colab inference API, and returns the prediction.
    """
    if not settings.COLAB_INFERENCE_URL:
        raise HTTPException(
            status_code=503,
            detail="Colab inference service not configured. Please set COLAB_INFERENCE_URL in .env"
        )
    
    try:
        # Forward frame to Colab inference API
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.COLAB_INFERENCE_URL}/api/predict-frame",
                json={"frame": frame_data.get("frame")}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Colab API error: {response.text}"
                )
            
            result = response.json()
            
            # Add user context
            result["user_id"] = current_user.id
            result["username"] = current_user.username
            
            return result
    
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Colab inference service timeout. Please check if the notebook is running."
        )
    except httpx.RequestError as e:
        logger.error(f"Request error to Colab API: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Colab inference service: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in translate_frame: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/translate/reset")
async def reset_translation(current_user: User = Depends(get_current_active_user)):
    """
    Reset the translation buffer in Colab inference service.
    Call this when starting a new translation session.
    """
    if not settings.COLAB_INFERENCE_URL:
        return {"status": "ok", "message": "No Colab service configured"}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(f"{settings.COLAB_INFERENCE_URL}/api/reset")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Colab API error: {response.text}"
                )
            
            return response.json()
    
    except Exception as e:
        logger.error(f"Error resetting Colab buffer: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset translation buffer: {str(e)}"
        )


@router.get("/translate/labels")
async def get_supported_labels(current_user: User = Depends(get_current_active_user)):
    """
    Get list of all supported ASL signs from Colab inference service.
    """
    if not settings.COLAB_INFERENCE_URL:
        return {"labels": [], "count": 0, "message": "Colab service not configured"}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.COLAB_INFERENCE_URL}/api/labels")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Colab API error: {response.text}"
                )
            
            return response.json()
    
    except Exception as e:
        logger.error(f"Error fetching labels: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch supported labels: {str(e)}"
        )
