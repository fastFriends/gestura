from typing import Any, Dict, List

import httpx
import json
import websockets


def get_model_service_url(model_service_url: str | None) -> str:
    return (model_service_url or "").strip()


def build_model_ws_url(model_url: str, path: str) -> str:
    base = model_url.rstrip("/")
    if base.startswith("https://"):
        ws_base = "wss://" + base[len("https://"):]
    elif base.startswith("http://"):
        ws_base = "ws://" + base[len("http://"):]
    else:
        ws_base = base
    return f"{ws_base}{path}"


def normalize_top5(top5_raw: Any) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    if not isinstance(top5_raw, list):
        return normalized

    for item in top5_raw:
        label = None
        prob = None

        if isinstance(item, dict):
            label = item.get("label") or item.get("word")
            prob = item.get("prob", item.get("score", item.get("confidence")))
        elif isinstance(item, (list, tuple)) and len(item) >= 2:
            label = item[0]
            prob = item[1]

        if label is None:
            continue

        try:
            prob_value = float(prob) if prob is not None else 0.0
        except (TypeError, ValueError):
            prob_value = 0.0

        normalized.append({"label": str(label), "prob": prob_value})

    return normalized


async def fetch_model_status(model_url: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(f"{model_url.rstrip('/')}/api/health")
        response.raise_for_status()
        return response.json()


async def proxy_single_frame_to_model(model_ws_url: str, frame_b64: str) -> Dict[str, Any]:
    async with websockets.connect(model_ws_url) as ws:
        await ws.send(json.dumps({"image": frame_b64}))
        resp_text = await ws.recv()
        try:
            return json.loads(resp_text)
        except Exception:
            return {"raw": resp_text}


async def reset_model_buffer(model_url: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.post(f"{model_url.rstrip('/')}/api/reset")
        response.raise_for_status()
        return response.json()


async def fetch_supported_labels(model_url: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(f"{model_url.rstrip('/')}/api/glossary")
        response.raise_for_status()
        return response.json()


async def generate_sentence(model_url: str, labels: List[Any], top5: List[Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{model_url.rstrip('/')}/llm/generate",
            json={"labels": labels, "top5": top5},
        )
        response.raise_for_status()
        return response.json()
