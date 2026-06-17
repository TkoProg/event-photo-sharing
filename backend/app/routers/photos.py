from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.event import Event
from app.models.fotografija import Fotografija
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.models.lajk import Lajk
from app.models.tag import Tag
from app.routers.auth import get_trenutni_korisnik
from app.routers.helpers import (
    korisnik_ima_pristup_eventu,
    korisnik_moze_urediti_event,
    fotografija_u_response,
    pronadji_event_ili_greska,
    pronadji_fotografiju_ili_greska,
)
from app.schemas.fotografija import FotografijaResponse, TagCreateRequest, TagResponse
from app.services.upload_service import dozvoljen_medij, sacuvaj_upload_fajl


router = APIRouter(tags=["Photos"])


@router.post("/events/{event_id}/photos", response_model=list[FotografijaResponse])
def upload_fotografija(
    event_id: int,
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    event = pronadji_event_ili_greska(session, event_id)

    if not event.aktivan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event nije aktivan.",
        )

    if not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom eventu.",
        )

    for upload in files:
        if not dozvoljen_medij(upload):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dozvoljen je samo upload slika i videa.",
            )

    sacuvane = []

    for upload in files:
        sacuvani_naziv = sacuvaj_upload_fajl(upload)
        originalni = upload.filename or sacuvani_naziv

        fotografija = Fotografija(
            event_id=event.id,
            korisnik_id=korisnik.id,
            putanja=sacuvani_naziv,
            originalni_naziv=originalni,
        )

        session.add(fotografija)
        sacuvane.append(fotografija)

    session.commit()

    for foto in sacuvane:
        session.refresh(foto)

    rezultat = []

    for foto in sacuvane:
        rezultat.append(fotografija_u_response(session, foto, korisnik))

    return rezultat


@router.get("/events/{event_id}/photos", response_model=list[FotografijaResponse])
def galerija_eventa(
    event_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    event = pronadji_event_ili_greska(session, event_id)

    if not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom eventu.",
        )

    fotografije = session.exec(
        select(Fotografija)
        .where(
            Fotografija.event_id == event.id,
            Fotografija.obrisana == False,
        )
        .order_by(Fotografija.vrijeme_uploada.desc())
    ).all()

    rezultat = []

    for foto in fotografije:
        rezultat.append(fotografija_u_response(session, foto, korisnik))

    return rezultat


