from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from data.achievements import ACHIEVEMENTS, get_by_id
from services.supabase_store import get_store

router = APIRouter(prefix="/api/rewards", tags=["rewards"])
store = get_store()

# XP granted per activity type
XP_TABLE = {
    "quiz":            5,
    "quiz_perfect":    10,   # bonus on top of quiz base
    "daily":           15,
    "match":           8,
    "match_perfect":   5,    # bonus on top of match base
    "converse_session": 20,
}


class ActivityPayload(BaseModel):
    user_id: int
    activity_type: str          # quiz | daily | match | converse_session
    score: Optional[int] = None
    total: Optional[int] = None
    misses: Optional[int] = None
    streak: Optional[int] = None


def _check_achievements(
    user_id: int,
    activity_type: str,
    payload: ActivityPayload,
    earned: set,
    new_xp: int,
    new_level: int,
    activity_counts: dict,
) -> list[dict]:
    """Return list of newly unlocked achievement dicts."""
    newly_earned = []

    def try_award(achievement_id: str) -> bool:
        if achievement_id in earned:
            return False
        awarded = store.award_achievement(user_id, achievement_id)
        if awarded:
            defn = get_by_id(achievement_id)
            if defn:
                newly_earned.append(defn)
                earned.add(achievement_id)
            return True
        return False

    is_perfect_quiz = (activity_type == "quiz" and payload.score is not None
                       and payload.total is not None and payload.score == payload.total)
    is_perfect_match = activity_type == "match" and payload.misses == 0

    # First-time achievements
    if activity_type == "quiz":
        try_award("first_quiz")
    if activity_type == "daily":
        try_award("first_daily")
    if activity_type == "match":
        try_award("first_match")
    if activity_type == "converse_session":
        try_award("first_converse")

    # Quiz mastery
    if is_perfect_quiz:
        try_award("quiz_perfect")
    quiz_count = activity_counts.get("quiz", 0)
    if quiz_count >= 10:
        try_award("quiz_10")

    # Match mastery
    if is_perfect_match:
        try_award("match_perfect")
    match_count = activity_counts.get("match", 0)
    if match_count >= 10:
        try_award("match_10")

    # Streaks
    streak = payload.streak or 0
    if streak >= 3:
        try_award("streak_3")
    if streak >= 7:
        try_award("streak_7")
    if streak >= 30:
        try_award("streak_30")

    # XP milestones
    if new_xp >= 50:
        try_award("xp_50")
    if new_xp >= 200:
        try_award("xp_200")
    if new_xp >= 500:
        try_award("xp_500")

    # Level milestones
    if new_level >= 5:
        try_award("level_5")
    if new_level >= 10:
        try_award("level_10")

    return newly_earned


@router.post("/activity")
def record_activity(payload: ActivityPayload):
    """Grant XP for a completed activity and return any newly earned achievements."""
    user_id = payload.user_id
    activity_type = payload.activity_type

    # Calculate XP to grant
    xp = XP_TABLE.get(activity_type, 0)
    if activity_type == "quiz" and payload.score == payload.total and payload.total:
        xp += XP_TABLE["quiz_perfect"]
    if activity_type == "match" and payload.misses == 0:
        xp += XP_TABLE["match_perfect"]

    # Grant XP
    updated = store.grant_xp(user_id, xp)
    new_xp = updated["xp"]
    new_level = updated["level"]

    # Increment activity counter
    count_key = activity_type.split("_")[0]   # "quiz", "match", "daily", "converse"
    new_count = store.increment_activity(user_id, count_key)
    # Re-read all counts for achievement checks
    activity_counts = store.get_activity_counts(user_id)
    activity_counts[count_key] = new_count

    # Load already-earned achievements
    earned = set(store.get_user_achievements(user_id))

    # Check + award new achievements
    new_achievements = _check_achievements(
        user_id, activity_type, payload, earned, new_xp, new_level, activity_counts
    )

    # Grant bonus XP from achievement rewards (non-recursive categories only)
    bonus_xp = sum(a.get("xp_bonus", 0) for a in new_achievements)
    if bonus_xp > 0:
        updated = store.grant_xp(user_id, bonus_xp)
        new_xp = updated["xp"]
        new_level = updated["level"]

    old_level = new_level - (1 if (new_xp - xp - bonus_xp) // 50 < (new_xp // 50) else 0)

    return {
        "xp_granted": xp + bonus_xp,
        "new_total_xp": new_xp,
        "new_level": new_level,
        "leveled_up": new_level > max(1, (new_xp - xp - bonus_xp) // 50 + 1),
        "new_achievements": new_achievements,
    }


@router.get("/achievements/{user_id}")
def get_achievements(user_id: int):
    """Return all achievements with earned status for a user."""
    earned_ids = set(store.get_user_achievements(user_id))
    result = []
    for a in ACHIEVEMENTS:
        result.append({**a, "earned": a["id"] in earned_ids})
    return result
