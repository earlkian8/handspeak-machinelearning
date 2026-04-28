"""Rich display metadata for every island served by /api/study/islands.

build_islands() merges this with ALPHABET_TOPICS / STUDY_TOPICS from
asl_data.py and may include conversation islands when they contain
playable levels.
The frontend should fetch /api/study/islands and cache the result —
nothing island-related should be hardcoded in the frontend anymore.
"""

from __future__ import annotations
from typing import Any

XP_PER_LEVEL = 10
XP_PER_ALPHABET_LEVEL = 5

# ── Dedicated conversation islands ────────────────────────────────────────────
# These are not derived from asl_data.py — they are thematic conversation worlds.
CONVERSATION_ISLANDS: list[dict[str, Any]] = [
    {
        "id": "greetings",
        "title": "Greetings & Openers",
        "icon": "🤝",
        "type": "conversation",
        "situations": [
            {
                "emoji": "🏫",
                "label": "School",
                "description": "You're in a classroom asking for help or greeting teachers."
            },
            {
                "emoji": "🛒",
                "label": "Store",
                "description": "You're shopping and need assistance or are paying at the register."
            },
            {
                "emoji": "🚌",
                "label": "Commute",
                "description": "You're on public transportation engaging in small talk."
            },
            {
                "emoji": "👋",
                "label": "First Meeting",
                "description": "You're meeting someone for the first time."
            },
            {
                "emoji": "🆘",
                "label": "Help Request",
                "description": "You need urgent assistance or clarification."
            }
        ],
        "difficulty": "Beginner",
        "difficulty_rank": 0,
        "has_learn": False,
        "has_drill": False,
        "has_converse": True,
        "intro": {
            "title": "Greetings Island",
            "story": "Every great voyage begins with a wave! On Greetings Island you learn foundational conversational signs that open doors and start real exchanges.",
            "description": "Master your first set of essential ASL conversation signs and build confidence before moving deeper into the voyage.",
            "objective": "Complete a full Reply Quest chain to prove you can hold a basic ASL greeting.",
            "hint": "Keep your hand clearly centered in frame and use smooth, deliberate movements.",
        },
        "theme": {
            "sky": "linear-gradient(180deg,#8fd3ff 0%,#4fb4ff 100%)",
            "island": "linear-gradient(180deg,#ffd36f 0%,#ffb347 100%)",
        },
        "levels": [],
    },
]

