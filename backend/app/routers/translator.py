import asyncio
import io
import json
import logging
from typing import Any, Dict

import websockets
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.config import settings
from app.database import get_users_collection
from app.models.user import User
from app.services.model_proxy import (
    build_model_ws_url,
    fetch_model_status,
    fetch_supported_labels,
    generate_sentence,
    get_model_service_url,
    normalize_top5,
    reset_model_buffer,
)
from app.services.translation_history import (
    clear_prediction_capture,
    get_generation_payload_from_window,
    get_sentence_history,
    get_top_words,
    save_sentence_entry,
    store_prediction_capture,
)
from app.utils.auth import decode_access_token, get_current_active_user

router = APIRouter()
logger = logging.getLogger(__name__)

try:
    from app.services.tts import text_to_wav_bytes
except Exception:
    text_to_wav_bytes = None


def _build_fallback_sentence(labels: list[Any]) -> str:
    cleaned = [str(item).strip() for item in labels if str(item).strip()]
    if not cleaned:
        return ""

    deduped: list[str] = []
    for word in cleaned:
        if not deduped or deduped[-1].lower() != word.lower():
            deduped.append(word)

    text = " ".join(deduped).strip()
    if not text:
        return ""

    text = text[0].upper() + text[1:] if len(text) > 1 else text.upper()
    if text[-1] not in ".!?":
        text = f"{text}."
    return text


async def _resolve_ws_user(websocket: WebSocket) -> User | None:
    token = websocket.query_params.get("token") or websocket.query_params.get("access_token")

    if not token:
        auth_header = websocket.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None

    token_data = decode_access_token(token)
    users_collection = get_users_collection()
    user_data = await users_collection.find_one({"email": token_data.email})
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")

    user = User(**user_data)
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


@router.get("/translate/status")
async def translation_status(current_user: User = Depends(get_current_active_user)):
    model_status = "not_configured"
    model_message = "Model service URL not set"
    model_url = get_model_service_url(settings.MODEL_SERVICE_URL)

    if model_url:
        try:
            model_data = await fetch_model_status(model_url)
            model_status = "connected"
            model_message = f"Model: {model_data.get('model_type', 'unknown')}"
        except Exception as error:
            model_status = "unreachable"
            model_message = str(error)

    return {
        "status": "operational",
        "message": "Translation service is running",
        "supported_languages": ["ASL", "BSL", "ISL", "JSL"],
        "user": current_user.username,
        "model_service": {
            "status": model_status,
            "message": model_message,
            "url": model_url if model_url else None,
        },
    }


@router.post("/translate/reset")
async def reset_translation(current_user: User = Depends(get_current_active_user)):
    await clear_prediction_capture(current_user.id)

    model_url = get_model_service_url(settings.MODEL_SERVICE_URL)
    if not model_url:
        return {"status": "ok", "message": "No model service configured"}

    try:
        return await reset_model_buffer(model_url)
    except Exception as error:
        logger.error("Error resetting model buffer: %s", error)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset translation buffer: {str(error)}",
        )


@router.get("/translate/labels")
async def get_supported_labels(current_user: User = Depends(get_current_active_user)):
    model_url = get_model_service_url(settings.MODEL_SERVICE_URL)
    if not model_url:
        return {"labels": [], "count": 0, "message": "Model service not configured"}

    try:
        result = await fetch_supported_labels(model_url)
        labels = result.get("glossary", [])
        return {"labels": labels, "count": result.get("count", len(labels))}
    except Exception as error:
        logger.exception("Error fetching labels")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch supported labels: {type(error).__name__}: {error}",
        )


