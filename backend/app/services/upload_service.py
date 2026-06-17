import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config import settings


_DOZVOLJENI_IMAGE_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

_DOZVOLJENI_VIDEO_MIME = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-m4v",
}

_MIME_EKSTENZIJE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
    "video/x-m4v": ".m4v",
}

_DOZVOLJENE_IMAGE_EKSTENZIJE = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
_DOZVOLJENE_VIDEO_EKSTENZIJE = {".mp4", ".mov", ".m4v", ".webm"}


def dozvoljena_slika(upload_file: UploadFile) -> bool:
    if upload_file.content_type not in _DOZVOLJENI_IMAGE_MIME:
        return False

    naziv = upload_file.filename or ""
    ekstenzija = Path(naziv).suffix.lower()

    if ekstenzija in _DOZVOLJENE_IMAGE_EKSTENZIJE:
        return True

    if ekstenzija == "" and upload_file.content_type in _MIME_EKSTENZIJE:
        return True

    return False


def _dozvoljen_tip_medija(
    upload_file: UploadFile,
    dozvoljeni_mime: set[str],
    dozvoljene_ekstenzije: set[str],
) -> bool:
    if upload_file.content_type not in dozvoljeni_mime:
        return False

    naziv = upload_file.filename or ""
    ekstenzija = Path(naziv).suffix.lower()

    if ekstenzija in dozvoljene_ekstenzije:
        return True

    if ekstenzija == "" and upload_file.content_type in _MIME_EKSTENZIJE:
        return True

    return False


def dozvoljen_medij(upload_file: UploadFile) -> bool:
    if _dozvoljen_tip_medija(
        upload_file,
        _DOZVOLJENI_IMAGE_MIME,
        _DOZVOLJENE_IMAGE_EKSTENZIJE,
    ):
        return True

    if _dozvoljen_tip_medija(
        upload_file,
        _DOZVOLJENI_VIDEO_MIME,
        _DOZVOLJENE_VIDEO_EKSTENZIJE,
    ):
        return True

    return False


def tip_medija_iz_naziva(naziv_fajla: str) -> str:
    ekstenzija = Path(naziv_fajla).suffix.lower()

    if ekstenzija in _DOZVOLJENE_VIDEO_EKSTENZIJE:
        return "video"

    return "image"


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
