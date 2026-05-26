from datetime import datetime

from pydantic import BaseModel


class KomentarCreateRequest(BaseModel):
    sadrzaj: str


class KomentarResponse(BaseModel):
    id: int
    fotografija_id: int
    korisnik_id: int
    ime_korisnika: str
    sadrzaj: str
    kreiran_at: datetime

