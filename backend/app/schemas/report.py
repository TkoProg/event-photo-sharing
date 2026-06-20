from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.prijava_problema import StatusPrijave


class ReportCreate(BaseModel):
    email: EmailStr
    tip: str
    poruka: str


class ReportStatusUpdate(BaseModel):
    status: StatusPrijave


class ReportResponse(BaseModel):
    id: int
    email: str
    tip: str
    poruka: str
    status: StatusPrijave
    korisnik_id: int | None
    rijesio_admin_id: int | None
    created_at: datetime
    rijeseno_at: datetime | None