# ── Per-chapter metadata overrides ────────────────────────────────────────────
# Keys match IDs produced by asl_data.py ('alphabet-chapter-N', 'chapter-N').
_CHAPTER_META: dict[str, dict[str, Any]] = {
    # Alphabet chapters
    "alphabet-chapter-1": {
        "difficulty": "Easy",
        "hint": "Hold each letter steady for 1-2 seconds. Clear finger and hand positioning is key!",
        "theme": {"sky": "linear-gradient(180deg,#e0c3fc 0%,#8ec5fc 100%)", "island": "linear-gradient(180deg,#ffd89b 0%,#19547b 100%)"},
    },
    "alphabet-chapter-2": {
        "difficulty": "Easy",
        "hint": "Practice transitioning cleanly between letters. Smooth motion matters.",
        "theme": {"sky": "linear-gradient(180deg,#d4f8e8 0%,#79dbb7 100%)", "island": "linear-gradient(180deg,#ffe1a8 0%,#d4a44c 100%)"},
    },
    "alphabet-chapter-3": {
        "difficulty": "Easy",
        "hint": "Letters here involve subtle wrist angles — go slow and hold firm.",
        "theme": {"sky": "linear-gradient(180deg,#c3d9fc 0%,#7baee8 100%)", "island": "linear-gradient(180deg,#ffcb80 0%,#f59f4b 100%)"},
    },
    "alphabet-chapter-4": {
        "difficulty": "Easy",
        "hint": "Final alphabet chapter! Stay relaxed — tension causes blurry signs.",
        "theme": {"sky": "linear-gradient(180deg,#fde8c8 0%,#f5b670 100%)", "island": "linear-gradient(180deg,#c8f3c8 0%,#5db85d 100%)"},
    },
    # Vocabulary chapters
    "chapter-1": {
        "title": "Everyday Basics",
        "icon": "🌟",
        "difficulty": "Easy",
        "story": "Begin your vocabulary journey with the most common everyday signs. These are the building blocks of real conversation.",
        "hint": "Keep your hand clearly centered in frame and use smooth, deliberate movements.",
        "theme": {"sky": "linear-gradient(180deg,#95c7ff 0%,#3f86d9 100%)", "island": "linear-gradient(180deg,#ffcb80 0%,#f59f4b 100%)"},
    },
    "chapter-2": {
        "title": "Actions & Feelings",
        "icon": "💬",
        "difficulty": "Easy",
        "story": "Expand your signing with action words and emotional expressions that come up in every real conversation.",
        "hint": "Action signs often have a flowing motion — let your arm move naturally.",
        "theme": {"sky": "linear-gradient(180deg,#c9f7d9 0%,#74d6ae 100%)", "island": "linear-gradient(180deg,#c8b6a6 0%,#9c7f66 100%)"},
    },
    "chapter-3": {
        "title": "People & Places",
        "icon": "👥",
        "difficulty": "Medium",
        "story": "Learn the signs for people, family roles, and common places. These connect you to the people around you.",
        "hint": "Family signs are often near the face — chin area for female, forehead for male.",
        "theme": {"sky": "linear-gradient(180deg,#ceb9ff 0%,#8f74ff 100%)", "island": "linear-gradient(180deg,#8aa7ff 0%,#5867df 100%)"},
    },
    "chapter-4": {
        "title": "Nature & Animals",
        "icon": "🌿",
        "difficulty": "Medium",
        "story": "Explore the natural world through ASL. These expressive signs are vivid and memorable.",
        "hint": "Animal signs often mimic the creature's most distinctive feature — be expressive!",
        "theme": {"sky": "linear-gradient(180deg,#9be7df 0%,#3bb8a8 100%)", "island": "linear-gradient(180deg,#5f8f8a 0%,#3a6661 100%)"},
    },
    "chapter-5": {
        "title": "Home & Objects",
        "icon": "🏠",
        "difficulty": "Medium",
        "story": "Signs for objects around the home — from furniture to food. Practical vocab for daily life.",
        "hint": "Object signs often mimic how you use or interact with the item.",
        "theme": {"sky": "linear-gradient(180deg,#ffe6b8 0%,#ffb16d 100%)", "island": "linear-gradient(180deg,#ff8a65 0%,#e96d4e 100%)"},
    },
    "chapter-6": {
        "title": "Body & Senses",
        "icon": "👁️",
        "difficulty": "Medium",
        "story": "Dive into the signs for the body, senses, and the feelings that pulse through every conversation.",
        "hint": "Body signs are made near the body part they represent — let the location guide your hand.",
        "theme": {"sky": "linear-gradient(180deg,#1e3a8a 0%,#1d4ed8 100%)", "island": "linear-gradient(180deg,#3b82f6 0%,#1d4ed8 100%)"},
    },
    "chapter-7": {
        "title": "Playful Waters",
        "icon": "🎮",
        "difficulty": "Medium",
        "story": "Fun, feelings, and everyday activities flow through these mid-water currents. Play hard, sign harder.",
        "hint": "Action signs often start from the body and move outward. Keep movements smooth and deliberate.",
        "theme": {"sky": "linear-gradient(180deg,#1e1b4b 0%,#312e81 100%)", "island": "linear-gradient(180deg,#4338ca 0%,#3730a3 100%)"},
    },
    "chapter-8": {
        "title": "Tidal Routines",
        "icon": "🌙",
        "difficulty": "Medium",
        "story": "Like tides that follow the rhythm of day and night, these signs cover routines from morning to midnight.",
        "hint": "Time signs share a consistent plane in front of you — morning, night, now, tomorrow move along the same axis.",
        "theme": {"sky": "linear-gradient(180deg,#1e1b4b 0%,#1e3a5f 100%)", "island": "linear-gradient(180deg,#1d4ed8 0%,#1e1b4b 100%)"},
    },
    "chapter-9": {
        "title": "Reef Community",
        "icon": "🪸",
        "difficulty": "Medium",
        "story": "Like the coral reef, community thrives on connection. These signs cover the people and manners around you.",
        "hint": "Social signs like 'please' are smooth and circular — politeness flows naturally in ASL.",
        "theme": {"sky": "linear-gradient(180deg,#0f172a 0%,#1e3a5f 100%)", "island": "linear-gradient(180deg,#1e3a5f 0%,#0f172a 100%)"},
    },
    "chapter-10": {
        "title": "Deep Comfort",
        "icon": "💧",
        "difficulty": "Hard",
        "story": "As you descend deeper, comfort becomes essential. These signs cover health, rest, and the calm of home.",
        "hint": "Signs for health and comfort are gentle and fluid — let your natural motion lead.",
        "theme": {"sky": "linear-gradient(180deg,#0c0a3e 0%,#1e1b4b 100%)", "island": "linear-gradient(180deg,#312e81 0%,#1e1b4b 100%)"},
    },
    "chapter-11": {
        "title": "Pressure Expressions",
        "icon": "💬",
        "difficulty": "Hard",
        "story": "Under the pressure of the deep, these expressions bubble up from within — thoughts, stories, and feelings.",
        "hint": "Abstract signs need confidence. Hold each sign firmly and trust your muscle memory.",
        "theme": {"sky": "linear-gradient(180deg,#030712 0%,#0c0a3e 100%)", "island": "linear-gradient(180deg,#1e1b4b 0%,#030712 100%)"},
    },
    "chapter-12": {
        "title": "Abyss Discoveries",
        "icon": "🔭",
        "difficulty": "Hard",
        "story": "In the abyss, curiosity reigns. These signs explore time, relationships, and the great unknown of the deep.",
        "hint": "WH-question signs (who, where) share a wrinkled-brow expression — your face signs too!",
        "theme": {"sky": "linear-gradient(180deg,#020617 0%,#0f0a2e 100%)", "island": "linear-gradient(180deg,#0f172a 0%,#020617 100%)"},
    },
    "chapter-13": {
        "title": "Trench Mastery",
        "icon": "🏆",
        "difficulty": "Hard",
        "story": "You've reached the deepest trench. These final signs complete your mastery — only dedicated divers make it here.",
        "hint": "You've come so far. Confidence is the last skill. Each sign is a victory.",
        "theme": {"sky": "linear-gradient(180deg,#000000 0%,#020617 100%)", "island": "linear-gradient(180deg,#0c0a1e 0%,#000000 100%)"},
    },
}

