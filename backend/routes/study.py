from fastapi import APIRouter, HTTPException
from data.asl_data import STUDY_TOPICS, ALL_STUDY_PHRASES
from models.schemas import ProgressUpdate

router = APIRouter(prefix="/api/study", tags=["study"])

# In-memory progress store (replace with DB later)
_user_progress: dict = {}


@router.get("/topics")
def get_topics():
    return STUDY_TOPICS


@router.get("/topic/{topic_id}")
def get_topic(topic_id: str):
    for t in STUDY_TOPICS:
        if t["id"] == topic_id:
            return t
    raise HTTPException(status_code=404, detail="Chapter not found")


@router.get("/phrase/{phrase_id}")
def get_phrase(phrase_id: str):
    for p in ALL_STUDY_PHRASES:
        if p["id"] == phrase_id or p.get("word_id") == phrase_id:
            return p
    raise HTTPException(status_code=404, detail="Word not found")


@router.get("/progress/{user_id}")
def get_progress(user_id: int):
    return _user_progress.get(user_id, {
        "user_id": user_id,
        "completed_chapters": [],
        "current_chapter": STUDY_TOPICS[0]["id"] if STUDY_TOPICS else None,
        "completed_words": [],
        "level": 1,
        "xp": 0,
    })


@router.post("/progress/{user_id}")
def update_progress(user_id: int, body: ProgressUpdate):
    if user_id not in _user_progress:
        _user_progress[user_id] = {
            "user_id": user_id,
            "completed_chapters": [],
            "current_chapter": STUDY_TOPICS[0]["id"] if STUDY_TOPICS else None,
            "completed_words": [],
            "level": 1,
            "xp": 0,
        }
    prog = _user_progress[user_id]
    if body.word_id not in prog["completed_words"]:
        prog["completed_words"].append(body.word_id)
        prog["xp"] += 10
        prog["level"] = 1 + prog["xp"] // 50

    # Check if entire chapter is done
    for t in STUDY_TOPICS:
        if t["id"] == body.chapter_id:
            topic_word_ids = [p["id"] for p in t["phrases"]]
            if all(pid in prog["completed_words"] for pid in topic_word_ids):
                if body.chapter_id not in prog["completed_chapters"]:
                    prog["completed_chapters"].append(body.chapter_id)
            break

    return prog
