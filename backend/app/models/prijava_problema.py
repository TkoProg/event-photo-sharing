from datetime import datetime
from sqlmodel import SQLModel, Field


class PrijavaProblema(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    email: str
    tip: str
    poruka: str

    korisnik_id: int | None = Field(default=None, foreign_key="korisnik.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)