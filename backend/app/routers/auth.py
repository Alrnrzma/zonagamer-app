import time
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models import AppUser

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterInput(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: str | None = None
    role: str = "user"


class LoginInput(BaseModel):
    email: EmailStr
    password: str


def user_to_dict(user: AppUser):
    return {
        "id": user.id,
        "nombre": user.nombre,
        "email": user.email,
        "telefono": user.telefono,
        "role": user.role,
        "status": user.status,
        "createdAt": user.created_at,
        "updatedAt": user.updated_at,
    }


@router.post("/register")
def register(input: RegisterInput, db: Session = Depends(get_db)):
    email = input.email.strip().lower()

    if len(input.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    existing = db.query(AppUser).filter(AppUser.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ese correo ya está registrado")

    now = int(time.time() * 1000)

    user = AppUser(
        id=str(uuid.uuid4()),
        nombre=input.nombre.strip(),
        email=email,
        telefono=input.telefono.strip() if input.telefono else None,
        password_hash=pwd_context.hash(input.password),
        role=input.role if input.role in ["admin", "user", "associated"] else "user",
        status="active",
        created_at=now,
        updated_at=now,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "ok": True,
        "user": user_to_dict(user),
    }


@router.post("/login")
def login(input: LoginInput, db: Session = Depends(get_db)):
    email = input.email.strip().lower()

    user = db.query(AppUser).filter(AppUser.email == email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    if user.status != "active":
        raise HTTPException(status_code=403, detail="Tu cuenta está deshabilitada")

    if not pwd_context.verify(input.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    return {
        "ok": True,
        "user": user_to_dict(user),
    }