_DEFAULT_THEMES = [
    {"sky": "linear-gradient(180deg,#a8edea 0%,#5ab9b9 100%)", "island": "linear-gradient(180deg,#fdc830 0%,#f37335 100%)"},
    {"sky": "linear-gradient(180deg,#e0e0e0 0%,#8fb3cc 100%)", "island": "linear-gradient(180deg,#d4b896 0%,#a07850 100%)"},
    {"sky": "linear-gradient(180deg,#d4e9ff 0%,#6b9fcf 100%)", "island": "linear-gradient(180deg,#c9e265 0%,#7db53c 100%)"},
    {"sky": "linear-gradient(180deg,#f8e1f4 0%,#c67bce 100%)", "island": "linear-gradient(180deg,#ffd6a5 0%,#ffab6e 100%)"},
    {"sky": "linear-gradient(180deg,#d4edda 0%,#74c69d 100%)", "island": "linear-gradient(180deg,#ffecd2 0%,#fcb69f 100%)"},
]
_DEFAULT_ICONS = ["📚", "🎯", "🧩", "🚀", "🌈", "💡", "🎨", "🌊", "⭐", "🎭"]


def _build_merged_alphabet_island() -> dict[str, Any]:
    """Build a single merged 'Alphabet Island' from all alphabet chapter topics."""
    from data.asl_data import ALPHABET_TOPICS

    all_levels: list[dict[str, Any]] = []
    level_order = 1
    for topic in ALPHABET_TOPICS:
        for p in topic["phrases"]:
            all_levels.append({
                "id": f"{topic['id']}::{p['id']}",
                "phrase_id": p["id"],
                "order": level_order,
                "type": "letter",
                "label": p["label"],
                "description": p["description"],
                "tip": p["tip"],
                "reward_xp": XP_PER_ALPHABET_LEVEL,
            })
            level_order += 1

    return {
        "id": "alphabet",
        "title": "Alphabet Dive",
        "order": 1,
        "icon": "🌴",
        "type": "alphabet",
        "difficulty": "Easy",
        "difficulty_rank": 1,
        "has_learn": True,
        "has_drill": True,
        "has_converse": False,
        "boss": {
            "name": "The Final Letter",
            "icon": "👑",
            "border_color": "#fbbf24",
        },
        "intro": {
            "title": "Alphabet Dive",
            "story": "Welcome to the lush jungles of Alphabet Dive! Master every ASL letter from A to Y as you trek through tropical terrain. Each letter conquered brings you closer to the Final Letter boss challenge!",
            "description": "Learn and practice all ASL alphabet letters in one epic island journey.",
            "objective": "Complete all 24 letter levels and defeat The Final Letter!",
            "hint": "Hold each letter steady for 1-2 seconds. Clear finger and hand positioning is key!",
        },
        "theme": {
            "sky": "linear-gradient(180deg,#065f46 0%,#047857 40%,#10b981 100%)",
            "island": "linear-gradient(180deg,#34d399 0%,#059669 100%)",
            "gradient": "linear-gradient(135deg, #065f46, #047857, #10b981)",
            "particles": "leaves",
        },
        "levels": all_levels,
    }


