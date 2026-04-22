"""Translator API routes."""

import random

from fastapi import APIRouter, Depends

from app.models.user import User
from app.schemas.translator import TranslateRequest, TranslateResponse
from app.utils.auth import get_current_active_user

SUPPORTED_LANGUAGES = ["en"]
DUMMY_TRANSLATIONS: dict[str, list[str]] = {
    "en": [
        "Hello, how are you?",
        "Welcome to the translator",
        "This is a test message",
    ],
}

router = APIRouter()


@router.post("/translate", response_model=TranslateResponse)
async def translate_video(
    request: TranslateRequest,
    _current_user: User = Depends(get_current_active_user),
) -> TranslateResponse:
    """Return placeholder translation output for demo flows.

    Args:
        request (TranslateRequest): Translation request payload.
        _current_user (User): Current authenticated user.

    Returns:
        TranslateResponse: Simulated translated output.
    """

    translated_text = random.choice(
        DUMMY_TRANSLATIONS.get(request.target_language, DUMMY_TRANSLATIONS["en"])
    )
    
    return TranslateResponse(
        text=translated_text,
        audio_url="https://example.com/audio/placeholder.mp3",
        confidence=0.95,
        source_language=request.source_language,
        target_language=request.target_language,
    )


@router.get("/translate/status")
async def translation_status(
    current_user: User = Depends(get_current_active_user),
) -> dict[str, str | list[str]]:
    """Return service status for translation endpoint.

    Args:
        current_user (User): Current authenticated user.

    Returns:
        dict[str, str | list[str]]: Status details and supported languages.
    """

    return {
        "status": "operational",
        "message": "Translation service is running (placeholder mode)",
        "supported_languages": SUPPORTED_LANGUAGES,
        "user": current_user.username,
    }
