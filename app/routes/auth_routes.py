from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from core import auth
from core.auth import hash_password, create_access_token
from core.database import get_db
from models.user_model import User
from schemas.user_schema import UserResponse, TokenResponse, UserCreate

router = APIRouter(prefix="/auth", tags=["authorization"])

@router.post(
    path="/register",
    response_model=UserResponse,
    summary="Register a new user",
)
async def register_user(body: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email == body.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return UserResponse.model_validate(user)



@router.post(
    path="/login",
    response_model=TokenResponse,
    summary="Login a user",
)
async def login_user(body: UserCreate, db: AsyncSession = Depends(get_db)):

    result = await db.execute(
        select(User).where(User.email == body.email)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )


    if auth.verify_password(body.password, user.hashed_password) is False:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    token = create_access_token({"sub": body.email})
    return TokenResponse(access_token=token)




