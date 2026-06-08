from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.models.korisnik import Korisnik, UlogaKorisnika
from app.schemas.auth import (
    KorisnikResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import (
    hash_lozinke,
    kreiraj_access_token,
    provjeri_lozinku,
)


router = APIRouter(prefix="/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def korisnik_u_response(korisnik: Korisnik) -> KorisnikResponse:
    return KorisnikResponse(
        id=korisnik.id,
        ime=korisnik.ime,
        email=korisnik.email,
        uloga=korisnik.uloga,
        jezik=korisnik.jezik,
        blokiran=korisnik.blokiran,
    )


def get_trenutni_korisnik(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Korisnik:
    greska = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ERR_INVALID_TOKEN",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        korisnik_id = payload.get("sub")

        if korisnik_id is None:
            raise greska

    except JWTError:
        raise greska

    korisnik = session.get(Korisnik, int(korisnik_id))

    if korisnik is None:
        raise greska

    if korisnik.blokiran:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ERR_USER_BLOCKED",
        )

    return korisnik


def zahtijevaj_uloge(*dozvoljene_uloge: UlogaKorisnika):
    def provjeri_ulogu(korisnik: Korisnik = Depends(get_trenutni_korisnik)) -> Korisnik:
        if korisnik.uloga not in dozvoljene_uloge:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ERR_UNAUTHORIZED_ACTION",
            )

        return korisnik

    return provjeri_ulogu


@router.post("/register", response_model=KorisnikResponse)
def register(
    podaci: RegisterRequest,
    session: Session = Depends(get_session),
):
    if podaci.uloga == UlogaKorisnika.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_ADMIN_PUBLIC_REGISTER",
        )

    postojeci = session.exec(
        select(Korisnik).where(Korisnik.email == podaci.email)
    ).first()

    if postojeci:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_EMAIL_EXISTS",
        )

    korisnik = Korisnik(
        ime=podaci.ime,
        email=podaci.email,
        lozinka_hash=hash_lozinke(podaci.lozinka),
        uloga=podaci.uloga,
        jezik=podaci.jezik,
    )

    session.add(korisnik)
    session.commit()
    session.refresh(korisnik)

    return korisnik_u_response(korisnik)


@router.post("/login", response_model=TokenResponse)
def login(
    podaci: LoginRequest,
    session: Session = Depends(get_session),
):
    korisnik = session.exec(
        select(Korisnik).where(Korisnik.email == podaci.email)
    ).first()

    if korisnik is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ERR_BAD_CREDENTIALS",
        )

    if not provjeri_lozinku(podaci.lozinka, korisnik.lozinka_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ERR_BAD_CREDENTIALS",
        )

    if korisnik.blokiran:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ERR_USER_BLOCKED",
        )

    token = kreiraj_access_token(korisnik.id)

    return TokenResponse(
        access_token=token,
        korisnik=korisnik_u_response(korisnik),
    )


@router.get("/me", response_model=KorisnikResponse)
def me(korisnik: Korisnik = Depends(get_trenutni_korisnik)):
    return korisnik_u_response(korisnik)