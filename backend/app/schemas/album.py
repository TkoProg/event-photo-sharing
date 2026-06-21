from pydantic import BaseModel

from app.models.album import TipAlbuma
from app.schemas.fotografija import FotografijaResponse


class AlbumCreateRequest(BaseModel):
    event_id: int
    naziv: str
    opis: str | None = None
    tip: TipAlbuma = TipAlbuma.OBICNI


class AlbumAddPhotoRequest(BaseModel):
    fotografija_id: int


class AlbumResponse(BaseModel):
    id: int
    event_id: int
    naziv: str
    opis: str | None
    tip: TipAlbuma
    share_code: str | None
    javno: bool
    broj_fotografija: int


class AlbumDetailResponse(BaseModel):
    fotografije: list[FotografijaResponse]
    javno: bool
    share_code: str | None = None
