import asyncio
import json
import os
from typing import Dict, List

import openai
import requests


def normalize_top5_group(group):
    out = []
    if not group:
        return out

    if isinstance(group, dict):
        if "label" in group and ("prob" in group or "score" in group or "confidence" in group):
            prob = group.get("prob", group.get("score", group.get("confidence", 0.0)))
            try:
                prob = float(prob)
            except Exception:
                prob = 0.0
            out.append((str(group.get("label")), prob))
            return out

        for key, value in group.items():
            try:
                parsed_prob = float(value)
            except Exception:
                parsed_prob = 0.0
            out.append((str(key), parsed_prob))
        return out

    if isinstance(group, (list, tuple)):
        if len(group) > 0 and any(isinstance(x, (dict, list, tuple)) for x in group):
            for item in group:
                if isinstance(item, dict):
                    label = item.get("label") or item.get("word") or item.get("text") or item.get("content")
                    prob = item.get("prob", item.get("score", item.get("confidence", 0.0)))
                    try:
                        prob = float(prob)
                    except Exception:
                        prob = 0.0
                    out.append((str(label), prob))
                elif isinstance(item, (list, tuple)) and len(item) >= 2:
                    try:
                        prob = float(item[1])
                    except Exception:
                        prob = 0.0
                    out.append((str(item[0]), prob))
                else:
                    out.append((str(item), 0.0))
            return out

        for item in group:
            out.append((str(item), 0.0))
        return out

    out.append((str(group), 0.0))
    return out


def build_candidates_text(labels: List[str], top5_history: List[List[Dict[str, float]]]) -> str:
    th = top5_history or []
    last_labels = labels[-32:]

    if not th:
        return "\n".join([f"{i + 1}. {lbl}" for i, lbl in enumerate(last_labels)])

    th_slice = th[-32:]
    lines = []
    for i, grp in enumerate(th_slice):
        grp_norm = normalize_top5_group(grp)
        if not grp_norm:
            fallback_label = last_labels[i] if i < len(last_labels) else ""
            lines.append(f"{i + 1}. {fallback_label}")
            continue

        cand_str = ", ".join([f"{lbl} ({p:.2f})" for lbl, p in grp_norm])
        lines.append(f"{i + 1}. {cand_str}")

    return "\n".join(lines)


def call_openai_chat_sync(messages: List[Dict[str, str]], model_name: str):
    return openai.ChatCompletion.create(
        model=model_name,
        messages=messages,
        max_tokens=128,
        temperature=0.2,
    )


def parse_openai_response(response) -> str:
    try:
        return response["choices"][0]["message"]["content"].strip()
    except Exception:
        return ""


async def call_openai_chat(messages: List[Dict[str, str]], model_name: str = "gpt-3.5-turbo") -> str:
    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OpenAI is not configured on the model service.")

    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(None, call_openai_chat_sync, messages, model_name)
    return parse_openai_response(response)

def call_local_chat_sync(messages: List[Dict[str, str]], local_url: str, model_name: str) -> str:
    payload = {"model": model_name, "messages": messages}
    response = requests.post(local_url, json=payload, timeout=30)
    response.raise_for_status()

    try:
        data = response.json()
    except Exception:
        return response.text

    if isinstance(data, dict):
        choices = data.get("choices")
        if choices and isinstance(choices, list):
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    content = message.get("content")
                    if content:
                        return content.strip()
                text = first.get("text")
                if isinstance(text, str):
                    return text.strip()
                content = first.get("content")
                if isinstance(content, str):
                    return content.strip()

        output = data.get("output")
        if isinstance(output, dict):
            out_text = output.get("text") or output.get("content")
            if out_text:
                return out_text.strip()

    return json.dumps(data)

async def call_local_chat(
    messages: List[Dict[str, str]],
    local_url: str = "http://127.0.0.1:1234/v1/chat/completions",
    model_name: str = "local-model",
) -> str:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, call_local_chat_sync, messages, local_url, model_name)

def select_backend(requested_backend: str) -> str:
    selected = (requested_backend or "auto").lower()
    if selected != "auto":
        return selected
    return "openai" if os.environ.get("OPENAI_API_KEY") else "local"

def build_chat_messages(labels: List[str], candidates_text: str) -> List[Dict[str, str]]:
    recent_labels = labels[-32:]
    system = {
        "role": "system",
        "content": "You are a concise assistant that turns short sign-language label sequences into fluent English sentences.",
    }
    user = {
        "role": "user",
        "content": (
            "Given the following sequence of frame-wise candidate words (top-5) with confidence scores, produce a single natural English sentence. "
            "Use the whole sequence for context. Prefer higher-confidence items but DO NOT blindly pick the top-scoring word if a lower-ranked candidate makes the sentence more natural or coherent. "
            "You may replace a top prediction with a lower-ranked candidate when it improves meaning. Keep the sentence short and only output the sentence text.\n\n"
            f"Candidates (most recent up to 32 steps):\n{candidates_text}\n\n"
            f"If helpful, here are the raw top predictions (in order): {', '.join(recent_labels)}\n"
        ),
    }
    return [system, user]

async def generate_sentence_from_sequence(
    labels: List[str],
    top5_history: List[List[Dict[str, float]]],
    backend: str = "auto",
    local_url: str | None = None,
    local_model_name: str | None = None,
    openai_model_name: str = "gpt-3.5-turbo",
) -> str:
    candidates_text = build_candidates_text(labels, top5_history)
    messages = build_chat_messages(labels, candidates_text)
    selected = select_backend(backend)

    if selected == "openai":
        if not os.environ.get("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI is not configured on the model service.")
        return await call_openai_chat(messages, model_name=openai_model_name)

    resolved_local_url = local_url or os.environ.get("LOCAL_LLM_URL") or "http://127.0.0.1:1234/v1/chat/completions"
    resolved_local_model_name = local_model_name or "local-model"
    return await call_local_chat(messages, local_url=resolved_local_url, model_name=resolved_local_model_name)
