from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class Tag(SQLModel, table=True):
    __tablename__ = "tagovi"
    __table_args__ = (
        UniqueConstraint(
            "fotografija_id",
            "oznaceni_korisnik_id",
            name="uq_tag_fotografija_korisnik",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    fotografija_id: int = Field(foreign_key="fotografije.id")
    oznaceni_korisnik_id: int = Field(foreign_key="korisnici.id")
    oznacio_korisnik_id: int = Field(foreign_key="korisnici.id")
    kreiran_at: datetime = Field(default_factory=datetime.utcnow)