@router.get("/photos/{photo_id}", response_model=FotografijaResponse)
def detalji_fotografije(
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

    return fotografija_u_response(session, fotografija, korisnik)


@router.delete("/photos/{photo_id}")
def obrisi_fotografiju(
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    dozvola = False

    if korisnik.uloga == UlogaKorisnika.ADMIN:
        dozvola = True

    if event is not None and korisnik_moze_urediti_event(korisnik, event):
        dozvola = True

    if fotografija.korisnik_id == korisnik.id:
        dozvola = True

    if not dozvola:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    fotografija.obrisana = True
    session.add(fotografija)
    session.commit()

    return {"detail": "Fotografija je obrisana."}


@router.post("/photos/{photo_id}/favorite", response_model=FotografijaResponse)
def favorit_fotografije(
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or not korisnik_moze_urediti_event(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    fotografija.favorit = not fotografija.favorit
    session.add(fotografija)
    session.commit()
    session.refresh(fotografija)

    return fotografija_u_response(session, fotografija, korisnik)


@router.post("/photos/{photo_id}/like", response_model=FotografijaResponse)
def like_fotografije(
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

    postojeci = session.exec(
        select(Lajk).where(
            Lajk.fotografija_id == fotografija.id,
            Lajk.korisnik_id == korisnik.id,
        )
    ).first()

    if postojeci is None:
        lajk = Lajk(fotografija_id=fotografija.id, korisnik_id=korisnik.id)
        session.add(lajk)
        session.commit()

    return fotografija_u_response(session, fotografija, korisnik)


@router.delete("/photos/{photo_id}/like", response_model=FotografijaResponse)
def unlike_fotografije(
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

    postojeci = session.exec(
        select(Lajk).where(
            Lajk.fotografija_id == fotografija.id,
            Lajk.korisnik_id == korisnik.id,
        )
    ).first()

    if postojeci is not None:
        session.delete(postojeci)
        session.commit()

    return fotografija_u_response(session, fotografija, korisnik)


@router.post("/photos/{photo_id}/tags", response_model=TagResponse)
def taguj_korisnika(
    photo_id: int,
    podaci: TagCreateRequest,
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

    oznaceni = session.get(Korisnik, podaci.oznaceni_korisnik_id)

    if oznaceni is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Korisnik ne postoji.",
        )

    if not korisnik_ima_pristup_eventu(session, oznaceni, event):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Korisnik nema pristup ovom eventu.",
        )

    postojeci = session.exec(
        select(Tag).where(
            Tag.fotografija_id == fotografija.id,
            Tag.oznaceni_korisnik_id == oznaceni.id,
        )
    ).first()

    if postojeci is not None:
        return TagResponse(
            id=postojeci.id,
            fotografija_id=postojeci.fotografija_id,
            oznaceni_korisnik_id=postojeci.oznaceni_korisnik_id,
            oznacio_korisnik_id=postojeci.oznacio_korisnik_id,
            kreiran_at=postojeci.kreiran_at,
            oznaceni_korisnik_ime=oznaceni.ime,
        )

    tag = Tag(
        fotografija_id=fotografija.id,
        oznaceni_korisnik_id=oznaceni.id,
        oznacio_korisnik_id=korisnik.id,
    )

    session.add(tag)
    session.commit()
    session.refresh(tag)

    return TagResponse(
        id=tag.id,
        fotografija_id=tag.fotografija_id,
        oznaceni_korisnik_id=tag.oznaceni_korisnik_id,
        oznacio_korisnik_id=tag.oznacio_korisnik_id,
        kreiran_at=tag.kreiran_at,
        oznaceni_korisnik_ime=oznaceni.ime,
    )


@router.delete("/tags/{tag_id}")
def obrisi_tag(
    tag_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    tag = session.get(Tag, tag_id)

    if tag is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag ne postoji.",
        )

    fotografija = session.get(Fotografija, tag.fotografija_id)

    if fotografija is None or fotografija.obrisana:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fotografija ne postoji.",
        )

    event = session.get(Event, fotografija.event_id)

    if event is None or not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    moze_obrisati = (
        korisnik_moze_urediti_event(korisnik, event)
        or fotografija.korisnik_id == korisnik.id
        or tag.oznacio_korisnik_id == korisnik.id
        or tag.oznaceni_korisnik_id == korisnik.id
    )

    if not moze_obrisati:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    session.delete(tag)
    session.commit()

    return {"detail": "Tag je obrisan."}


@router.get("/users/{korisnik_id}/tagged-photos", response_model=list[FotografijaResponse])
def tagovane_fotografije(
    korisnik_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    if korisnik.uloga != UlogaKorisnika.ADMIN and korisnik.id != korisnik_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    tagovi = session.exec(
        select(Tag).where(Tag.oznaceni_korisnik_id == korisnik_id)
    ).all()

    rezultat = []

    for tag in tagovi:
        fotografija = session.get(Fotografija, tag.fotografija_id)

        if fotografija is None or fotografija.obrisana:
            continue

        event = session.get(Event, fotografija.event_id)

        if event is None:
            continue

        if korisnik.uloga == UlogaKorisnika.ADMIN:
            rezultat.append(fotografija_u_response(session, fotografija, korisnik))
            continue

        if korisnik_ima_pristup_eventu(session, korisnik, event):
            rezultat.append(fotografija_u_response(session, fotografija, korisnik))

    return rezultat
