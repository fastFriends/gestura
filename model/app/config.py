from pathlib import Path

MODEL_TYPE = 'gru'  # 'gru' or 'transformer'
BASE_DIR = Path(r'd:\Live Sign Language Translator UI\model')
GRU_CKPT = BASE_DIR / 'asl-model-gru' / 'best-v2.pth'
TRANSFORMER_CKPT = BASE_DIR / 'asl-model-transformer' / 'best-v1.pth'
WORDS_CSV = BASE_DIR / '95_words.csv'
T_SEQ = 32
