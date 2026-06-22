from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.album import Album, AlbumFotografija
from app.models.event import Event, EventUcesnik
from app.models.fotografija import Fotografija
from app.models.komentar import Komentar
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.models.lajk import Lajk
from app.models.prijava_problema import PrijavaProblema
from app.models.tag import Tag
from app.routers.auth import get_trenutni_korisnik
from app.routers.events import event_odgovara_pretrazi, event_u_response, normalizuj_pretragu
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


def korisnik_odgovara_pretrazi(korisnik: Korisnik, pretraga: str | None) -> bool:
    if pretraga is None:
        return True

    ime = korisnik.ime.lower()
    email = korisnik.email.lower()

    return pretraga in ime or pretraga in email


def zahtijevaj_admina(korisnik: Korisnik = Depends(get_trenutni_korisnik)) -> Korisnik:
    if korisnik.uloga != UlogaKorisnika.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ERR_UNAUTHORIZED_ACTION",
        )

    return korisnik


def obrisi_fotografije(session: Session, fotografije: list[Fotografija]) -> None:
    for fotografija in fotografije:
        album_veze = session.exec(
            select(AlbumFotografija).where(AlbumFotografija.fotografija_id == fotografija.id)
        ).all()
        komentari = session.exec(
            select(Komentar).where(Komentar.fotografija_id == fotografija.id)
        ).all()
        lajkovi = session.exec(
            select(Lajk).where(Lajk.fotografija_id == fotografija.id)
        ).all()
        tagovi = session.exec(
            select(Tag).where(Tag.fotografija_id == fotografija.id)
        ).all()

        for zapis in [*album_veze, *komentari, *lajkovi, *tagovi]:
            session.delete(zapis)

        session.delete(fotografija)


def obrisi_event(session: Session, event: Event) -> None:
    fotografije = session.exec(
        select(Fotografija).where(Fotografija.event_id == event.id)
    ).all()
    obrisi_fotografije(session, fotografije)

    albumi = session.exec(select(Album).where(Album.event_id == event.id)).all()
    for album in albumi:
        album_veze = session.exec(
            select(AlbumFotografija).where(AlbumFotografija.album_id == album.id)
        ).all()
        for veza in album_veze:
            session.delete(veza)
        session.delete(album)

    ucesca = session.exec(
        select(EventUcesnik).where(EventUcesnik.event_id == event.id)
    ).all()
    for ucesce in ucesca:
        session.delete(ucesce)

    session.delete(event)


def obrisi_korisnicke_veze(session: Session, korisnik_id: int) -> None:
    komentari = session.exec(select(Komentar).where(Komentar.korisnik_id == korisnik_id)).all()
    lajkovi = session.exec(select(Lajk).where(Lajk.korisnik_id == korisnik_id)).all()
    tagovi = session.exec(
        select(Tag).where(
            (Tag.oznaceni_korisnik_id == korisnik_id) | (Tag.oznacio_korisnik_id == korisnik_id)
        )
    ).all()
    ucesca = session.exec(select(EventUcesnik).where(EventUcesnik.korisnik_id == korisnik_id)).all()
    prijave = session.exec(
        select(PrijavaProblema).where(PrijavaProblema.korisnik_id == korisnik_id)
    ).all()
    rijesene_prijave = session.exec(
        select(PrijavaProblema).where(PrijavaProblema.rijesio_admin_id == korisnik_id)
    ).all()

    for prijava in rijesene_prijave:
        if prijava.korisnik_id != korisnik_id:
            prijava.rijesio_admin_id = None
            session.add(prijava)

    for zapis in [*komentari, *lajkovi, *tagovi, *ucesca, *prijave]:
        session.delete(zapis)


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
    prijave = session.exec(select(PrijavaProblema)).all()

    return AdminStatsResponse(
        broj_korisnika=len(korisnici),
        broj_eventa=len(eventi),
        broj_fotografija=len(fotografije),
        broj_komentara=len(komentari),
        broj_lajkova=len(lajkovi),
        broj_albuma=len(albumi),
        broj_prijava=len(prijave),
    )


@router.get("/users", response_model=list[KorisnikResponse])
def admin_users(
    q: str | None = None,
    session: Session = Depends(get_session),
    _: Korisnik = Depends(zahtijevaj_admina),
):
    pretraga = normalizuj_pretragu(q)
    korisnici = session.exec(select(Korisnik)).all()

    rezultat = []

    for korisnik in korisnici:
        if korisnik_odgovara_pretrazi(korisnik, pretraga):
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


@router.delete("/users/{korisnik_id}")
def admin_obrisi_korisnika(
    korisnik_id: int,
    session: Session = Depends(get_session),
    admin: Korisnik = Depends(zahtijevaj_admina),
):
    if admin.id == korisnik_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_CANNOT_DELETE_SELF",
        )

    korisnik = session.get(Korisnik, korisnik_id)

    if korisnik is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ERR_USER_NOT_FOUND",
        )

    eventi = session.exec(
        select(Event).where(Event.organizator_id == korisnik_id)
    ).all()
    for event in eventi:
        obrisi_event(session, event)

    fotografije = session.exec(
        select(Fotografija).where(Fotografija.korisnik_id == korisnik_id)
    ).all()
    obrisi_fotografije(session, fotografije)
    obrisi_korisnicke_veze(session, korisnik_id)

    session.delete(korisnik)
    session.commit()

    return {"detail": "Korisnik je trajno obrisan."}


@router.get("/events", response_model=list[EventResponse])
def admin_eventi(
    q: str | None = None,
    session: Session = Depends(get_session),
    _: Korisnik = Depends(zahtijevaj_admina),
):
    pretraga = normalizuj_pretragu(q)
    eventi = session.exec(select(Event)).all()

    rezultat = []

    for event in eventi:
        if event_odgovara_pretrazi(event, pretraga):
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
