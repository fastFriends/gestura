from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from .model import load_model_and_checkpoint, predict_video_with_smoothing, idx2label, LABELS
from .pipeline import AsyncRealtimePipeline
from .config import MODEL_TYPE
from .services.llm_service import generate_sentence_from_sequence
from typing import Dict, Any, List
from functools import partial
import tempfile
import shutil
from pathlib import Path
import json
import os


app = FastAPI()

static_dir = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

def get_model():
    return load_model_and_checkpoint(MODEL_TYPE)

model = get_model()


async def websocket_send_callback(websocket: WebSocket, msg: dict):
    await websocket.send_text(json.dumps(msg))

@app.post("/predict")
def predict(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    pred_label, n_frames, _, top5 = predict_video_with_smoothing(model, tmp_path)
    return {"prediction": pred_label, "frames": n_frames, "top5": top5}

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    pipeline = None
    try:
        pipeline = AsyncRealtimePipeline(
            model=model,
            idx2label=idx2label,
            send_callback=partial(websocket_send_callback, websocket),
        )
        await pipeline.start()

        while True:
            data_text = await websocket.receive_text()
            try:
                payload = json.loads(data_text)
            except Exception:
                await websocket.send_text(json.dumps({"error": "invalid json"}))
                continue

            img_b64 = payload.get("image")
            if not img_b64:
                await websocket.send_text(json.dumps({"error": "no image"}))
                continue

            try:
                await pipeline.submit_raw_image(img_b64)
            except Exception as e:
                await websocket.send_text(json.dumps({"error": f"submit failed: {e}"}))
                continue

    except WebSocketDisconnect:
        # stop pipeline when client disconnects
        if pipeline is not None:
            try:
                await pipeline.stop()
            except Exception:
                pass

@app.post("/llm/generate")
async def llm_generate(body: Dict[str, Any]):
    """Generate a sentence from provided `labels` and optional `top5` history.

    Body example: {"labels": ["hello","how","are"], "top5": [[{"label":"hello","prob":0.8}], ...]}
    """
    labels = body.get("labels") or []
    top5 = body.get("top5") or []
    if not labels:
        raise HTTPException(status_code=400, detail="labels required")

    backend = body.get("backend", "auto")
    if isinstance(backend, bool):
        backend = "local" if backend else "openai"

    local_url = body.get("local_url") or os.environ.get("LOCAL_LLM_URL")
    local_model_name = body.get("local_model") or body.get("local_model_name")
    openai_model_name = body.get("openai_model") or "gpt-3.5-turbo"

    try:
        sentence = await generate_sentence_from_sequence(
            labels,
            top5,
            backend=backend,
            local_url=local_url,
            local_model_name=local_model_name,
            openai_model_name=openai_model_name,
        )
        return {"sentence": sentence, "backend": backend}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "ok", "model_type": MODEL_TYPE}

@app.get("/api/glossary")
def api_glossary():
    return {"glossary": LABELS, "count": len(LABELS)}

@app.post("/api/reset")
def api_reset():
    return {"status": "ok", "message": "reset performed"}
