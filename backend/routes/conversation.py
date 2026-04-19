"""Conversation (Reply Quest) routes — Phase 1.

Delegates all gesture inference to the existing dynamic model path; this
router only handles prompt selection, session state, attempt logging, and
response-level feedback copy.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel, Field

from data.conversation_prompts import (
    get_prompt,
    get_prompts_for_island,
)
from logging_config import get_logger
from models.schemas import GestureVerificationRequest
from routes.gesture import _verify_dynamic_internal
from services.supabase_store import get_store


router = APIRouter(prefix="/api/conversation", tags=["conversation"])
logger = get_logger("handspeak.routes.conversation")
store = get_store()


REPLY_QUEST_THRESHOLD = 0.40
REPLY_QUEST_TOP_K = 5


class SessionStartPayload(BaseModel):
    user_id: int
    island_id: str


class SessionSubmitPayload(BaseModel):
    session_id: int
    prompt_id: str
    user_id: Optional[int] = None
    frames: list[str] = Field(default_factory=list)


def _public_prompt(prompt: dict[str, Any]) -> dict[str, Any]:
    """Strip internal-only fields before returning a prompt to the frontend."""
    return {
        "id": prompt["id"],
        "island_id": prompt["island_id"],
        "order": prompt.get("order"),
        "prompt_text": prompt["prompt_text"],
        "expected_word": prompt["expected_word"],
        "acceptable_words": prompt.get("acceptable_words", [prompt["expected_word"]]),
        "intent_tag": prompt.get("intent_tag"),
        "coaching_tip": prompt.get("coaching_tip"),
    }


def _score_attempt(prompt: dict[str, Any], verification: Any) -> dict[str, Any]:
    """Map a gesture verification result + prompt into a scored attempt + feedback."""
    acceptable = {w.lower() for w in prompt.get("acceptable_words", [prompt["expected_word"]])}
    best_match = (verification.best_match or "").strip().lower()
    target_similarity = float(verification.target_similarity or 0.0)
    best_similarity = float(verification.similarity or 0.0)

    is_correct = bool(verification.is_match) and best_match in acceptable

    if is_correct:
        feedback_text = (
            f"Nice reply! You signed {verification.best_match.upper()} "
            f"(confidence {best_similarity:.2f})."
        )
    elif best_match and best_match != prompt["expected_word"].lower():
        feedback_text = (
            f"Close — the model read your sign as {verification.best_match.upper()}. "
            f"The expected reply was {prompt['expected_word'].upper()}."
        )
    else:
        feedback_text = (
            f"Try again. Aim for {prompt['expected_word'].upper()} — "
            f"{prompt.get('coaching_tip', 'hold the sign steady and centered.')}"
        )

    return {
        "is_correct": is_correct,
        "matched_word": verification.best_match,
        "confidence": best_similarity,
        "target_confidence": target_similarity,
        "feedback_text": feedback_text,
        "top_matches": [match.model_dump() for match in verification.top_matches],
    }


@router.get("/islands/{island_id}/prompts")
def list_prompts(island_id: str):
    prompts = get_prompts_for_island(island_id)
    if not prompts:
        raise HTTPException(status_code=404, detail=f"No prompts for island '{island_id}'")
    return [_public_prompt(p) for p in prompts]


@router.post("/session/start")
def start_session(payload: SessionStartPayload):
    prompts = get_prompts_for_island(payload.island_id)
    if not prompts:
        raise HTTPException(status_code=404, detail=f"No prompts for island '{payload.island_id}'")

    prompt_ids = [p["id"] for p in prompts]
    try:
        session = store.create_conversation_session(
            user_id=payload.user_id,
            island_id=payload.island_id,
            prompt_ids=prompt_ids,
        )
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    logger.info(
        "conversation_session_started user=%s island=%s session=%s prompts=%s",
        payload.user_id, payload.island_id, session["id"], len(prompt_ids),
    )

    return {
        "session_id": int(session["id"]),
        "island_id": session["island_id"],
        "status": session["status"],
        "prompts": [_public_prompt(p) for p in prompts],
    }


@router.post("/session/submit")
def submit_attempt(payload: SessionSubmitPayload):
    session = store.get_conversation_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    island_id = session["island_id"]
    prompt = get_prompt(island_id, payload.prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found for this island")

    if not payload.frames:
        raise HTTPException(status_code=400, detail="At least one frame is required")

    verify_request = GestureVerificationRequest(
        target_word=prompt["expected_word"],
        frames=payload.frames,
        model_type="dynamic",
        top_k=REPLY_QUEST_TOP_K,
        threshold=REPLY_QUEST_THRESHOLD,
        user_id=payload.user_id,
    )
    verification = _verify_dynamic_internal(verify_request)
    scored = _score_attempt(prompt, verification)

    try:
        store.append_conversation_attempt(
            session_id=payload.session_id,
            user_id=payload.user_id,
            prompt_id=payload.prompt_id,
            expected_word=prompt["expected_word"],
            matched_word=scored["matched_word"],
            is_correct=scored["is_correct"],
            confidence=scored["confidence"],
        )
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    total_prompts = len(session.get("prompt_ids") or [])
    attempts_so_far = len(session.get("attempts") or []) + 1
    correct_prompt_ids = {
        att["prompt_id"] for att in (session.get("attempts") or []) if att.get("is_correct")
    }
    if scored["is_correct"]:
        correct_prompt_ids.add(payload.prompt_id)

    session_completed = len(correct_prompt_ids) >= total_prompts and total_prompts > 0

    if session_completed:
        summary = {
            "total_prompts": total_prompts,
            "correct_prompts": len(correct_prompt_ids),
            "attempts_taken": attempts_so_far,
            "accuracy": len(correct_prompt_ids) / max(total_prompts, 1),
        }
        store.complete_conversation_session(payload.session_id, summary)

    if payload.user_id is not None:
        try:
            store.update_user_conversation_progress(
                user_id=payload.user_id,
                island_id=island_id,
                attempt_is_correct=scored["is_correct"],
                session_completed=session_completed,
                last_session_id=payload.session_id,
            )
        except RuntimeError:
            logger.exception("progress_update_failed user=%s session=%s", payload.user_id, payload.session_id)

    next_prompt_id = None
    if not session_completed:
        for prompt_id in session.get("prompt_ids") or []:
            if prompt_id not in correct_prompt_ids:
                next_prompt_id = prompt_id
                break

    return {
        "session_id": payload.session_id,
        "prompt_id": payload.prompt_id,
        "is_correct": scored["is_correct"],
        "matched_word": scored["matched_word"],
        "confidence": scored["confidence"],
        "feedback_text": scored["feedback_text"],
        "top_matches": scored["top_matches"],
        "session_completed": session_completed,
        "next_prompt_id": next_prompt_id,
        "correct_count": len(correct_prompt_ids),
        "total_count": total_prompts,
    }


@router.get("/session/{session_id}")
def get_session(session_id: int):
    session = store.get_conversation_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    island_id = session["island_id"]
    prompts_by_id = {p["id"]: p for p in get_prompts_for_island(island_id)}

    hydrated_prompts = []
    for prompt_id in session.get("prompt_ids") or []:
        prompt = prompts_by_id.get(prompt_id)
        if prompt:
            hydrated_prompts.append(_public_prompt(prompt))

    session["prompts"] = hydrated_prompts
    return session
