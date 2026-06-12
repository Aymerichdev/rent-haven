from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from ..database import get_db
from ..models import Profile
from ..security import (
    hash_password, verify_password, create_access_token, create_refresh_token, decode_token
)
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: str = "tenant"  # admin | owner | tenant


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class RefreshBody(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class UpdateUserBody(BaseModel):
    password: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None


class ResetPasswordBody(BaseModel):
    email: EmailStr


def _user_dict(u: Profile) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "role": u.role,
        "avatar": u.avatar,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.post("/register", response_model=TokenPair)
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if body.role not in ("admin", "owner", "tenant"):
        raise HTTPException(400, "role inválido")
    if db.query(Profile).filter(Profile.email == body.email.lower()).first():
        raise HTTPException(409, "Ya existe una cuenta con ese email")
    user = Profile(
        email=body.email.lower(),
        name=body.name,
        role=body.role,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenPair(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
        user=_user_dict(user),
    )


@router.post("/login", response_model=TokenPair)
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")
    return TokenPair(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
        user=_user_dict(user),
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(body: RefreshBody, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token)
    except ValueError:
        raise HTTPException(401, "Refresh token inválido")
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Token incorrecto")
    user = db.query(Profile).filter(Profile.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(401, "Usuario no encontrado")
    return TokenPair(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
        user=_user_dict(user),
    )


@router.get("/me")
def me(user: Profile = Depends(get_current_user)):
    return _user_dict(user)


@router.patch("/me")
def update_me(body: UpdateUserBody, user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.password:
        user.password_hash = hash_password(body.password)
    if body.name is not None:
        user.name = body.name
    if body.avatar is not None:
        user.avatar = body.avatar
    db.commit()
    db.refresh(user)
    return _user_dict(user)


@router.post("/logout")
def logout():
    # Stateless JWT — client just discards tokens.
    return {"ok": True}


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, db: Session = Depends(get_db)):
    # Stub: real email flow requires SMTP. Returns ok so the UI can confirm.
    return {"ok": True, "message": "Si la cuenta existe, recibirás instrucciones."}
