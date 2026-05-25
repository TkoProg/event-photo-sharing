from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_lozinke(lozinka: str) -> str:
    return pwd_context.hash(lozinka)


def provjeri_lozinku(lozinka: str, lozinka_hash: str) -> bool:
    return pwd_context.verify(lozinka, lozinka_hash)


def kreiraj_access_token(korisnik_id: int) -> str:
    istice = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    payload = {
        "sub": str(korisnik_id),
        "exp": istice,
    }

    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)