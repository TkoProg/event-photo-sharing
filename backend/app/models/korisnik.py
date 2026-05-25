from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class UlogaKorisnika(str, Enum):
    ADMIN = "ADMIN"
    ORGANIZATOR = "ORGANIZATOR"
    GOST = "GOST"


class Korisnik(SQLModel, table=True):
    __tablename__ = "korisnici"

    id: int | None = Field(default=None, primary_key=True)
    ime: str
    email: str = Field(index=True, unique=True)
    lozinka_hash: str
    uloga: UlogaKorisnika
    jezik: str = "bs"
    blokiran: bool = False
    kreiran_at: datetime = Field(default_factory=datetime.utcnow)