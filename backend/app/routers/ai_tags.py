from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.models.ai_tag import AITag
from app.models.event import Event
from app.models.korisnik import Korisnik
from app.routers.auth import get_trenutni_korisnik
from app.routers.helpers import (
    fotografija_u_response,
    korisnik_ima_pristup_eventu,
    pronadji_fotografiju_ili_greska,
)
from app.schemas.fotografija import AITagResponse, FotografijaResponse
from app.services.ai_tagging_service import AITaggingService


router = APIRouter(tags=["AI Tags"])


@router.get("/photos/{photo_id}/ai-tags", response_model=list[AITagResponse])
def get_ai_tagovi(
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    """Dobij sve AI tagove za sliku"""
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or not korisnik_ima_pristup_eventu(session, korisnik, event):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    ai_tagovi = session.exec(
        select(AITag).where(AITag.fotografija_id == fotografija.id)
    ).all()

    return [
        AITagResponse(
            id=tag.id,
            fotografija_id=tag.fotografija_id,
            tag_naziv=tag.tag_naziv,
            pouzdanost=tag.pouzdanost,
            status=tag.status,
            kreiran_at=tag.kreiran_at,
        )
        for tag in ai_tagovi
    ]


@router.post("/photos/{photo_id}/ai-tags/analyze")
def analiziraj_sliku(
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    """Analiziraj sliku i kreiraj AI tagove"""
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or fotografija.korisnik_id != korisnik.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    # Provjeri da li već postoje AI tagovi
    postojeci = session.exec(
        select(AITag).where(AITag.fotografija_id == fotografija.id)
    ).all()

    if postojeci:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI tagovi već postoje za ovu sliku.",
        )

    try:
        putanja_slike = Path(settings.upload_folder) / fotografija.putanja
        tagovi_rezultat = AITaggingService.analiziraj_sliku(str(putanja_slike), top_k=5)

        kreirani_tagovi = []
        for tag_data in tagovi_rezultat:
            ai_tag = AITag(
                fotografija_id=fotografija.id,
                tag_naziv=tag_data["tag"],
                pouzdanost=tag_data["pouzdanost"],
                status="PENDING",
            )
            session.add(ai_tag)
            kreirani_tagovi.append(ai_tag)

        session.commit()

        for tag in kreirani_tagovi:
            session.refresh(tag)

        return {
            "status": "success",
            "broj_tagova": len(kreirani_tagovi),
            "tagovi": [
                {
                    "id": tag.id,
                    "tag_naziv": tag.tag_naziv,
                    "pouzdanost": tag.pouzdanost,
                }
                for tag in kreirani_tagovi
            ],
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fotografija nije pronađena na disku.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Greška pri analizi slike: {str(e)}",
        )


@router.post("/photos/{photo_id}/ai-tags/accept-all", response_model=FotografijaResponse)
def prihvati_sve_ai_tagove(
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    """Prihvati sve AI tagove za sliku"""
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or fotografija.korisnik_id != korisnik.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    ai_tagovi = session.exec(
        select(AITag).where(
            AITag.fotografija_id == fotografija.id,
            AITag.status == "PENDING",
        )
    ).all()

    for tag in ai_tagovi:
        tag.status = "ACCEPTED"
        session.add(tag)

    session.commit()

    session.refresh(fotografija)

    return fotografija_u_response(session, fotografija, korisnik)


@router.post("/photos/{photo_id}/ai-tags/reject-all", response_model=FotografijaResponse)
def odbij_sve_ai_tagove(
    photo_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    """Odbij sve AI tagove za sliku"""
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or fotografija.korisnik_id != korisnik.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    ai_tagovi = session.exec(
        select(AITag).where(
            AITag.fotografija_id == fotografija.id,
            AITag.status == "PENDING",
        )
    ).all()

    for tag in ai_tagovi:
        tag.status = "REJECTED"
        session.add(tag)

    session.commit()

    session.refresh(fotografija)

    return fotografija_u_response(session, fotografija, korisnik)


@router.post("/photos/{photo_id}/ai-tags/{tag_id}/accept", response_model=FotografijaResponse)
def prihvati_ai_tag(
    photo_id: int,
    tag_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    """Prihvati pojedinačan AI tag"""
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or fotografija.korisnik_id != korisnik.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    ai_tag = session.get(AITag, tag_id)

    if ai_tag is None or ai_tag.fotografija_id != fotografija.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI tag ne postoji.",
        )

    ai_tag.status = "ACCEPTED"
    session.add(ai_tag)
    session.commit()

    session.refresh(fotografija)

    return fotografija_u_response(session, fotografija, korisnik)


@router.post("/photos/{photo_id}/ai-tags/{tag_id}/reject", response_model=FotografijaResponse)
def odbij_ai_tag(
    photo_id: int,
    tag_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    """Odbij pojedinačan AI tag"""
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or fotografija.korisnik_id != korisnik.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    ai_tag = session.get(AITag, tag_id)

    if ai_tag is None or ai_tag.fotografija_id != fotografija.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI tag ne postoji.",
        )

    ai_tag.status = "REJECTED"
    session.add(ai_tag)
    session.commit()

    # Osvježi fotografiju
    session.refresh(fotografija)

    return fotografija_u_response(session, fotografija, korisnik)


@router.delete("/photos/{photo_id}/ai-tags/{tag_id}", response_model=FotografijaResponse)
def obrisi_ai_tag(
    photo_id: int,
    tag_id: int,
    session: Session = Depends(get_session),
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
):
    """Obriši AI tag"""
    fotografija = pronadji_fotografiju_ili_greska(session, photo_id)
    event = session.get(Event, fotografija.event_id)

    if event is None or fotografija.korisnik_id != korisnik.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemate pristup ovoj fotografiji.",
        )

    ai_tag = session.get(AITag, tag_id)

    if ai_tag is None or ai_tag.fotografija_id != fotografija.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI tag ne postoji.",
        )

    session.delete(ai_tag)
    session.commit()

    # Osvježi fotografiju
    session.refresh(fotografija)

    return fotografija_u_response(session, fotografija, korisnik)


