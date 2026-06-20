from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.models.prijava_problema import PrijavaProblema
from app.routers.auth import get_trenutni_korisnik, zahtijevaj_uloge
from app.schemas.report import ReportCreate, ReportResponse


router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=ReportResponse)
def kreiraj_prijavu(
    podaci: ReportCreate,
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
    session: Session = Depends(get_session),
):
    if podaci.tip not in ["PROBLEM", "SUGESTIJA"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_INVALID_REPORT_TYPE",
        )

    if not podaci.poruka.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_EMPTY_REPORT_MESSAGE",
        )

    prijava = PrijavaProblema(
        email=podaci.email,
        tip=podaci.tip,
        poruka=podaci.poruka,
        korisnik_id=korisnik.id,
    )

    session.add(prijava)
    session.commit()
    session.refresh(prijava)

    return prijava


@router.get("", response_model=list[ReportResponse])
def lista_prijava(
    admin: Korisnik = Depends(zahtijevaj_uloge(UlogaKorisnika.ADMIN)),
    session: Session = Depends(get_session),
):
    prijave = session.exec(
        select(PrijavaProblema).order_by(PrijavaProblema.created_at.desc())
    ).all()

    return prijave