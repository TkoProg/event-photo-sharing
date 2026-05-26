from pydantic import BaseModel


class AdminStatsResponse(BaseModel):
    broj_korisnika: int
    broj_eventa: int
    broj_fotografija: int
    broj_komentara: int
    broj_lajkova: int
    broj_albuma: int


class AdminBlockUserRequest(BaseModel):
    blokiran: bool

