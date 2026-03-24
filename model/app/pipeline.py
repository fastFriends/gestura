import asyncio
import time
import base64
from collections import deque
from typing import Deque, List, Tuple, Callable, Optional

import numpy as np
import cv2
import traceback

from .services.landmark_service import extract_landmarks_from_image
from .services.llm_service import generate_sentence_from_sequence


def decode_and_extract_landmark_vector(raw_frame_bytes: bytes):
    arr = np.frombuffer(raw_frame_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return extract_landmarks_from_image(img_rgb)


def run_model_prediction(model, seq):
    from .model import predict_sequence

    return predict_sequence(model, seq)


def build_top5_result(probs, idx2label):
    top_k = min(5, probs.shape[0])
    top_idxs = np.argpartition(probs, -top_k)[-top_k:]
    top_idxs = top_idxs[np.argsort(probs[top_idxs])[::-1]]
    top5 = [(idx2label[int(i)], float(probs[int(i)])) for i in top_idxs]
    best_idx = int(probs.argmax())
    best_label = idx2label[best_idx]
    best_conf = float(probs[best_idx])
    return best_label, best_conf, top5


def select_stable_candidate(pred_history):
    counts = {}
    conf_sums = {}
    for item in pred_history:
        word = item["word"]
        counts[word] = counts.get(word, 0) + 1
        conf_sums[word] = conf_sums.get(word, 0.0) + item["confidence"]
    candidate = max(counts.items(), key=lambda kv: (kv[1], conf_sums.get(kv[0], 0.0) / kv[1]))[0]
    votes = counts.get(candidate, 0)
    avg_conf = conf_sums.get(candidate, 0.0) / max(1, counts.get(candidate, 1))
    return candidate, votes, avg_conf

# Keep labels mapping lazy-imported to avoid circular import issues in some setups


class AsyncRealtimePipeline:
    """Asynchronous real-time prediction pipeline."""

    def __init__(self, model, idx2label: dict, send_callback: Callable[[dict], asyncio.Future], *,
                window_size: int = 16, step_size: int = 4, buffer_seconds: float = 4.0,
                fps_estimate: float = 15.0, smoothing_windows: int = 3, stable_votes: int = 2,
                sentence_pause_s: float = 1.8):
        self.model = model
        self.idx2label = idx2label
        self.send_callback = send_callback

        # queues
        self.raw_frame_q: asyncio.Queue[bytes] = asyncio.Queue(maxsize=256)
        self.inference_q: asyncio.Queue[dict] = asyncio.Queue(maxsize=64)

        # frame buffer holds tuples (ts, landmark_vec)
        self.buffer: Deque[Tuple[float, np.ndarray]] = deque()
        self.buffer_seconds = buffer_seconds
        self.fps_estimate = fps_estimate

        # windowing params
        self.window_size = window_size
        self.step_size = step_size
        self._next_emit_idx = None  # index in stream where next window should anchor
        self._global_frame_idx = 0

        # smoothing
        self.smoothing_windows = smoothing_windows
        self.stable_votes = stable_votes
        self.pred_history: Deque[dict] = deque(maxlen=smoothing_windows)

        # state machine
        self.state = "IDLE"

        # word stream
        self.word_stream: List[dict] = []
        self.last_stable_time: Optional[float] = None
        self.sentence_pause_s = sentence_pause_s

        # tasks
        self._tasks: List[asyncio.Task] = []
        self._running = False
        self._window_full_sent = False

        # lock for buffer operations
        self._lock = asyncio.Lock()

    async def start(self):
        if self._running:
            return
        self._running = True
        loop = asyncio.get_running_loop()
        print(f"[pipeline] starting: window_size={self.window_size} step_size={self.step_size} buffer_seconds={self.buffer_seconds} smoothing={self.smoothing_windows} stable_votes={self.stable_votes}")
        self._tasks.append(loop.create_task(self._frame_consumer()))
        self._tasks.append(loop.create_task(self._window_sampler()))
        self._tasks.append(loop.create_task(self._partial_inference()))
        self._tasks.append(loop.create_task(self._inference_consumer()))
        self._tasks.append(loop.create_task(self._smoother()))

    async def stop(self):
        self._running = False
        for t in list(self._tasks):
            t.cancel()
        self._tasks.clear()

    async def submit_raw_image(self, img_b64_or_bytes: bytes):
        """Accept base64 string or raw bytes for processing."""
        try:
            if isinstance(img_b64_or_bytes, str):
                s = img_b64_or_bytes
                if s.startswith('data:'):
                    s = s.split(',', 1)[1]
                b = base64.b64decode(s)
            else:
                b = img_b64_or_bytes
            try:
                self.raw_frame_q.put_nowait(b)
            except asyncio.QueueFull:
                return
        except Exception:
            return

    async def _frame_consumer(self):
        """Decode raw bytes, extract landmarks, and append to buffer."""
        loop = asyncio.get_running_loop()
        while self._running:
            try:
                raw = await self.raw_frame_q.get()
                vec = await loop.run_in_executor(None, decode_and_extract_landmark_vector, raw)
                if vec is None:
                    continue
                ts = time.time()
                async with self._lock:
                    self.buffer.append((ts, vec))
                    self._global_frame_idx += 1
                    cutoff = ts - self.buffer_seconds
                    while self.buffer and self.buffer[0][0] < cutoff:
                        self.buffer.popleft()
                    if len(self.buffer) < self.window_size:
                        self._window_full_sent = False
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(0.01)

    async def _window_sampler(self):
        """Create overlapping windows anchored to latest frames and put them on inference queue."""
        while self._running:
            await asyncio.sleep(0.02)
            async with self._lock:
                n = len(self.buffer)
                if n < self.window_size:
                    continue
                if n >= self.window_size and not self._window_full_sent:
                    try:
                        await self.send_callback({"type": "window_filled", "start_time": self.buffer[0][0], "end_time": self.buffer[min(len(self.buffer)-1, self.window_size-1)][0]})
                    except Exception:
                        pass
                    self._window_full_sent = True
                if self._next_emit_idx is None:
                    self._next_emit_idx = n - self.window_size
                if n - self.window_size - self._next_emit_idx >= self.step_size:
                    self._next_emit_idx += self.step_size
                while self._next_emit_idx is not None and self._next_emit_idx + self.window_size <= n:
                    start_idx = self._next_emit_idx
                    end_idx = start_idx + self.window_size
                    slice_items = list(self.buffer)[start_idx:end_idx]
                    start_time = slice_items[0][0]
                    end_time = slice_items[-1][0]
                    seq_np = np.stack([x[1] for x in slice_items], axis=0)
                    window = {
                        "seq": seq_np,
                        "start_time": start_time,
                        "end_time": end_time,
                        "anchor_idx": self._global_frame_idx - (n - start_idx)
                    }
                    try:
                        self.inference_q.put_nowait(window)
                    except asyncio.QueueFull:
                        pass
                    self._next_emit_idx += self.step_size

    async def _inference_consumer(self):
        """Consume windows and run model inference in executor. Push raw results to smoothing history and send inference-level messages."""
        loop = asyncio.get_running_loop()
        while self._running:
            try:
                window = await self.inference_q.get()
                seq = window["seq"]
                try:
                    probs = await loop.run_in_executor(None, run_model_prediction, self.model, seq)
                except Exception as e:
                    print('[pipeline] model inference failed:', e)
                    traceback.print_exc()
                    continue
                best_label, best_conf, top5 = build_top5_result(probs, self.idx2label)

                result = {
                    "word": best_label,
                    "confidence": best_conf,
                    "top5": top5,
                    "start_time": window["start_time"],
                    "end_time": window["end_time"],
                    "anchor_idx": window.get("anchor_idx"),
                }

                # enqueue into smoothing history
                self.pred_history.append(result)
                try:
                    await self.send_callback({"type": "inference", "result": result, "partial": False})
                except Exception:
                    pass

            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(0.01)

    async def _smoother(self):
        """Periodically check recent predictions and emit stable words when criteria met."""
        while self._running:
            await asyncio.sleep(0.08)
            if len(self.pred_history) == 0:
                continue
            candidate, votes, avg_conf = select_stable_candidate(self.pred_history)

            now = time.time()
            if votes >= self.stable_votes and avg_conf >= 0.35:
                if not self.word_stream or self.word_stream[-1]["word"] != candidate:
                    entry = {"word": candidate, "confidence": float(avg_conf), "ts": now}
                    self.word_stream.append(entry)
                    self.last_stable_time = now
                    try:
                        await self.send_callback({"type": "stable", "entry": entry})
                    except Exception:
                        pass
                    asyncio.create_task(self._maybe_generate_sentence())
                self.state = "STABLE_WORD"
                self.pred_history.clear()
            else:
                if votes > 0:
                    self.state = "SIGN_DETECTED"
                else:
                    self.state = "IDLE"

    async def _maybe_generate_sentence(self):
        """Generate a sentence when a pause in signing is detected."""
        await asyncio.sleep(self.sentence_pause_s)
        now = time.time()
        if self.last_stable_time is None:
            return
        if now - self.last_stable_time < self.sentence_pause_s:
            return
        if len(self.word_stream) == 0:
            return
        labels = [w["word"] for w in self.word_stream]
        top5_hist = []
        try:
            sentence = await generate_sentence_from_sequence(labels, top5_hist, backend="auto")
        except Exception as e:
            print('[pipeline] generate_sentence failed:', e)
            sentence = ""
        if sentence:
            print(f"[pipeline] generated sentence: {sentence}")
            try:
                await self.send_callback({"type": "sentence", "sentence": sentence, "words": labels})
            except Exception as e:
                print('[pipeline] send sentence failed:', e)
        self.word_stream.clear()

    async def _partial_inference(self):
        """Run lightweight partial inference periodically."""
        loop = asyncio.get_running_loop()
        MIN_PARTIAL_FRAMES = max(2, min(8, self.window_size // 4))
        while self._running:
            await asyncio.sleep(0.25)
            async with self._lock:
                n = len(self.buffer)
                if n < MIN_PARTIAL_FRAMES:
                    continue
                # take the last up to window_size frames
                slice_items = list(self.buffer)[max(0, n - self.window_size):n]
                seq_np = np.stack([x[1] for x in slice_items], axis=0)
            try:
                probs = await loop.run_in_executor(None, run_model_prediction, self.model, seq_np)
            except Exception as e:
                print('[pipeline] partial inference failed:', e)
                continue

            best_label, best_conf, top5 = build_top5_result(probs, self.idx2label)

            result = {
                "word": best_label,
                "confidence": best_conf,
                "top5": top5,
                "start_time": slice_items[0][0],
                "end_time": slice_items[-1][0],
            }
            try:
                await self.send_callback({"type": "inference", "result": result, "partial": True})
                self.pred_history.append(result)
            except Exception:
                pass
