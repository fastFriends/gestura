import tempfile
import os

try:
    import pyttsx3
except Exception:
    pyttsx3 = None


def text_to_wav_bytes(text: str) -> bytes:
    """Synchronous helper: render `text` to a temporary WAV file using pyttsx3,
    read and return bytes, then remove the temporary file.

    Note: this is blocking and should be called from a threadpool in async handlers.
    """
    if pyttsx3 is None:
        raise RuntimeError("pyttsx3 is not installed or failed to import")

    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_path = tmp.name
    tmp.close()

    engine = pyttsx3.init()
    try:
        engine.setProperty('rate', 150)
        engine.save_to_file(text, tmp_path)
        engine.runAndWait()

        with open(tmp_path, 'rb') as f:
            data = f.read()
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

    return data
