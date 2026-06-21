from datetime import datetime

from pydantic import BaseModel


class TagCreateRequest(BaseModel):
    oznaceni_korisnik_id: int


class TagResponse(BaseModel):
    id: int
    fotografija_id: int
    oznaceni_korisnik_id: int
    oznacio_korisnik_id: int
    kreiran_at: datetime
    oznaceni_korisnik_ime: str | None = None


class AITagResponse(BaseModel):
    id: int
    fotografija_id: int
    tag_naziv: str
    pouzdanost: float
    status: str
    kreiran_at: datetime


class AITagBatchResponse(BaseModel):
    fotografija_id: int
    ai_tagovi: list[AITagResponse]


class AITagAcceptRequest(BaseModel):
    ai_tag_ids: list[int] | None = None  # None = prihvati sve


class FotografijaResponse(BaseModel):
    id: int
    event_id: int
    korisnik_id: int
    url: str
    tip_medija: str
    vrijeme_uploada: datetime
    broj_lajkova: int
    broj_komentara: int
    favorit: bool
    liked_by_me: bool
    tagovi: list[TagResponse] = []
    ai_tagovi: list[AITagResponse] = []
