import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config import settings


_DOZVOLJENI_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

_MIME_EKSTENZIJE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

_DOZVOLJENE_EKSTENZIJE = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def dozvoljena_slika(upload_file: UploadFile) -> bool:
    if upload_file.content_type not in _DOZVOLJENI_MIME:
        return False

    naziv = upload_file.filename or ""
    ekstenzija = Path(naziv).suffix.lower()

    if ekstenzija in _DOZVOLJENE_EKSTENZIJE:
        return True

    if ekstenzija == "" and upload_file.content_type in _MIME_EKSTENZIJE:
        return True

    return False


def sacuvaj_upload_fajl(upload_file: UploadFile) -> str:
    folder = Path(settings.upload_folder)
    folder.mkdir(parents=True, exist_ok=True)

    naziv = upload_file.filename or ""
    ekstenzija = Path(naziv).suffix.lower()

    if ekstenzija == "" and upload_file.content_type in _MIME_EKSTENZIJE:
        ekstenzija = _MIME_EKSTENZIJE[upload_file.content_type]

    jedinstveni = f"{uuid4().hex}{ekstenzija}"
    cilj = folder / jedinstveni

    with cilj.open("wb") as output:
        shutil.copyfileobj(upload_file.file, output)

    return jedinstveni


def napravi_public_url(naziv_fajla: str) -> str:
    base = settings.backend_base_url.rstrip("/")
    return f"{base}/uploads/{naziv_fajla}"

