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
        "title": "Down on the Farm",
        "icon": "paw-print",
        "difficulty": "Easy",
        "story": "Meet the animals and classic farm signs. Start with short, simple signs and build up.",
        "hint": "Keep each sign steady and clear before moving to the next.",
        "theme": {"sky": "linear-gradient(180deg,#95c7ff 0%,#3f86d9 100%)", "island": "linear-gradient(180deg,#ffcb80 0%,#f59f4b 100%)"},
    },
    "chapter-2": {
        "title": "Snack Time",
        "icon": "utensils",
        "difficulty": "Easy",
        "story": "Explore foods and snacks with easy one-syllable signs first, then longer words.",
        "hint": "Food signs are often made near the mouth — slow and steady helps recognition.",
        "theme": {"sky": "linear-gradient(180deg,#c9f7d9 0%,#74d6ae 100%)", "island": "linear-gradient(180deg,#c8b6a6 0%,#9c7f66 100%)"},
    },
    "chapter-3": {
        "title": "Family & People",
        "icon": "users",
        "difficulty": "Medium",
        "story": "Learn signs for people, family roles, and the words you use every day.",
        "hint": "Family signs are often near the face — chin area for female, forehead for male.",
        "theme": {"sky": "linear-gradient(180deg,#ceb9ff 0%,#8f74ff 100%)", "island": "linear-gradient(180deg,#8aa7ff 0%,#5867df 100%)"},
    },
    "chapter-4": {
        "title": "Around the House",
        "icon": "home",
        "difficulty": "Medium",
        "story": "Home items and daily objects. Start with quick signs, then move to longer words.",
        "hint": "Object signs often mimic how you use or interact with the item.",
        "theme": {"sky": "linear-gradient(180deg,#9be7df 0%,#3bb8a8 100%)", "island": "linear-gradient(180deg,#5f8f8a 0%,#3a6661 100%)"},
    },
    "chapter-5": {
        "title": "Feelings & Body",
        "icon": "heart",
        "difficulty": "Medium",
        "story": "Face, body, and feelings. Build confidence as syllables increase.",
        "hint": "Body signs are made near the body part they represent — let the location guide your hand.",
        "theme": {"sky": "linear-gradient(180deg,#1e3a8a 0%,#1d4ed8 100%)", "island": "linear-gradient(180deg,#3b82f6 0%,#1d4ed8 100%)"},
    },
    "chapter-6": {
        "title": "Out & About",
        "icon": "map-pin",
        "difficulty": "Medium",
        "story": "Everyday places, colors, and quick phrases for the world outside.",
        "hint": "Keep your signs centered and use smooth, deliberate movements.",
        "theme": {"sky": "linear-gradient(180deg,#1e1b4b 0%,#312e81 100%)", "island": "linear-gradient(180deg,#4338ca 0%,#3730a3 100%)"},
    },
}

