from datetime import date, datetime

from sqlmodel import Field, SQLModel


class Event(SQLModel, table=True):
    __tablename__ = "eventi"

    id: int | None = Field(default=None, primary_key=True)
    naziv: str
    opis: str | None = None
    datum: date | None = None
    lokacija: str | None = None
    kod: str = Field(index=True, unique=True)
    aktivan: bool = True
    organizator_id: int = Field(foreign_key="korisnici.id")
    kreiran_at: datetime = Field(default_factory=datetime.utcnow)


class EventUcesnik(SQLModel, table=True):
    __tablename__ = "event_ucesnici"

    id: int | None = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="eventi.id")
    korisnik_id: int = Field(foreign_key="korisnici.id")
    status: str = "AKTIVAN"
    pridruzen_at: datetime = Field(default_factory=datetime.utcnow)