from datetime import datetime

from sqlmodel import Field, SQLModel


class Komentar(SQLModel, table=True):
    __tablename__ = "komentari"

    id: int | None = Field(default=None, primary_key=True)
    fotografija_id: int = Field(foreign_key="fotografije.id")
    korisnik_id: int = Field(foreign_key="korisnici.id")
    sadrzaj: str
    kreiran_at: datetime = Field(default_factory=datetime.utcnow)

