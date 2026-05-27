from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class Lajk(SQLModel, table=True):
    __tablename__ = "lajkovi"
    __table_args__ = (
        UniqueConstraint("fotografija_id", "korisnik_id", name="uq_lajk_fotografija_korisnik"),
    )

    id: int | None = Field(default=None, primary_key=True)
    fotografija_id: int = Field(foreign_key="fotografije.id")
    korisnik_id: int = Field(foreign_key="korisnici.id")
    kreiran_at: datetime = Field(default_factory=datetime.utcnow)

