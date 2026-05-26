from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models.event import Event, EventUcesnik
from app.models.fotografija import Fotografija
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.routers.auth import get_trenutni_korisnik
from app.routers.helpers import fotografija_u_response
from app.schemas.fotografija import FotografijaResponse


router = APIRouter(tags=["Feed"])


@router.get("/feed", response_model=list[FotografijaResponse])
def feed(
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    fotografije = []

    if korisnik.uloga == UlogaKorisnika.ADMIN:
        fotografije = session.exec(
            select(Fotografija)
            .where(Fotografija.obrisana == False)
            .order_by(Fotografija.vrijeme_uploada.desc())
        ).all()

    elif korisnik.uloga == UlogaKorisnika.ORGANIZATOR:
        eventi = session.exec(
            select(Event).where(Event.organizator_id == korisnik.id)
        ).all()

        for event in eventi:
            slike = session.exec(
                select(Fotografija)
                .where(
                    Fotografija.event_id == event.id,
                    Fotografija.obrisana == False,
                )
                .order_by(Fotografija.vrijeme_uploada.desc())
            ).all()

            for slika in slike:
                fotografije.append(slika)

    else:
        ucesca = session.exec(
            select(EventUcesnik).where(
                EventUcesnik.korisnik_id == korisnik.id,
                EventUcesnik.status == "AKTIVAN",
            )
        ).all()

        for ucesce in ucesca:
            slike = session.exec(
                select(Fotografija)
                .where(
                    Fotografija.event_id == ucesce.event_id,
                    Fotografija.obrisana == False,
                )
                .order_by(Fotografija.vrijeme_uploada.desc())
            ).all()

            for slika in slike:
                fotografije.append(slika)

    fotografije.sort(key=lambda foto: foto.vrijeme_uploada, reverse=True)

    rezultat = []

    for foto in fotografije:
        rezultat.append(fotografija_u_response(session, foto, korisnik))

    return rezultat