def _build_vocab_island(topic: dict, order: int, idx: int) -> dict[str, Any]:
    meta = _CHAPTER_META.get(topic["id"], {})
    title = meta.get("title", topic["title"])
    icon = meta.get("icon", _DEFAULT_ICONS[idx % len(_DEFAULT_ICONS)])
    difficulty = meta.get("difficulty", "Medium")
    difficulty_rank = {"Easy": 1, "Medium": 2, "Hard": 3}.get(difficulty, 2)

    # Per-island boss and theme configuration
    _VOCAB_BOSS: dict[str, dict[str, Any]] = {
        "chapter-1": {
            "boss": {"name": "Daily Life Gauntlet", "icon": "⚡", "border_color": "#3b82f6"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #1e40af, #3b82f6, #93c5fd)", "particles": "clouds"},
        },
        "chapter-2": {
            "boss": {"name": "The Emotion Master", "icon": "🎭", "border_color": "#a855f7"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #581c87, #7c3aed, #c084fc)", "particles": "orbs"},
        },
        "chapter-3": {
            "boss": {"name": "Community Challenge", "icon": "🏛️", "border_color": "#d97706"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #92400e, #d97706, #fbbf24)", "particles": "leaves"},
        },
        "chapter-4": {
            "boss": {"name": "Jungle Boss", "icon": "🐾", "border_color": "#059669"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #064e3b, #059669, #34d399)", "particles": "butterflies"},
        },
        "chapter-5": {
            "boss": {"name": "Household Gauntlet", "icon": "🔑", "border_color": "#ea580c"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #9a3412, #ea580c, #fb923c)", "particles": "sparkles"},
        },
        "chapter-6": {
            "boss": {"name": "The Senses Overlord", "icon": "👁️", "border_color": "#60a5fa"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #1e40af, #2563eb, #60a5fa)", "particles": "clouds"},
        },
        "chapter-7": {
            "boss": {"name": "The Fun Champion", "icon": "🎮", "border_color": "#818cf8"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #312e81, #4338ca, #6366f1)", "particles": "orbs"},
        },
        "chapter-8": {
            "boss": {"name": "The Night Keeper", "icon": "🌙", "border_color": "#a78bfa"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #1e1b4b, #3730a3, #6366f1)", "particles": "orbs"},
        },
        "chapter-9": {
            "boss": {"name": "The Reef Guardian", "icon": "🪸", "border_color": "#34d399"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #064e3b, #065f46, #059669)", "particles": "butterflies"},
        },
        "chapter-10": {
            "boss": {"name": "The Deep Medic", "icon": "💧", "border_color": "#6366f1"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #1e1b4b, #312e81, #4f46e5)", "particles": "orbs"},
        },
        "chapter-11": {
            "boss": {"name": "The Expression Master", "icon": "💬", "border_color": "#c084fc"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #3b0764, #7e22ce, #a855f7)", "particles": "sparkles"},
        },
        "chapter-12": {
            "boss": {"name": "The Abyss Oracle", "icon": "🔭", "border_color": "#4f46e5"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)", "particles": "orbs"},
        },
        "chapter-13": {
            "boss": {"name": "The Trench Master", "icon": "🏆", "border_color": "#fbbf24"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #0f172a, #1c1917, #292524)", "particles": "sparkles"},
        },
    }

    boss_meta = _VOCAB_BOSS.get(topic["id"], {})

    levels = [
        {
            "id": f"{topic['id']}::{p['id']}",
            "phrase_id": p["id"],
            "order": i + 1,
            "type": "word",
            "label": p["label"],
            "description": p["description"],
            "tip": p["tip"],
            "reward_xp": XP_PER_LEVEL,
        }
        for i, p in enumerate(topic["phrases"])
    ]

    theme = meta.get("theme", _DEFAULT_THEMES[idx % len(_DEFAULT_THEMES)])
    if "theme_extra" in boss_meta:
        theme = {**theme, **boss_meta["theme_extra"]}

    result = {
        "id": topic["id"],
        "title": title,
        "order": order,
        "icon": icon,
        "type": "vocabulary",
        "difficulty": difficulty,
        "difficulty_rank": difficulty_rank,
        "has_learn": True,
        "has_drill": True,
        "has_converse": False,
        "intro": {
            "title": f"{title} Dive",
            "story": meta.get("story", f"Learn and master essential signs in {title} on this island."),
            "description": f"Practice these signs and build your vocabulary for {title.lower()}.",
            "objective": f"Complete all levels and defeat the island boss!",
            "hint": meta.get("hint", "Keep your hand centered and clearly visible in the frame."),
        },
        "theme": theme,
        "levels": levels,
    }

    if "boss" in boss_meta:
        result["boss"] = boss_meta["boss"]

    return result


def build_islands() -> list[dict[str, Any]]:
    """Return ordered islands: merged alphabet -> non-empty conversation -> vocabulary."""
    from data.asl_data import STUDY_TOPICS

    result: list[dict[str, Any]] = []

    # 1. Single merged Alphabet Island (was 4 separate chapters)
    result.append(_build_merged_alphabet_island())

    # 2. Conversation islands
    base_order = 2
    conversation_count = 0
    for island in CONVERSATION_ISLANDS:
        island_copy = island.copy()
        if len(island_copy.get("levels") or []) == 0:
            continue
        island_copy["order"] = base_order + conversation_count
        island_copy.setdefault("boss", {
            "name": "The Grand Welcome",
            "icon": "🤝",
            "border_color": "#f97316",
        })
        island_copy.setdefault("theme", {})
        island_copy["theme"] = {
            **island_copy["theme"],
            "gradient": "linear-gradient(135deg, #9a3412, #f97316, #fdba74)",
            "particles": "stars",
        }
        result.append(island_copy)
        conversation_count += 1

    # 3. Vocabulary islands
    base_order += conversation_count
    for idx, topic in enumerate(STUDY_TOPICS):
        result.append(_build_vocab_island(topic, base_order + idx, idx))

    return result
