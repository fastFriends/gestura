"""Pydantic schemas for translator API payloads."""

from typing import Optional

from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    """Request schema for the translation endpoint.

    Attributes:
        video_data (Optional[str]): Base64 video frame or video URL.
        source_language (str): Source language code.
        target_language (str): Target language code.
    """

    video_data: Optional[str] = None
    source_language: str = "en"
    target_language: str = "es"


class TranslateResponse(BaseModel):
    """Response schema for translation endpoint.

    Attributes:
        text (str): Translated text content.
        audio_url (Optional[str]): Audio URL for translated speech.
        confidence (float): Confidence score between 0 and 1.
        source_language (str): Source language code.
        target_language (str): Target language code.
    """

    text: str
    audio_url: Optional[str] = None
    confidence: float = 0.0
    source_language: str
    target_language: str


class AudioVisualizationData(BaseModel):
    """Audio visualization values sent to frontend clients.

    Attributes:
        frequencies (list[float]): Frequency spectrum bins.
        amplitude (float): Current audio amplitude.
    """

    frequencies: list[float] = Field(default_factory=list)
    amplitude: float = 0.0
