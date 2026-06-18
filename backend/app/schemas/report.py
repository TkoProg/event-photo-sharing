from datetime import datetime
from pydantic import BaseModel, EmailStr


class ReportCreate(BaseModel):
    email: EmailStr
    tip: str
    poruka: str


class ReportResponse(BaseModel):
    id: int
    email: str
    tip: str
    poruka: str
    korisnik_id: int | None
    created_at: datetime