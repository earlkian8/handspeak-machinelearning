"""Vocabulary helpers backed by model/words.txt."""

from __future__ import annotations

from pathlib import Path
import runpy
from typing import Any


MODEL_DIR = Path(__file__).resolve().parents[2] / "model"
WORDS_FILE = MODEL_DIR / "words.txt"
CHAPTER_SIZE = 20


def _load_words() -> list[str]:
    namespace = runpy.run_path(str(WORDS_FILE))
    raw_words = namespace.get("CONVERSATIONAL_100", [])
    words: list[str] = []

    for raw_word in raw_words:
        word = str(raw_word).strip().upper()
        if word and word not in words:
            words.append(word)

    return words


def _humanize(word: str) -> str:
    if word == "THANKYOU":
        return "THANK YOU"
    return word


def _chunk(items: list[Any], size: int) -> list[list[Any]]:
    return [items[index:index + size] for index in range(0, len(items), size)]


VOCABULARY_WORDS = _load_words()

VOCABULARY_ENTRIES = [
    {
        "id": word.lower(),
        "label": _humanize(word),
        "word": word,
        "order": index + 1,
        "chapter_id": f"chapter-{index // CHAPTER_SIZE + 1}",
        "description": f"Practice the ASL sign for {_humanize(word)}.",
        "tip": "Keep your hand centered and clearly visible in the frame.",
    }
    for index, word in enumerate(VOCABULARY_WORDS)
]

VOCABULARY_BY_ID = {entry["id"]: entry for entry in VOCABULARY_ENTRIES}

STUDY_TOPICS = []
for index, chunk in enumerate(_chunk(VOCABULARY_ENTRIES, CHAPTER_SIZE)):
    chapter_id = f"chapter-{index + 1}"
    title = f"Chapter {index + 1}"
    STUDY_TOPICS.append(
        {
            "id": chapter_id,
            "title": title,
            "order": index + 1,
            "icon": "📘",
            "phrases": [
                {
                    "id": entry["id"],
                    "word_id": entry["id"],
                    "label": entry["label"],
                    "description": entry["description"],
                    "tip": entry["tip"],
                    "order": entry["order"],
                }
                for entry in chunk
            ],
        }
    )

ALL_STUDY_PHRASES = []
for topic in STUDY_TOPICS:
    for phrase in topic["phrases"]:
        ALL_STUDY_PHRASES.append({**phrase, "topic_id": topic["id"], "topic_title": topic["title"]})

ALL_PRACTICE_SIGNS = VOCABULARY_ENTRIES
