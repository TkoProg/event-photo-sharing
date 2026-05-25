from sqlmodel import Session, select

from app.database import engine
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.services.auth_service import hash_lozinke


def seed_admin():
    with Session(engine) as session:
        postojeci = session.exec(
            select(Korisnik).where(Korisnik.email == "admin@example.com")
        ).first()

        if postojeci is not None:
            print("Admin vec postoji: admin@example.com")
            return

        admin = Korisnik(
            ime="Admin",
            email="admin@example.com",
            lozinka_hash=hash_lozinke("admin123"),
            uloga=UlogaKorisnika.ADMIN,
            jezik="bs",
            blokiran=False,
        )

        session.add(admin)
        session.commit()

    print("Admin kreiran: admin@example.com / admin123")


if __name__ == "__main__":
    seed_admin()
