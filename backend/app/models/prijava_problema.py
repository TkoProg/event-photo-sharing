from datetime import datetime
from enum import Enum

from sqlmodel import SQLModel, Field


class StatusPrijave(str, Enum):
    OTVORENO = "OTVORENO"
    RIJESENO = "RIJESENO"


class PrijavaProblema(SQLModel, table=True):
    __tablename__ = "prijavaproblema"

    id: int | None = Field(default=None, primary_key=True)

    email: str
    tip: str
    poruka: str
    status: StatusPrijave = StatusPrijave.OTVORENO

    korisnik_id: int | None = Field(default=None, foreign_key="korisnici.id")
    rijesio_admin_id: int | None = Field(default=None, foreign_key="korisnici.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rijeseno_at: datetime | None = None
