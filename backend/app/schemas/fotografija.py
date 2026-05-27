from datetime import datetime

from pydantic import BaseModel


class FotografijaResponse(BaseModel):
    id: int
    event_id: int
    korisnik_id: int
    url: str
    vrijeme_uploada: datetime
    broj_lajkova: int
    broj_komentara: int
    favorit: bool
    liked_by_me: bool


class TagCreateRequest(BaseModel):
    oznaceni_korisnik_id: int


class TagResponse(BaseModel):
    id: int
    fotografija_id: int
    oznaceni_korisnik_id: int
    oznacio_korisnik_id: int
    kreiran_at: datetime