@router.websocket("/translate/predict")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()

    try:
        current_user = await _resolve_ws_user(websocket)
    except HTTPException as error:
        await websocket.send_json({"error": "invalid token", "detail": error.detail})
        await websocket.close(code=1008)
        return
    except Exception:
        logger.exception("Failed to resolve websocket user")
        await websocket.send_json({"error": "authentication failed"})
        await websocket.close(code=1011)
        return

    model_url = get_model_service_url(settings.MODEL_SERVICE_URL)
    if not model_url:
        await websocket.send_json({"error": "model service URL not configured (MODEL_SERVICE_URL)"})
        await websocket.close()
        return

    model_ws_url = build_model_ws_url(model_url, "/ws/predict")

    try:
        async with websockets.connect(
            model_ws_url,
            ping_interval=20,
            ping_timeout=20,
            close_timeout=5,
        ) as model_ws:

            async def client_to_model():
                try:
                    while True:
                        message = await websocket.receive_text()
                        await model_ws.send(message)
                except WebSocketDisconnect:
                    logger.info("Client disconnected")
                    await model_ws.close()
                except Exception:
                    logger.exception("client_to_model error")
                    await model_ws.close()

            async def model_to_client():
                try:
                    async for message in model_ws:
                        if isinstance(message, (bytes, bytearray)):
                            await websocket.send_bytes(message)
                        else:
                            if current_user is not None:
                                try:
                                    parsed = json.loads(message)
                                    if isinstance(parsed, dict):
                                        capture_payload = parsed
                                        if parsed.get("type") == "inference" and isinstance(parsed.get("result"), dict):
                                            inference = parsed.get("result") or {}
                                            capture_payload = {
                                                "label": inference.get("word") or inference.get("label") or inference.get("prediction"),
                                                "top5": inference.get("top5"),
                                                "frame_idx": inference.get("anchor_idx"),
                                                "prob": inference.get("confidence") or inference.get("prob"),
                                            }
                                        await store_prediction_capture(current_user.id, capture_payload)
                                except Exception:
                                    logger.debug("Non-JSON model message; skipping capture storage")
                            await websocket.send_text(message)
                except Exception:
                    logger.info("Model connection closed")
                    await websocket.close()

            await model_ws.send('{"type": "init"}')
            await asyncio.gather(client_to_model(), model_to_client())

    except websockets.exceptions.InvalidStatus as error:
        logger.exception("Handshake failed")
        await websocket.send_json({"error": "model handshake failed", "detail": str(error)})
        await websocket.close()
    except Exception as error:
        logger.exception("Proxy error")
        await websocket.send_json({"error": "proxy connection failed", "detail": str(error)})
        await websocket.close()


@router.post("/translate/generate")
async def generate_sentence_from_predictions(
    body: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
):
    labels, top5, captures_used = await get_generation_payload_from_window(
        current_user.id,
        body.get("labels") or [],
        body.get("top5") or [],
    )

    if not labels:
        raise HTTPException(
            status_code=400,
            detail="labels required (send labels/top5 or stream frames to websocket /translate/predict first)",
        )

    model_url = get_model_service_url(settings.MODEL_SERVICE_URL)
    if not model_url:
        raise HTTPException(status_code=503, detail="Model service not configured")

    try:
        generated = await generate_sentence(model_url, labels, top5)

        latest_top_words = normalize_top5(top5[-1] if top5 else [])
        history_entry = await save_sentence_entry(
            user_id=current_user.id,
            username=current_user.username,
            predicted_word=str(labels[-1]),
            sentence=generated.get("sentence", ""),
            confidence=None,
            top_words=latest_top_words,
        )

        generated["captures_used"] = captures_used
        generated["predicted_word"] = labels[-1]
        generated["history_entry"] = history_entry
        generated["generation_mode"] = "llm"
        return generated
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("LLM proxy failed, using fallback sentence")

        fallback_sentence = _build_fallback_sentence(labels)
        if not fallback_sentence:
            raise HTTPException(status_code=503, detail=str(error))

        latest_top_words = normalize_top5(top5[-1] if top5 else [])
        history_entry = await save_sentence_entry(
            user_id=current_user.id,
            username=current_user.username,
            predicted_word=str(labels[-1]),
            sentence=fallback_sentence,
            confidence=None,
            top_words=latest_top_words,
        )

        return {
            "sentence": fallback_sentence,
            "predicted_word": labels[-1],
            "captures_used": captures_used,
            "history_entry": history_entry,
            "generation_mode": "fallback",
            "fallback_reason": str(error),
        }


@router.get("/translate/history")
async def get_translation_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
):
    items = await get_sentence_history(current_user.id, limit=limit)
    top_words = await get_top_words(current_user.id, limit=5)
    return {"items": items, "top_words": top_words}


@router.post("/tts")
async def tts_endpoint(body: Dict[str, Any], current_user: User = Depends(get_current_active_user)):
    text = body.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if text_to_wav_bytes is None:
        raise HTTPException(status_code=500, detail="TTS service not available on server")

    loop = asyncio.get_running_loop()

    def _sync_tts():
        return text_to_wav_bytes(text)

    try:
        audio_bytes = await loop.run_in_executor(None, _sync_tts)
    except Exception as error:
        logger.exception("TTS generation failed")
        raise HTTPException(status_code=500, detail=str(error))

    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/wav")
