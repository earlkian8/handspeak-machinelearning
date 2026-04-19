from fastapi import APIRouter, HTTPException
from models.schemas import UserSignUp, UserSignIn, UserProfile, UserOut
from services.supabase_store import get_store

router = APIRouter(prefix="/api/auth", tags=["auth"])

store = get_store()


@router.post("/signup", response_model=UserOut)
def signup(body: UserSignUp):
    try:
        user = store.create_user(body.email, body.password)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return UserOut(**user)


@router.post("/signin", response_model=UserOut)
def signin(body: UserSignIn):
    try:
        user = store.verify_credentials(body.email, body.password)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return UserOut(**user)


@router.put("/profile/{user_id}", response_model=UserOut)
def update_profile(user_id: int, body: UserProfile):
    try:
        user = store.update_profile(user_id, body.model_dump())
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except LookupError as error:
        raise HTTPException(status_code=404, detail="User not found") from error
    return UserOut(**user)
