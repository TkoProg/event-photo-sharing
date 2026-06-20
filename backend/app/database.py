from sqlalchemy import inspect, text
from sqlmodel import SQLModel, Session, create_engine

from app.config import settings


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)


def kreiraj_tabele():
    SQLModel.metadata.create_all(engine)
    primijeni_lokalne_migracije()


def primijeni_lokalne_migracije():
    inspector = inspect(engine)

    if "prijavaproblema" not in inspector.get_table_names():
        return

    kolone = {kolona["name"] for kolona in inspector.get_columns("prijavaproblema")}

    with engine.begin() as connection:
        if "status" not in kolone:
            connection.execute(
                text("ALTER TABLE prijavaproblema ADD COLUMN status VARCHAR NOT NULL DEFAULT 'OTVORENO'")
            )

        if "rijesio_admin_id" not in kolone:
            connection.execute(text("ALTER TABLE prijavaproblema ADD COLUMN rijesio_admin_id INTEGER"))

        if "rijeseno_at" not in kolone:
            connection.execute(text("ALTER TABLE prijavaproblema ADD COLUMN rijeseno_at DATETIME"))


def get_session():
    with Session(engine) as session:
        yield session
