from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = 60 * 60 * 24


def korisnik_u_response(korisnik: Korisnik) -> KorisnikResponse:
    return KorisnikResponse(
        id=korisnik.id,
        ime=korisnik.ime,
        email=korisnik.email,
        uloga=korisnik.uloga,
        jezik=korisnik.jezik,
        blokiran=korisnik.blokiran,
    )


def postavi_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=COOKIE_MAX_AGE,
        samesite="lax",
        secure=False,
        path="/",
    )


def obrisi_auth_cookie(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        samesite="lax",
        secure=False,
    )


def pronadji_korisnika_iz_tokena(
    token: str | None,
    session: Session,
) -> Korisnik | None:
    if token is None:
        return None

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        korisnik_id = payload.get("sub")

        if korisnik_id is None:
            return None

    except JWTError:
        return None

    korisnik = session.get(Korisnik, int(korisnik_id))

    return korisnik


def get_trenutni_korisnik(
    token_iz_headera: Optional[str] = Depends(oauth2_scheme),
    token_iz_cookiea: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    session: Session = Depends(get_session),
) -> Korisnik:
    greska = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ERR_INVALID_TOKEN",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = token_iz_headera or token_iz_cookiea
    korisnik = pronadji_korisnika_iz_tokena(token, session)

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
    response: Response,
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

    postavi_auth_cookie(response, token)

    return TokenResponse(
        access_token=token,
        korisnik=korisnik_u_response(korisnik),
    )


@router.post("/logout")
def logout(response: Response):
    obrisi_auth_cookie(response)
    return {"message": "LOGOUT_SUCCESS"}


@router.get("/me", response_model=KorisnikResponse)
def me(korisnik: Korisnik = Depends(get_trenutni_korisnik)):
    return korisnik_u_response(korisnik)


@router.get("/session")
def session_status(
    token_iz_headera: Optional[str] = Depends(oauth2_scheme),
    token_iz_cookiea: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    session: Session = Depends(get_session),
):
    token = token_iz_headera or token_iz_cookiea
    korisnik = pronadji_korisnika_iz_tokena(token, session)

    if korisnik is None or korisnik.blokiran:
        return {"authenticated": False, "korisnik": None}

    return {
        "authenticated": True,
        "korisnik": korisnik_u_response(korisnik),
    }
