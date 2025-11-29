from pydantic import BaseModel
from typing import Optional, List


class TranslateRequest(BaseModel):
    """Request schema for translation endpoint"""
    video_data: Optional[str] = None  # Base64 encoded video frame or video URL
    source_language: str = "en"
    target_language: str = "es"


class TranslateResponse(BaseModel):
    """Response schema for translation endpoint"""
    text: str
    audio_url: Optional[str] = None
    confidence: float = 0.0
    source_language: str
    target_language: str


class AudioVisualizationData(BaseModel):
    """Audio visualization data for frontend"""
    frequencies: List[float] = []
    amplitude: float = 0.0
