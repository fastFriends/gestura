from datetime import datetime
from typing import Any, Dict, List, Tuple

from bson import ObjectId

from app.database import get_translation_history_collection
from app.services.model_proxy import normalize_top5

_CAPTURE_WINDOW_SIZE = 30
_MAX_CAPTURE_HISTORY = 200
_prediction_captures: Dict[str, List[Dict[str, Any]]] = {}


def _stringify_id(value: Any) -> str:
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


async def clear_prediction_capture(user_id: Any) -> None:
    _prediction_captures.pop(_stringify_id(user_id), None)


async def store_prediction_capture(user_id: Any, result: Dict[str, Any]) -> None:
    label = result.get("label") or result.get("prediction")
    top5 = normalize_top5(result.get("top5"))

    if not label and not top5:
        return

    capture = {
        "label": str(label) if label is not None else "",
        "top5": top5,
        "frame_idx": result.get("frame_idx"),
        "prob": result.get("prob"),
    }

    user_key = _stringify_id(user_id)
    history = _prediction_captures.setdefault(user_key, [])
    history.append(capture)
    if len(history) > _MAX_CAPTURE_HISTORY:
        _prediction_captures[user_key] = history[-_MAX_CAPTURE_HISTORY:]


async def get_generation_payload_from_window(
    user_id: Any,
    requested_labels: List[Any],
    requested_top5: List[Any],
) -> Tuple[List[Any], List[Any], int]:
    labels = list(requested_labels or [])
    top5 = list(requested_top5 or [])

    history = list(_prediction_captures.get(_stringify_id(user_id), []))
    window = history[-_CAPTURE_WINDOW_SIZE:]

    if not labels:
        raw_labels = [entry.get("label") for entry in window if entry.get("label")]
        labels = []
        for label in raw_labels:
            if not labels or labels[-1] != label:
                labels.append(label)

    if not top5:
        top5 = [entry.get("top5") for entry in window if entry.get("top5")]

    return labels, top5, len(window)


async def save_sentence_entry(
    user_id: Any,
    username: str,
    predicted_word: str,
    sentence: str,
    confidence: float | None,
    top_words: List[Dict[str, Any]],
) -> Dict[str, Any]:
    history_collection = get_translation_history_collection()
    now = datetime.utcnow()
    entry = {
        "user_id": _stringify_id(user_id),
        "username": username,
        "predicted_word": predicted_word,
        "sentence": sentence,
        "confidence": confidence,
        "top_words": top_words,
        "created_at": now,
    }

    insert_result = await history_collection.insert_one(entry)

    return {
        "id": str(insert_result.inserted_id),
        "predicted_word": predicted_word,
        "sentence": sentence,
        "confidence": confidence,
        "top_words": top_words,
        "created_at": now.isoformat(),
    }


async def get_sentence_history(user_id: Any, limit: int = 50) -> List[Dict[str, Any]]:
    history_collection = get_translation_history_collection()
    cursor = (
        history_collection.find({"user_id": _stringify_id(user_id)})
        .sort("created_at", -1)
        .limit(limit)
    )

    items: List[Dict[str, Any]] = []
    async for doc in cursor:
        items.append(
            {
                "id": str(doc.get("_id")),
                "predicted_word": doc.get("predicted_word", ""),
                "sentence": doc.get("sentence", ""),
                "confidence": doc.get("confidence"),
                "top_words": doc.get("top_words", []),
                "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
            }
        )

    return items


async def get_top_words(user_id: Any, limit: int = 5) -> List[Dict[str, Any]]:
    history_collection = get_translation_history_collection()
    pipeline = [
        {"$match": {"user_id": _stringify_id(user_id)}},
        {"$group": {"_id": "$predicted_word", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]

    top_words: List[Dict[str, Any]] = []
    async for item in history_collection.aggregate(pipeline):
        label = item.get("_id")
        if label:
            top_words.append({"label": str(label), "count": int(item.get("count", 0))})

    return top_words
