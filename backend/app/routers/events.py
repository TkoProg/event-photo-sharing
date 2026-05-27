import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.event import Event, EventUcesnik
from app.models.fotografija import Fotografija
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.routers.auth import get_trenutni_korisnik, zahtijevaj_uloge
from app.schemas.event import (
    EventCreateRequest,
    EventJoinRequest,
    EventResponse,
    EventUpdateRequest,
    UcesnikResponse,
)


router = APIRouter(prefix="/events", tags=["Events"])


def generisi_kod(session: Session) -> str:
    for _ in range(20):
        kod = secrets.token_hex(3).upper()

        postojeci = session.exec(
            select(Event).where(Event.kod == kod)
        ).first()

        if postojeci is None:
            return kod

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Nije moguce generisati jedinstven kod eventa.",
    )


def broj_ucesnika(session: Session, event_id: int) -> int:
    ucesnici = session.exec(
        select(EventUcesnik).where(EventUcesnik.event_id == event_id)
    ).all()

    return len(ucesnici)


def broj_fotografija(session: Session, event_id: int) -> int:
    fotografije = session.exec(
        select(Fotografija).where(
            Fotografija.event_id == event_id,
            Fotografija.obrisana == False,
        )
    ).all()

    return len(fotografije)


def event_u_response(session: Session, event: Event) -> EventResponse:
    return EventResponse(
        id=event.id,
        naziv=event.naziv,
        opis=event.opis,
        datum=event.datum,
        lokacija=event.lokacija,
        kod=event.kod,
        aktivan=event.aktivan,
        organizator_id=event.organizator_id,
        broj_fotografija=broj_fotografija(session, event.id),
        broj_ucesnika=broj_ucesnika(session, event.id),
    )


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


def korisnik_je_vlasnik_ili_admin(korisnik: Korisnik, event: Event) -> bool:
    if korisnik.uloga == UlogaKorisnika.ADMIN:
        return True

    return event.organizator_id == korisnik.id


@router.post("/join", response_model=EventResponse)
def join_event(
    podaci: EventJoinRequest,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(zahtijevaj_uloge(UlogaKorisnika.GOST)),
):
    event = session.exec(
        select(Event).where(Event.kod == podaci.kod.upper())
    ).first()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event sa ovim kodom ne postoji.",
        )

    if not event.aktivan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event nije aktivan.",
        )

    postojece_ucesce = session.exec(
        select(EventUcesnik).where(
            EventUcesnik.event_id == event.id,
            EventUcesnik.korisnik_id == korisnik.id,
        )
    ).first()

    if postojece_ucesce:
        return event_u_response(session, event)

    ucesce = EventUcesnik(
        event_id=event.id,
        korisnik_id=korisnik.id,
        status="AKTIVAN",
    )

    session.add(ucesce)
    session.commit()

    return event_u_response(session, event)


@router.get("", response_model=list[EventResponse])
def lista_eventa(
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    if korisnik.uloga == UlogaKorisnika.ADMIN:
        eventi = session.exec(select(Event)).all()

    elif korisnik.uloga == UlogaKorisnika.ORGANIZATOR:
        eventi = session.exec(
            select(Event).where(Event.organizator_id == korisnik.id)
        ).all()

    else:
        ucesca = session.exec(
            select(EventUcesnik).where(EventUcesnik.korisnik_id == korisnik.id)
        ).all()

        eventi = []

        for ucesce in ucesca:
            event = session.get(Event, ucesce.event_id)

            if event is not None:
                eventi.append(event)

    rezultat = []

    for event in eventi:
        rezultat.append(event_u_response(session, event))

    return rezultat


@router.post("", response_model=EventResponse)
def kreiraj_event(
    podaci: EventCreateRequest,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(zahtijevaj_uloge(UlogaKorisnika.ORGANIZATOR)),
):
    event = Event(
        naziv=podaci.naziv,
        opis=podaci.opis,
        datum=podaci.datum,
        lokacija=podaci.lokacija,
        kod=generisi_kod(session),
        organizator_id=korisnik.id,
    )

    session.add(event)
    session.commit()
    session.refresh(event)

    return event_u_response(session, event)


@router.get("/{event_id}", response_model=EventResponse)
def detalji_eventa(
    event_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    event = session.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event ne postoji.",
        )

    if not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovom eventu.",
        )

    return event_u_response(session, event)


@router.put("/{event_id}", response_model=EventResponse)
def izmijeni_event(
    event_id: int,
    podaci: EventUpdateRequest,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    event = session.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event ne postoji.",
        )

    if not korisnik_je_vlasnik_ili_admin(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za izmjenu ovog eventa.",
        )

    if podaci.naziv is not None:
        event.naziv = podaci.naziv

    if podaci.opis is not None:
        event.opis = podaci.opis

    if podaci.datum is not None:
        event.datum = podaci.datum

    if podaci.lokacija is not None:
        event.lokacija = podaci.lokacija

    if podaci.aktivan is not None:
        event.aktivan = podaci.aktivan

    session.add(event)
    session.commit()
    session.refresh(event)

    return event_u_response(session, event)


@router.delete("/{event_id}")
def deaktiviraj_event(
    event_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    event = session.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event ne postoji.",
        )

    if not korisnik_je_vlasnik_ili_admin(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za deaktivaciju ovog eventa.",
        )

    event.aktivan = False

    session.add(event)
    session.commit()

    return {"detail": "Event je deaktiviran."}


@router.get("/{event_id}/participants", response_model=list[UcesnikResponse])
def lista_ucesnika(
    event_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    event = session.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event ne postoji.",
        )

    if not korisnik_je_vlasnik_ili_admin(korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate dozvolu za pregled ucesnika.",
        )

    ucesca = session.exec(
        select(EventUcesnik).where(EventUcesnik.event_id == event_id)
    ).all()

    rezultat = []

    for ucesce in ucesca:
        ucesnik = session.get(Korisnik, ucesce.korisnik_id)

        if ucesnik is not None:
            rezultat.append(
                UcesnikResponse(
                    id=ucesnik.id,
                    ime=ucesnik.ime,
                    email=ucesnik.email,
                    uloga=ucesnik.uloga,
                    status=ucesce.status,
                    pridruzen_at=ucesce.pridruzen_at,
                )
            )

    return rezultat