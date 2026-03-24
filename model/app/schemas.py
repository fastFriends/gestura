from pydantic import BaseModel

class PredictionResponse(BaseModel):
    prediction: str
    frames: int

class VideoUpload(BaseModel):
    file: bytes
