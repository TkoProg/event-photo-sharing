from datetime import date, datetime

from pydantic import BaseModel

from app.models.korisnik import UlogaKorisnika


class EventCreateRequest(BaseModel):
    naziv: str
    opis: str | None = None
    datum: date | None = None
    lokacija: str | None = None


class EventUpdateRequest(BaseModel):
    naziv: str | None = None
    opis: str | None = None
    datum: date | None = None
    lokacija: str | None = None
    aktivan: bool | None = None


class EventJoinRequest(BaseModel):
    kod: str


class EventResponse(BaseModel):
    id: int
    naziv: str
    opis: str | None
    datum: date | None
    lokacija: str | None
    kod: str
    aktivan: bool
    organizator_id: int
    broj_fotografija: int = 0
    broj_ucesnika: int = 0


class UcesnikResponse(BaseModel):
    id: int
    ime: str
    email: str
    uloga: UlogaKorisnika
    status: str
    pridruzen_at: datetime