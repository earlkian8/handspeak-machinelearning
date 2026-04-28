"""Conversation prompt seed content for Reply Quest (Phase 1).

Every prompt's expected_word and acceptable_words must exist in
model/words.txt so the dynamic gesture model can recognize them.
"""

from __future__ import annotations

from typing import Any

from data.asl_data import VOCABULARY_BY_ID


GREETINGS_ISLAND_ID = "greetings"


GREETINGS_PROMPTS: list[dict[str, Any]] = [
    {
        "id": "greet-2",
        "island_id": GREETINGS_ISLAND_ID,
        "order": 2,
        "situation": "school",
        "prompt_text": "A friend signs GOOD MORNING. Reply with MORNING.",
        "expected_word": "morning",
        "acceptable_words": ["morning"],
        "intent_tag": "greet-open",
        "response_type": "greet-open",
        "coaching_tip": "Non-dominant arm horizontal, dominant arm rises like a sunrise.",
    },
    {
        "id": "greet-4",
        "island_id": GREETINGS_ISLAND_ID,
        "order": 4,        "situation": "school",        "prompt_text": "They ask HOW ARE YOU? You feel down — reply honestly.",
        "expected_word": "sad",
        "acceptable_words": ["sad"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "Both hands, palms toward face, drift downward with a soft expression.",
    },
    {
        "id": "greet-6",
        "island_id": GREETINGS_ISLAND_ID,
        "order": 6,
        "situation": "school",
        "prompt_text": "A classmate waves goodbye as they leave. Return the farewell.",
        "expected_word": "bye",
        "acceptable_words": ["bye", "later"],
        "intent_tag": "greet-close",
        "response_type": "greet-close",
        "coaching_tip": "Simple wave — open hand, fingers flexing together.",
    },
    {
        "id": "greet-7",
        "island_id": GREETINGS_ISLAND_ID,
        "order": 7,
        "situation": "school",
        "prompt_text": "You'll see a friend after school. Tell them you'll see them LATER.",
        "expected_word": "later",
        "acceptable_words": ["later", "bye"],
        "intent_tag": "greet-close",
        "response_type": "greet-close",
        "coaching_tip": "L-hand, rotate forward on the palm.",
    },
    {
        "id": "greet-8",
        "island_id": GREETINGS_ISLAND_ID,
        "order": 8,        "situation": "store",        "prompt_text": "A friend asks WANT ICE CREAM? You do — reply.",
        "expected_word": "yes",
        "acceptable_words": ["yes"],
        "intent_tag": "confirm",
        "response_type": "confirm",
        "coaching_tip": "Fist nodding up and down like a head nodding yes.",
    },
]

REPAIR_PROMPTS: list[dict[str, Any]] = [
    {
        "id": "repair-3",
        "island_id": "repair",
        "order": 3,
        "situation": "misunderstanding",
        "prompt_text": "The NPC misunderstood you. Politely say NO to reset the conversation.",
        "expected_word": "no",
        "acceptable_words": ["no"],
        "intent_tag": "repair",
        "response_type": "repair",
        "coaching_tip": "Index and middle fingers tap the thumb rapidly.",
    },
    {
        "id": "repair-4",
        "island_id": "repair",
        "order": 4,
        "situation": "lost",
        "prompt_text": "You're confused about where the conversation is heading. Ask WHERE.",
        "expected_word": "where",
        "acceptable_words": ["where"],
        "intent_tag": "clarify",
        "response_type": "clarify",
        "coaching_tip": "Index finger pointing up, shaking side to side.",
    },
    {
        "id": "repair-5",
        "island_id": "repair",
        "order": 5,
        "situation": "unclear",
        "prompt_text": "Ask WHO the NPC is talking about because you're lost.",
        "expected_word": "who",
        "acceptable_words": ["who"],
        "intent_tag": "clarify",
        "response_type": "clarify",
        "coaching_tip": "Thumb on chin, index finger wiggling up and down.",
    },
]

CONVERSE_PROMPTS: list[dict[str, Any]] = [
    {
        "id": "converse-1",
        "island_id": "converse",
        "order": 1,
        "situation": "school",
        "prompt_text": "Your classmate smiles and says: \"Good morning!\" — reply.",
        "expected_word": "morning",
        "acceptable_words": ["morning"],
        "intent_tag": "greet-open",
        "response_type": "greet-open",
        "coaching_tip": "Non-dominant arm horizontal, dominant arm rises like a sunrise.",
    },
    {
        "id": "converse-2",
        "island_id": "converse",
        "order": 2,
        "situation": "school",
        "prompt_text": "Your teacher waves and says: \"Goodbye, see you tomorrow!\" — reply.",
        "expected_word": "bye",
        "acceptable_words": ["bye", "later"],
        "intent_tag": "greet-close",
        "response_type": "greet-close",
        "coaching_tip": "Simple wave — open hand, fingers flexing together.",
    },
    {
        "id": "converse-3",
        "island_id": "converse",
        "order": 3,
        "situation": "school",
        "prompt_text": "A friend says: \"See you later!\" — reply with LATER.",
        "expected_word": "later",
        "acceptable_words": ["later", "bye"],
        "intent_tag": "greet-close",
        "response_type": "greet-close",
        "coaching_tip": "L-hand, rotate forward on the palm.",
    },
    {
        "id": "converse-4",
        "island_id": "converse",
        "order": 4,
        "situation": "school",
        "prompt_text": "Someone asks: \"How are you feeling today?\" You're feeling sad.",
        "expected_word": "sad",
        "acceptable_words": ["sad"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "Both hands, palms toward face, drift downward with a soft expression.",
    },
    {
        "id": "converse-5",
        "island_id": "converse",
        "order": 5,
        "situation": "school",
        "prompt_text": "Your friend asks: \"What's wrong? You don't look happy.\" You're angry.",
        "expected_word": "mad",
        "acceptable_words": ["mad"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "Clawed hands near the chest, pull outward with tension in your face.",
    },
    {
        "id": "converse-6",
        "island_id": "converse",
        "order": 6,
        "situation": "store",
        "prompt_text": "Your mom says: \"You look pale. Are you okay?\" You're sick.",
        "expected_word": "sick",
        "acceptable_words": ["sick"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "Middle finger touches forehead, other middle finger touches stomach.",
    },
    {
        "id": "converse-7",
        "island_id": "converse",
        "order": 7,
        "situation": "school",
        "prompt_text": "It's a hot afternoon. Someone asks: \"How do you feel?\" — reply.",
        "expected_word": "hot",
        "acceptable_words": ["hot"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "Open hand near mouth, rotate outward like releasing heat.",
    },
    {
        "id": "converse-8",
        "island_id": "converse",
        "order": 8,
        "situation": "school",
        "prompt_text": "It's been hours since lunch. A friend asks: \"What do you need?\"",
        "expected_word": "hungry",
        "acceptable_words": ["hungry"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "C-hand moves down the chest, like food going down.",
    },
    {
        "id": "converse-9",
        "island_id": "converse",
        "order": 9,
        "situation": "store",
        "prompt_text": "Your throat is dry. A friend asks: \"What's wrong?\" — tell them.",
        "expected_word": "thirsty",
        "acceptable_words": ["thirsty"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "Index finger traces down the throat from chin to chest.",
    },
    {
        "id": "converse-10",
        "island_id": "converse",
        "order": 10,
        "situation": "school",
        "prompt_text": "A friend asks: \"Want some milk?\" — yes, you do!",
        "expected_word": "yes",
        "acceptable_words": ["yes"],
        "intent_tag": "confirm",
        "response_type": "confirm",
        "coaching_tip": "Fist nodding up and down like a head nodding yes.",
    },
    {
        "id": "converse-11",
        "island_id": "converse",
        "order": 11,
        "situation": "store",
        "prompt_text": "Someone asks: \"Did you break that?\" You didn't — say no.",
        "expected_word": "no",
        "acceptable_words": ["no"],
        "intent_tag": "deny",
        "response_type": "deny",
        "coaching_tip": "Index and middle fingers tap the thumb rapidly.",
    },
    {
        "id": "converse-12",
        "island_id": "converse",
        "order": 12,
        "situation": "school",
        "prompt_text": "A classmate asks: \"Where did your mom go?\" She went home.",
        "expected_word": "home",
        "acceptable_words": ["home"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "Fingertips of flat hand touch cheek twice near the mouth.",
    },
    {
        "id": "converse-13",
        "island_id": "converse",
        "order": 13,
        "situation": "school",
        "prompt_text": "Someone asks: \"Who told you that?\" — ask them back: WHO?",
        "expected_word": "who",
        "acceptable_words": ["who"],
        "intent_tag": "clarify",
        "response_type": "clarify",
        "coaching_tip": "Thumb on chin, index finger wiggling up and down.",
    },
    {
        "id": "converse-14",
        "island_id": "converse",
        "order": 14,
        "situation": "school",
        "prompt_text": "Your dad asks: \"When should we leave?\" — right now!",
        "expected_word": "now",
        "acceptable_words": ["now"],
        "intent_tag": "confirm",
        "response_type": "confirm",
        "coaching_tip": "Both Y-hands drop down sharply in front of you.",
    },
    {
        "id": "converse-15",
        "island_id": "converse",
        "order": 15,
        "situation": "school",
        "prompt_text": "Your teacher asks: \"When did this happen?\" — it was yesterday.",
        "expected_word": "yesterday",
        "acceptable_words": ["yesterday"],
        "intent_tag": "react",
        "response_type": "react",
        "coaching_tip": "A-hand touches the cheek, then arcs backward over the shoulder.",
    },
]


def _validate_prompts_against_vocab() -> None:
    """Fail fast at import time if a prompt references a word the model cannot recognize."""
    missing: list[str] = []
    for prompt in GREETINGS_PROMPTS + REPAIR_PROMPTS + CONVERSE_PROMPTS:
        words = {prompt["expected_word"], *prompt.get("acceptable_words", [])}
        for word in words:
            if word.lower() not in VOCABULARY_BY_ID:
                missing.append(f"{prompt['id']}:{word}")
    if missing:
        raise RuntimeError(
            "conversation_prompts references vocabulary not present in model/words.txt: "
            + ", ".join(missing)
        )


_validate_prompts_against_vocab()


PROMPTS_BY_ISLAND: dict[str, list[dict[str, Any]]] = {
    GREETINGS_ISLAND_ID: GREETINGS_PROMPTS,
    "repair": REPAIR_PROMPTS,
    "converse": CONVERSE_PROMPTS,
}


def get_prompts_for_island(island_id: str) -> list[dict[str, Any]]:
    return list(PROMPTS_BY_ISLAND.get(island_id, []))


def get_prompt(island_id: str, prompt_id: str) -> dict[str, Any] | None:
    actual_island_id = "repair" if prompt_id.startswith("repair-") else island_id
    for prompt in PROMPTS_BY_ISLAND.get(actual_island_id, []):
        if prompt["id"] == prompt_id:
            return prompt
    return None
