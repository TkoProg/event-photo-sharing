from pydantic import BaseModel, EmailStr

from app.models.korisnik import UlogaKorisnika


class RegisterRequest(BaseModel):
    ime: str
    email: EmailStr
    lozinka: str
    uloga: UlogaKorisnika = UlogaKorisnika.GOST
    jezik: str = "bs"


class LoginRequest(BaseModel):
    email: EmailStr
    lozinka: str


class KorisnikResponse(BaseModel):
    id: int
    ime: str
    email: str
    uloga: UlogaKorisnika
    jezik: str
    blokiran: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    korisnik: KorisnikResponse