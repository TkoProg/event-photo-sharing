from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.event import Event
from app.models.fotografija import Fotografija
from app.models.komentar import Komentar
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.routers.auth import get_trenutni_korisnik
from app.routers.helpers import (
    korisnik_ima_pristup_eventu,
    korisnik_moze_urediti_event,
    pronadji_fotografiju_ili_greska,
)
from app.schemas.komentar import KomentarCreateRequest, KomentarResponse


router = APIRouter(tags=["Comments"])


@router.get("/photos/{photo_id}/comments", response_model=list[KomentarResponse])
def lista_komentara(
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    komentari = session.exec(
        select(Komentar)
        .where(Komentar.fotografija_id == fotografija.id)
        .order_by(Komentar.kreiran_at.asc())
    ).all()

    rezultat = []

    for komentar in komentari:
        autor = session.get(Korisnik, komentar.korisnik_id)
        ime_autora = autor.ime if autor is not None else ""

        rezultat.append(
            KomentarResponse(
                id=komentar.id,
                fotografija_id=komentar.fotografija_id,
                korisnik_id=komentar.korisnik_id,
                ime_korisnika=ime_autora,
                sadrzaj=komentar.sadrzaj,
                kreiran_at=komentar.kreiran_at,
            )
        )

    return rezultat


@router.post("/photos/{photo_id}/comments", response_model=KomentarResponse)
def dodaj_komentar(
    photo_id: int,
    podaci: KomentarCreateRequest,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    sadrzaj = podaci.sadrzaj.strip()

    if sadrzaj == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Komentar ne moze biti prazan.",
        )

    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    komentar = Komentar(
        fotografija_id=fotografija.id,
        korisnik_id=korisnik.id,
        sadrzaj=sadrzaj,
    )

    session.add(komentar)
    session.commit()
    session.refresh(komentar)

    return KomentarResponse(
        id=komentar.id,
        fotografija_id=komentar.fotografija_id,
        korisnik_id=komentar.korisnik_id,
        ime_korisnika=korisnik.ime,
        sadrzaj=komentar.sadrzaj,
        kreiran_at=komentar.kreiran_at,
    )


@router.delete("/comments/{comment_id}")
def obrisi_komentar(
    comment_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    komentar = session.get(Komentar, comment_id)

    if komentar is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Komentar ne postoji.",
        )

    fotografija = session.get(Fotografija, komentar.fotografija_id)
    event = session.get(Event, fotografija.event_id) if fotografija else None

    dozvola = False

    if korisnik.uloga == UlogaKorisnika.ADMIN:
        dozvola = True

    if event is not None and korisnik_moze_urediti_event(korisnik, event):
        dozvola = True

    if komentar.korisnik_id == korisnik.id:
        dozvola = True

    if not dozvola:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    session.delete(komentar)
    session.commit()

    return {"detail": "Komentar je obrisan."}

