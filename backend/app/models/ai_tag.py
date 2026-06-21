from datetime import datetime

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class AITag(SQLModel, table=True):
    __tablename__ = "ai_tagovi"
    __table_args__ = (
        Index("idx_fotografija_status", "fotografija_id", "status"),
        Index("idx_fotografija_tag", "fotografija_id", "tag_naziv"),
    )

    id: int | None = Field(default=None, primary_key=True)
    fotografija_id: int = Field(foreign_key="fotografije.id")
    tag_naziv: str
    pouzdanost: float
    status: str = "PENDING"
    kreiran_at: datetime = Field(default_factory=datetime.utcnow)
    azuriran_at: datetime = Field(default_factory=datetime.utcnow)