_DEFAULT_THEMES = [
    {"sky": "linear-gradient(180deg,#a8edea 0%,#5ab9b9 100%)", "island": "linear-gradient(180deg,#fdc830 0%,#f37335 100%)"},
    {"sky": "linear-gradient(180deg,#e0e0e0 0%,#8fb3cc 100%)", "island": "linear-gradient(180deg,#d4b896 0%,#a07850 100%)"},
    {"sky": "linear-gradient(180deg,#d4e9ff 0%,#6b9fcf 100%)", "island": "linear-gradient(180deg,#c9e265 0%,#7db53c 100%)"},
    {"sky": "linear-gradient(180deg,#f8e1f4 0%,#c67bce 100%)", "island": "linear-gradient(180deg,#ffd6a5 0%,#ffab6e 100%)"},
    {"sky": "linear-gradient(180deg,#d4edda 0%,#74c69d 100%)", "island": "linear-gradient(180deg,#ffecd2 0%,#fcb69f 100%)"},
]
_DEFAULT_ICONS = ["book", "target", "puzzle", "rocket", "sparkles", "lightbulb", "palette", "waves", "star", "theater"]


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
            "boss": {"name": "Daily Life Gauntlet", "icon": "bolt", "border_color": "#3b82f6"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #1e40af, #3b82f6, #93c5fd)", "particles": "clouds"},
        },
        "chapter-2": {
            "boss": {"name": "The Emotion Master", "icon": "theater", "border_color": "#a855f7"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #581c87, #7c3aed, #c084fc)", "particles": "orbs"},
        },
        "chapter-3": {
            "boss": {"name": "Community Challenge", "icon": "landmark", "border_color": "#d97706"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #92400e, #d97706, #fbbf24)", "particles": "leaves"},
        },
        "chapter-4": {
            "boss": {"name": "Household Guardian", "icon": "shield", "border_color": "#059669"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #064e3b, #059669, #34d399)", "particles": "butterflies"},
        },
        "chapter-5": {
            "boss": {"name": "Feeling Surge", "icon": "heart", "border_color": "#ea580c"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #9a3412, #ea580c, #fb923c)", "particles": "sparkles"},
        },
        "chapter-6": {
            "boss": {"name": "The City Sprint", "icon": "map-pin", "border_color": "#60a5fa"},
            "theme_extra": {"gradient": "linear-gradient(135deg, #1e40af, #2563eb, #60a5fa)", "particles": "clouds"},
        },
    }

    boss_meta = _VOCAB_BOSS.get(topic["id"], {})

    # Group words by syllable count
    buckets: dict[int, list[dict[str, Any]]] = {1: [], 2: [], 3: []}
    for phrase in topic["phrases"]:
        count = int(phrase.get("syllables") or 1)
        count = 1 if count < 1 else 3 if count > 3 else count
        buckets[count].append(phrase)

    def pick_bucket(count: int) -> list[dict[str, Any]]:
        if buckets[count]:
            return buckets[count]
        for fallback in (2, 1, 3):
            if buckets.get(fallback):
                return buckets[fallback]
        return []

    # Build structured levels with quizzes
    levels = []
    level_order = 1
    
    # For each syllable group (1, 2, 3)
    for syllable_group in [1, 2, 3]:
        pool = pick_bucket(syllable_group)
        if not pool:
            continue
            
        # Add 3 learning levels
        for i in range(3):
            levels.append({
                "id": f"{topic['id']}::level-{level_order}",
                "phrase_id": f"{topic['id']}::level-{level_order}",
                "order": level_order,
                "type": "word",
                "node_type": "learn",
                "label": f"{syllable_group}-syl",
                "description": f"Learn words with {syllable_group} syllable(s).",
                "tip": "Keep your hand centered and clearly visible in the frame.",
                "reward_xp": XP_PER_LEVEL,
                "syllable_count": syllable_group,
                "candidate_phrases": [
                    {
                        "id": phrase["id"],
                        "label": phrase["label"],
                        "word": phrase.get("word_id") or phrase["id"],
                        "description": phrase["description"],
                        "tip": phrase["tip"],
                        "syllables": phrase.get("syllables"),
                    }
                    for phrase in pool
                ],
            })
            level_order += 1
        
        # Add mini quiz after every 3 levels
        levels.append({
            "id": f"{topic['id']}::quiz-{syllable_group}",
            "phrase_id": f"{topic['id']}::quiz-{syllable_group}",
            "order": level_order,
            "type": "quiz",
            "node_type": "quiz",
            "label": f"Quiz: {syllable_group}-syl",
            "description": f"Test your knowledge of {syllable_group}-syllable words.",
            "tip": "Review the previous words if needed.",
            "reward_xp": 5,
            "syllable_count": syllable_group,
            "quiz_scope": [f"{topic['id']}::level-{level_order-3}", f"{topic['id']}::level-{level_order-2}", f"{topic['id']}::level-{level_order-1}"],
        })
        level_order += 1
    
    # Add boss battle at the end
    levels.append({
        "id": f"{topic['id']}::boss",
        "phrase_id": f"{topic['id']}::boss",
        "order": level_order,
        "type": "boss",
        "node_type": "boss",
        "label": "Boss Battle",
        "description": f"Defeat the {boss_meta.get('boss', {}).get('name', 'Island Boss')} to complete this island!",
        "tip": "You need 70% to pass. Review all words if needed.",
        "reward_xp": 30,
        "boss_scope": "all",  # Tests all words from the island
    })

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
