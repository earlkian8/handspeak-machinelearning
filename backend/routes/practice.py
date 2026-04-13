from fastapi import APIRouter, HTTPException
from data.asl_data import ALL_PRACTICE_SIGNS, VOCABULARY_BY_ID

router = APIRouter(prefix="/api/practice", tags=["practice"])


@router.get("/alphabet")
def get_alphabet():
    return ALL_PRACTICE_SIGNS[:26]


@router.get("/numbers")
def get_numbers():
    return []


@router.get("/all")
def get_all_practice():
    return ALL_PRACTICE_SIGNS


@router.get("/words")
def get_words():
    return ALL_PRACTICE_SIGNS


@router.get("/sign/{sign_id}")
def get_sign(sign_id: str):
    word = VOCABULARY_BY_ID.get(sign_id.lower())
    if word:
        return word
    raise HTTPException(status_code=404, detail="Word not found")


@router.get("/word/{word_id}")
def get_word(word_id: str):
    word = VOCABULARY_BY_ID.get(word_id.lower())
    if word:
        return word
    raise HTTPException(status_code=404, detail="Word not found")
