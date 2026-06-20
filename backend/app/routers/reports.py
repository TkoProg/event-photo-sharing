from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.models.prijava_problema import PrijavaProblema, StatusPrijave
from app.routers.auth import get_trenutni_korisnik, zahtijevaj_uloge
from app.schemas.report import ReportCreate, ReportResponse, ReportStatusUpdate


router = APIRouter(prefix="/reports", tags=["Reports"])

DOZVOLJENI_TIPOVI = ["PROBLEM", "SUGESTIJA"]


def prijava_u_response(prijava: PrijavaProblema) -> ReportResponse:
    return ReportResponse(
        id=prijava.id,
        email=prijava.email,
        tip=prijava.tip,
        poruka=prijava.poruka,
        status=prijava.status,
        korisnik_id=prijava.korisnik_id,
        rijesio_admin_id=prijava.rijesio_admin_id,
        created_at=prijava.created_at,
        rijeseno_at=prijava.rijeseno_at,
    )


@router.post("", response_model=ReportResponse)
def kreiraj_prijavu(
    podaci: ReportCreate,
    korisnik: Korisnik = Depends(get_trenutni_korisnik),
    session: Session = Depends(get_session),
):
    tip = podaci.tip.strip().upper()
    poruka = podaci.poruka.strip()

    if tip not in DOZVOLJENI_TIPOVI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_INVALID_REPORT_TYPE",
        )

    if len(poruka) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_REPORT_MESSAGE_TOO_SHORT",
        )

    prijava = PrijavaProblema(
        email=str(podaci.email),
        tip=tip,
        poruka=poruka,
        korisnik_id=korisnik.id,
    )

    session.add(prijava)
    session.commit()
    session.refresh(prijava)

    return prijava_u_response(prijava)


@router.get("", response_model=list[ReportResponse])
def lista_prijava(
    admin: Korisnik = Depends(zahtijevaj_uloge(UlogaKorisnika.ADMIN)),
    session: Session = Depends(get_session),
):
    prijave = session.exec(
        select(PrijavaProblema).order_by(PrijavaProblema.created_at.desc())
    ).all()

    return [prijava_u_response(prijava) for prijava in prijave]


@router.put("/{prijava_id}/status", response_model=ReportResponse)
def promijeni_status_prijave(
    prijava_id: int,
    podaci: ReportStatusUpdate,
    admin: Korisnik = Depends(zahtijevaj_uloge(UlogaKorisnika.ADMIN)),
    session: Session = Depends(get_session),
):
    prijava = session.get(PrijavaProblema, prijava_id)

    if prijava is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ERR_REPORT_NOT_FOUND",
        )

    prijava.status = podaci.status

    if podaci.status == StatusPrijave.RIJESENO:
        prijava.rijeseno_at = datetime.utcnow()
        prijava.rijesio_admin_id = admin.id
    else:
        prijava.rijeseno_at = None
        prijava.rijesio_admin_id = None

    session.add(prijava)
    session.commit()
    session.refresh(prijava)

    return prijava_u_response(prijava)


@router.delete("/{prijava_id}")
def obrisi_prijavu(
    prijava_id: int,
    _: Korisnik = Depends(zahtijevaj_uloge(UlogaKorisnika.ADMIN)),
    session: Session = Depends(get_session),
):
    prijava = session.get(PrijavaProblema, prijava_id)

    if prijava is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ERR_REPORT_NOT_FOUND",
        )

    session.delete(prijava)
    session.commit()

    return {"detail": "Prijava je obrisana."}
