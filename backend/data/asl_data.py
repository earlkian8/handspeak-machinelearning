"""Vocabulary helpers backed by curated chapter lists."""

from __future__ import annotations

from typing import Any
import re


def _humanize(word: str) -> str:
    lowered = word.lower()
    if lowered == "haveto":
        return "HAVE TO"
    if lowered == "thankyou":
        return "THANK YOU"
    if lowered == "callonphone":
        return "CALL ON PHONE"
    if lowered == "glasswindow":
        return "GLASS WINDOW"
    if lowered == "frenchfries":
        return "FRENCH FRIES"
    if lowered == "icecream":
        return "ICE CREAM"
    if lowered == "toothbrush":
        return "TOOTH BRUSH"
    if lowered == "hesheit":
        return "HE/SHE/IT"
    if lowered == "weus":
        return "WE/US"
    if lowered == "minemy":
        return "MINE/MY"
    if lowered == "tv":
        return "TV"
    return word


def _chunk(items: list[Any], size: int) -> list[list[Any]]:
    return [items[index:index + size] for index in range(0, len(items), size)]


_SYLLABLE_OVERRIDES: dict[str, int] = {
    "cowboy": 2,
    "donkey": 2,
    "dryer": 2,
    "flower": 2,
    "giraffe": 2,
    "zebra": 2,
    "alligator": 3,
    "elephant": 3,
    "frenchfries": 2,
    "icecream": 2,
    "orange": 2,
    "pizza": 2,
    "chocolate": 3,
    "cereal": 3,
    "brother": 2,
    "grandma": 2,
    "grandpa": 2,
    "uncle": 2,
    "yourself": 2,
    "another": 3,
    "pajamas": 3,
    "backyard": 2,
    "closet": 2,
    "napkin": 2,
    "outside": 2,
    "potty": 2,
    "table": 2,
    "toothbrush": 2,
    "refrigerator": 3,
    "underwear": 3,
    "better": 2,
    "finish": 2,
    "haveto": 2,
    "hungry": 2,
    "noisy": 2,
    "pretend": 2,
    "thirsty": 2,
    "tomorrow": 3,
    "yesterday": 3,
    "airplane": 2,
    "balloon": 2,
    "because": 2,
    "fireman": 2,
    "garbage": 2,
    "later": 2,
    "listen": 2,
    "morning": 2,
    "police": 2,
    "shower": 2,
    "tiger": 2,
    "water": 2,
    "yellow": 2,
    "helicopter": 3,
    "callonphone": 3,
    "radio": 3,
    "tv": 2,
}


def _normalize_word_id(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def _count_syllables(word: str) -> int:
    key = _normalize_word_id(word)
    if key in _SYLLABLE_OVERRIDES:
        return _SYLLABLE_OVERRIDES[key]

    cleaned = re.sub(r"[^a-z]", "", key)
    if not cleaned:
        return 1
    vowels = "aeiouy"
    count = 0
    prev_is_vowel = False
    for char in cleaned:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel
    if cleaned.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)


CHAPTERS: list[dict[str, Any]] = [
    {
        "id": "chapter-1",
        "title": "Down on the Farm",
        "words": [
            "bee", "bird", "bug", "cow", "duck", "farm", "frog", "hen", "horse", "owl", "pig",
            "cowboy", "donkey", "dryer", "flower", "giraffe", "zebra",
            "alligator", "elephant",
        ],
    },
    {
        "id": "chapter-2",
        "title": "Snack Time",
        "words": [
            "drink", "food", "gum", "milk", "nuts", "snack", "taste",
            "apple", "carrot", "frenchfries", "icecream", "orange", "pizza",
            "chocolate", "cereal",
        ],
    },
    {
        "id": "chapter-3",
        "title": "Family & People",
        "words": [
            "aunt", "boy", "dad", "girl", "hesheit", "man", "mom", "weus", "who", "yes",
            "brother", "grandma", "grandpa", "uncle", "yourself",
            "another", "pajamas",
        ],
    },
    {
        "id": "chapter-4",
        "title": "Around the House",
        "words": [
            "bath", "bed", "doll", "hat", "home", "if", "lamp", "make", "no", "stairs", "store",
            "backyard", "closet", "napkin", "outside", "potty", "table", "toothbrush",
            "refrigerator", "underwear",
        ],
    },
    {
        "id": "chapter-5",
        "title": "Feelings & Body",
        "words": [
            "cheek", "cry", "eye", "hair", "head", "high", "hot", "kiss", "mad", "nose", "sad", "sick", "smile",
            "better", "finish", "haveto", "hungry", "noisy", "pretend", "thirsty",
            "tomorrow", "yesterday",
        ],
    },
    {
        "id": "chapter-6",
        "title": "Out & About",
        "words": [
            "all", "black", "blow", "blue", "boat", "brown", "bye", "cloud", "clown", "cut", "cute", "find",
            "first", "for", "grass", "lion", "moon", "mouse", "night", "now", "old", "rain", "see", "shhh",
            "shirt", "shoe", "snow", "sun", "stuck", "talk", "time", "tree", "up", "wet", "where", "white", "wolf",
            "airplane", "balloon", "because", "fireman", "garbage", "later", "listen", "morning", "police", "shower", "tv", "tiger", "water", "yellow",
            "helicopter", "callonphone", "radio",
        ],
    },
]


