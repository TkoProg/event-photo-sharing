from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import app.models
from app.config import settings
from app.database import kreiraj_tabele
from app.routers import admin, albums, ai_tags, auth, comments, events, feed, photos, reports


app = FastAPI(title="Flashback API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    kreiraj_tabele()


@app.get("/")
def root():
    return {"message": "Flashback API radi."}


@app.get("/health")
def health():
    return {"ok": True}


app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(events.router)
app.include_router(photos.router)
app.include_router(comments.router)
app.include_router(albums.router)
app.include_router(feed.router)
app.include_router(admin.router)
app.include_router(ai_tags.router)

Path(settings.upload_folder).mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=settings.upload_folder),
    name="uploads",
)
