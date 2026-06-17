import secrets

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.album import Album, AlbumFotografija, TipAlbuma
from app.models.event import Event, EventUcesnik
from app.models.fotografija import Fotografija
from app.models.komentar import Komentar
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.models.lajk import Lajk
from app.models.tag import Tag
from app.schemas.album import AlbumDetailResponse, AlbumResponse
from app.schemas.fotografija import FotografijaResponse, TagResponse
from app.services.upload_service import napravi_public_url, tip_medija_iz_naziva


def pronadji_event_ili_greska(session: Session, event_id: int) -> Event:
    event = session.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event ne postoji.",
        )

    return event


def pronadji_fotografiju_ili_greska(session: Session, photo_id: int) -> Fotografija:
    fotografija = session.get(Fotografija, photo_id)

    if fotografija is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fotografija ne postoji.",
        )

    return fotografija


def korisnik_ima_pristup_eventu(
    session: Session,
    korisnik: Korisnik,
    event: Event,
) -> bool:
    if korisnik.uloga == UlogaKorisnika.ADMIN:
        return True

    if korisnik.uloga == UlogaKorisnika.ORGANIZATOR:
        return event.organizator_id == korisnik.id

    ucesce = session.exec(
        select(EventUcesnik).where(
            EventUcesnik.event_id == event.id,
            EventUcesnik.korisnik_id == korisnik.id,
            EventUcesnik.status == "AKTIVAN",
        )
    ).first()

    return ucesce is not None


def korisnik_moze_urediti_event(korisnik: Korisnik, event: Event) -> bool:
    if korisnik.uloga == UlogaKorisnika.ADMIN:
        return True

    return korisnik.uloga == UlogaKorisnika.ORGANIZATOR and event.organizator_id == korisnik.id


def broj_lajkova(session: Session, fotografija_id: int) -> int:
    lajkovi = session.exec(
        select(Lajk).where(Lajk.fotografija_id == fotografija_id)
    ).all()

    return len(lajkovi)


def broj_komentara(session: Session, fotografija_id: int) -> int:
    komentari = session.exec(
        select(Komentar).where(Komentar.fotografija_id == fotografija_id)
    ).all()

    return len(komentari)


def fotografija_u_response(
    session: Session,
    fotografija: Fotografija,
    trenutni_korisnik: Korisnik | None,
) -> FotografijaResponse:
    liked_by_me = False

    if trenutni_korisnik is not None:
        postojeci_lajk = session.exec(
            select(Lajk).where(
                Lajk.fotografija_id == fotografija.id,
                Lajk.korisnik_id == trenutni_korisnik.id,
            )
        ).first()

        liked_by_me = postojeci_lajk is not None

    tagovi = session.exec(
        select(Tag).where(Tag.fotografija_id == fotografija.id)
    ).all()

    tag_responses = []

    for tag in tagovi:
        oznaceni = session.get(Korisnik, tag.oznaceni_korisnik_id)
        tag_responses.append(
            TagResponse(
                id=tag.id,
                fotografija_id=tag.fotografija_id,
                oznaceni_korisnik_id=tag.oznaceni_korisnik_id,
                oznacio_korisnik_id=tag.oznacio_korisnik_id,
                kreiran_at=tag.kreiran_at,
                oznaceni_korisnik_ime=oznaceni.ime if oznaceni is not None else None,
            )
        )

    return FotografijaResponse(
        id=fotografija.id,
        event_id=fotografija.event_id,
        korisnik_id=fotografija.korisnik_id,
        url=napravi_public_url(fotografija.putanja),
        tip_medija=tip_medija_iz_naziva(fotografija.putanja),
        vrijeme_uploada=fotografija.vrijeme_uploada,
        broj_lajkova=broj_lajkova(session, fotografija.id),
        broj_komentara=broj_komentara(session, fotografija.id),
        favorit=fotografija.favorit,
        liked_by_me=liked_by_me,
        tagovi=tag_responses,
    )


def album_u_response(session: Session, album: Album) -> AlbumResponse:
    veze = session.exec(
        select(AlbumFotografija).where(AlbumFotografija.album_id == album.id)
    ).all()

    broj = 0

    for veza in veze:
        foto = session.get(Fotografija, veza.fotografija_id)

        if foto is not None and not foto.obrisana:
            broj += 1

    return AlbumResponse(
        id=album.id,
        event_id=album.event_id,
        naziv=album.naziv,
        opis=album.opis,
        tip=album.tip,
        share_code=album.share_code,
        javno=album.javno,
        broj_fotografija=broj,
    )


def album_detail_response(
    session: Session,
    album: Album,
    trenutni_korisnik: Korisnik | None,
) -> AlbumDetailResponse:
    veze = session.exec(
        select(AlbumFotografija).where(AlbumFotografija.album_id == album.id)
    ).all()

    fotografije = []

    for veza in veze:
        foto = session.get(Fotografija, veza.fotografija_id)

        if foto is not None and not foto.obrisana:
            fotografije.append(fotografija_u_response(session, foto, trenutni_korisnik))

    return AlbumDetailResponse(
        album=album_u_response(session, album),
        fotografije=fotografije,
    )


def generisi_share_code(session: Session) -> str:
    for _ in range(20):
        kod = f"ALB-{secrets.token_hex(2).upper()}"
        postojeci = session.exec(
            select(Album).where(Album.share_code == kod)
        ).first()

        if postojeci is None:
            return kod

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Nije moguce generisati share kod.",
    )


def provjeri_finalni_album(album: Album):
    if album.tip != TipAlbuma.FINALNI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Samo finalni album se moze objaviti.",
        )
