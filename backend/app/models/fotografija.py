from datetime import datetime

from sqlmodel import Field, SQLModel


class Fotografija(SQLModel, table=True):
    __tablename__ = "fotografije"

    id: int | None = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="eventi.id")
    korisnik_id: int = Field(foreign_key="korisnici.id")
    putanja: str
    originalni_naziv: str
    favorit: bool = False
    obrisana: bool = False
    vrijeme_uploada: datetime = Field(default_factory=datetime.utcnow)

