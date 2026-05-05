from fastapi import APIRouter, HTTPException
from models.schemas import (
    UserSignUp,
    UserSignIn,
    UserProfile,
    UserOut,
    GuestCreate,
    KidCreate,
    KidSignIn,
    AccountUpgrade,
)
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


@router.post("/guest", response_model=UserOut)
def create_guest(body: GuestCreate):
    try:
        user = store.create_guest_user(body.nickname)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return UserOut(**user)


@router.post("/kids", response_model=UserOut)
def create_kid(body: KidCreate):
    try:
        user = store.create_kid_user(body.nickname)
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


@router.post("/kids-signin", response_model=UserOut)
def kids_signin(body: KidSignIn):
    user = store.get_user_by_nickname(body.nickname)
    if not user or user.get("is_guest"):
        raise HTTPException(status_code=401, detail="Username not found")
    return UserOut(**user)


@router.put("/profile/{user_id}", response_model=UserOut)
def update_profile(user_id: int, body: UserProfile):
    try:
        user = store.update_profile(user_id, body.model_dump())
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except LookupError as error:
        raise HTTPException(status_code=404, detail="User not found") from error
    return UserOut(**user)


@router.put("/upgrade/{user_id}", response_model=UserOut)
def upgrade_account(user_id: int, body: AccountUpgrade):
    try:
        user = store.upgrade_account(user_id, body.email, body.password)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except LookupError as error:
        raise HTTPException(status_code=404, detail="User not found") from error
    return UserOut(**user)


@router.delete("/guest/{user_id}")
def delete_guest(user_id: int):
    try:
        store.delete_guest_user(user_id)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"ok": True}
