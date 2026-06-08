from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.album import Album
from app.models.event import Event
from app.models.fotografija import Fotografija
from app.models.komentar import Komentar
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.models.lajk import Lajk
from app.routers.auth import get_trenutni_korisnik
from app.routers.events import event_u_response
from app.routers.helpers import fotografija_u_response
from app.schemas.admin import AdminBlockUserRequest, AdminStatsResponse
from app.schemas.auth import KorisnikResponse
from app.schemas.event import EventResponse
from app.schemas.fotografija import FotografijaResponse


router = APIRouter(prefix="/admin", tags=["Admin"])


def korisnik_u_response(korisnik: Korisnik) -> KorisnikResponse:
    return KorisnikResponse(
        id=korisnik.id,
        ime=korisnik.ime,
        email=korisnik.email,
        uloga=korisnik.uloga,
        jezik=korisnik.jezik,
        blokiran=korisnik.blokiran,
    )


def zahtijevaj_admina(korisnik: Korisnik = Depends(get_trenutni_korisnik)) -> Korisnik:
    if korisnik.uloga != UlogaKorisnika.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ERR_UNAUTHORIZED_ACTION",
        )

    return korisnik


@router.get("/stats", response_model=AdminStatsResponse)
def admin_stats(
    session: Session = Depends(get_session),
    _: Korisnik = Depends(zahtijevaj_admina),
):
    korisnici = session.exec(select(Korisnik)).all()
    eventi = session.exec(select(Event)).all()
    fotografije = session.exec(select(Fotografija)).all()
    komentari = session.exec(select(Komentar)).all()
    lajkovi = session.exec(select(Lajk)).all()
    albumi = session.exec(select(Album)).all()

    return AdminStatsResponse(
        broj_korisnika=len(korisnici),
        broj_eventa=len(eventi),
        broj_fotografija=len(fotografije),
        broj_komentara=len(komentari),
        broj_lajkova=len(lajkovi),
        broj_albuma=len(albumi),
    )


@router.get("/users", response_model=list[KorisnikResponse])
def admin_users(
    session: Session = Depends(get_session),
    _: Korisnik = Depends(zahtijevaj_admina),
):
    korisnici = session.exec(select(Korisnik)).all()

    rezultat = []

    for korisnik in korisnici:
        rezultat.append(korisnik_u_response(korisnik))

    return rezultat


@router.put("/users/{korisnik_id}/block", response_model=KorisnikResponse)
def admin_blokiraj_korisnika(
    korisnik_id: int,
    podaci: AdminBlockUserRequest,
    session: Session = Depends(get_session),
    admin: Korisnik = Depends(zahtijevaj_admina),
):
    if admin.id == korisnik_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_CANNOT_BLOCK_SELF",
        )

    korisnik = session.get(Korisnik, korisnik_id)

    if korisnik is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ERR_USER_NOT_FOUND",
        )

    korisnik.blokiran = podaci.blokiran
    session.add(korisnik)
    session.commit()
    session.refresh(korisnik)

    return korisnik_u_response(korisnik)


@router.get("/events", response_model=list[EventResponse])
def admin_eventi(
    session: Session = Depends(get_session),
    _: Korisnik = Depends(zahtijevaj_admina),
):
    eventi = session.exec(select(Event)).all()

    rezultat = []

    for event in eventi:
        rezultat.append(event_u_response(session, event))

    return rezultat


@router.get("/photos", response_model=list[FotografijaResponse])
def admin_fotografije(
    session: Session = Depends(get_session),
    admin: Korisnik = Depends(zahtijevaj_admina),
):
    fotografije = session.exec(select(Fotografija)).all()

    rezultat = []

    for foto in fotografije:
        rezultat.append(fotografija_u_response(session, foto, admin))

    return rezultat