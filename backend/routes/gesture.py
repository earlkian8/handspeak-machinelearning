from fastapi import APIRouter, HTTPException

from data.asl_data import ALL_PRACTICE_SIGNS, VOCABULARY_BY_ID
from models.schemas import GestureVerificationRequest, GestureVerificationResponse, GestureMatch
from services.gesture_recognition import get_gesture_service


router = APIRouter(prefix="/api/gesture", tags=["gesture"])


@router.get("/words")
def get_words():
    return ALL_PRACTICE_SIGNS


@router.get("/word/{word_id}")
def get_word(word_id: str):
    word = VOCABULARY_BY_ID.get(word_id.lower())
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return word


@router.post("/verify", response_model=GestureVerificationResponse)
def verify_gesture(body: GestureVerificationRequest):
    service = get_gesture_service()

    try:
        result = service.verify(
            target_word=body.target_word,
            frame_data=body.frames or ([body.image] if body.image else []),
            top_k=body.top_k,
            threshold=body.threshold,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Target word not found in model vocabulary")
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Gesture verification failed: {error}") from error

    return GestureVerificationResponse(
        target_word=result["target_word"],
        best_match=result["best_match"],
        similarity=result["similarity"],
        target_similarity=result["target_similarity"],
        threshold=result["threshold"],
        is_match=result["is_match"],
        top_matches=[GestureMatch(**match) for match in result["top_matches"]],
        message=result["message"],
    )