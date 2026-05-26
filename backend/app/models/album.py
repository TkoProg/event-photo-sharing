from datetime import datetime
from enum import Enum

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class TipAlbuma(str, Enum):
    OBICNI = "OBICNI"
    FINALNI = "FINALNI"


class Album(SQLModel, table=True):
    __tablename__ = "albumi"

    id: int | None = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="eventi.id")
    naziv: str
    opis: str | None = None
    tip: TipAlbuma = TipAlbuma.OBICNI
    share_code: str | None = Field(default=None, index=True)
    javno: bool = False
    kreiran_at: datetime = Field(default_factory=datetime.utcnow)


class AlbumFotografija(SQLModel, table=True):
    __tablename__ = "album_fotografije"
    __table_args__ = (
        UniqueConstraint("album_id", "fotografija_id", name="uq_album_fotografija"),
    )

    id: int | None = Field(default=None, primary_key=True)
    album_id: int = Field(foreign_key="albumi.id")
    fotografija_id: int = Field(foreign_key="fotografije.id")