VOCABULARY_ENTRIES: list[dict[str, Any]] = []
for chapter_index, chapter in enumerate(CHAPTERS, start=1):
    for word_index, raw_word in enumerate(chapter["words"], start=1):
        word_id = _normalize_word_id(raw_word)
        syllables = _count_syllables(word_id)
        VOCABULARY_ENTRIES.append(
            {
                "id": word_id,
                "label": _humanize(word_id),
                "word": word_id,
                "order": word_index,
                "chapter_id": chapter["id"],
                "syllables": syllables,
                "description": f"Practice the ASL sign for {_humanize(word_id)}.",
                "tip": "Keep your hand centered and clearly visible in the frame.",
            }
        )

VOCABULARY_BY_ID = {entry["id"]: entry for entry in VOCABULARY_ENTRIES}

STUDY_TOPICS: list[dict[str, Any]] = []
for chapter_index, chapter in enumerate(CHAPTERS, start=1):
    phrases = [entry for entry in VOCABULARY_ENTRIES if entry["chapter_id"] == chapter["id"]]
    STUDY_TOPICS.append(
        {
            "id": chapter["id"],
            "title": chapter["title"],
            "order": chapter_index,
            "icon": "book",
            "phrases": [
                {
                    "id": entry["id"],
                    "word_id": entry["id"],
                    "label": entry["label"],
                    "description": entry["description"],
                    "tip": entry["tip"],
                    "order": entry["order"],
                    "syllables": entry["syllables"],
                }
                for entry in phrases
            ],
        }
    )

ALL_STUDY_PHRASES = []
for topic in STUDY_TOPICS:
    for phrase in topic["phrases"]:
        ALL_STUDY_PHRASES.append({**phrase, "topic_id": topic["id"], "topic_title": topic["title"]})


# ── Letter Data (Static Model) ──────────────────────────────────────────────────
# ASL letters recognized by the static model
ALPHABET_LETTERS = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I",
    "K", "L", "M", "N", "O", "P", "Q", "R",
    "S", "T", "U", "V", "W", "X", "Y"
]

ALPHABET_ENTRIES = [
    {
        "id": letter.lower(),
        "label": letter,
        "letter": letter,
        "order": index + 1,
        "chapter_id": f"alphabet-chapter-{(index // 6) + 1}",
        "description": f"Learn the ASL sign for the letter '{letter}'.",
        "tip": "Make sure your hand is clearly visible and centered in the frame.",
        "model_type": "static",
    }
    for index, letter in enumerate(ALPHABET_LETTERS)
]

ALPHABET_BY_ID = {entry["id"]: entry for entry in ALPHABET_ENTRIES}

# Alphabet study topics (6 letters per chapter)
ALPHABET_TOPICS = []
for index, chunk in enumerate(_chunk(ALPHABET_ENTRIES, 6)):
    chapter_id = f"alphabet-chapter-{index + 1}"
    title = f"Alphabet {index + 1}"
    ALPHABET_TOPICS.append(
        {
            "id": chapter_id,
            "title": title,
            "order": index + 1,
            "icon": "🔤",
            "type": "alphabet",
            "phrases": [
                {
                    "id": entry["id"],
                    "letter_id": entry["id"],
                    "label": entry["label"],
                    "description": entry["description"],
                    "tip": entry["tip"],
                    "order": entry["order"],
                    "model_type": "static",
                }
                for entry in chunk
            ],
        }
    )

# ── Combined Data ────────────────────────────────────────────────────────────────
ALL_PRACTICE_SIGNS = VOCABULARY_ENTRIES
ALL_PRACTICE_LETTERS = ALPHABET_ENTRIES
ALL_PRACTICE_ITEMS = ALL_PRACTICE_LETTERS + ALL_PRACTICE_SIGNS
