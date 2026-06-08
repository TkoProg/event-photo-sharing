from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.album import Album, AlbumFotografija, TipAlbuma
from app.models.event import Event
from app.models.fotografija import Fotografija
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.routers.auth import get_trenutni_korisnik
from app.routers.helpers import (
    album_detail_response,
    album_u_response,
    generisi_share_code,
    korisnik_ima_pristup_eventu,
    korisnik_moze_urediti_event,
    pronadji_event_ili_greska,
    provjeri_finalni_album,
)
from app.schemas.album import (
    AlbumAddPhotoRequest,
    AlbumCreateRequest,
    AlbumDetailResponse,
    AlbumResponse,
)


router = APIRouter(tags=["Albums"])


@router.post("/albums", response_model=AlbumResponse)
def kreiraj_album(
    podaci: AlbumCreateRequest,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    event = pronadji_event_ili_greska(session, podaci.event_id)

    if korisnik.uloga != UlogaKorisnika.ADMIN and not korisnik_moze_urediti_event(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    album = Album(
        event_id=event.id,
        naziv=podaci.naziv,
        opis=podaci.opis,
        tip=podaci.tip,
    )

    session.add(album)
    session.commit()
    session.refresh(album)

    return album_u_response(session, album)


@router.get("/events/{event_id}/albums", response_model=list[AlbumResponse])
def lista_albuma_eventa(
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

    albumi = session.exec(
        select(Album).where(Album.event_id == event.id)
    ).all()

    rezultat = []

    for album in albumi:
        rezultat.append(album_u_response(session, album))

    return rezultat


@router.get("/albums/{album_id}", response_model=AlbumDetailResponse)
def detalji_albuma(
    album_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    album = session.get(Album, album_id)

    if album is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album ne postoji.",
        )

    event = session.get(Event, album.event_id)

    if event is None or not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom albumu.",
        )

    return album_detail_response(session, album, korisnik)


@router.post("/albums/{album_id}/photos", response_model=AlbumDetailResponse)
def dodaj_fotografiju_u_album(
    album_id: int,
    podaci: AlbumAddPhotoRequest,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    album = session.get(Album, album_id)

    if album is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album ne postoji.",
        )

    event = session.get(Event, album.event_id)

    if event is None or not korisnik_moze_urediti_event(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    fotografija = session.get(Fotografija, podaci.fotografija_id)

    if fotografija is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fotografija ne postoji.",
        )

    if fotografija.obrisana:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fotografija je obrisana.",
        )

    if fotografija.event_id != album.event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fotografija ne pripada ovom eventu.",
        )

    postojeca_veza = session.exec(
        select(AlbumFotografija).where(
            AlbumFotografija.album_id == album.id,
            AlbumFotografija.fotografija_id == fotografija.id,
        )
    ).first()

    if postojeca_veza is None:
        veza = AlbumFotografija(album_id=album.id, fotografija_id=fotografija.id)
        session.add(veza)
        session.commit()

    return album_detail_response(session, album, korisnik)


@router.delete("/albums/{album_id}/photos/{photo_id}", response_model=AlbumDetailResponse)
def ukloni_fotografiju_iz_albuma(
    album_id: int,
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    album = session.get(Album, album_id)

    if album is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album ne postoji.",
        )

    event = session.get(Event, album.event_id)

    if event is None or not korisnik_moze_urediti_event(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    veza = session.exec(
        select(AlbumFotografija).where(
            AlbumFotografija.album_id == album.id,
            AlbumFotografija.fotografija_id == photo_id,
        )
    ).first()

    if veza is not None:
        session.delete(veza)
        session.commit()

    return album_detail_response(session, album, korisnik)


@router.post("/albums/{album_id}/publish", response_model=AlbumResponse)
def objavi_album(
    album_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    album = session.get(Album, album_id)

    if album is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album ne postoji.",
        )

    event = session.get(Event, album.event_id)

    if event is None or not korisnik_moze_urediti_event(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za ovu akciju.",
        )

    #provjeri_finalni_album(album)

    if album.share_code is None:
        album.share_code = generisi_share_code(session)

    album.javno = True
    session.add(album)
    session.commit()
    session.refresh(album)

    return album_u_response(session, album)


@router.get("/share/albums/{share_code}", response_model=AlbumDetailResponse)
def javni_album(
    share_code: str,
    session: Session = Depends(get_session),
):
    album = session.exec(
        select(Album).where(Album.share_code == share_code)
    ).first()

    if album is None or not album.javno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Javni album ne postoji.",
        )

    return album_detail_response(session, album, None)