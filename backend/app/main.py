from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.database import kreiraj_tabele
from app.routers import auth, events


app = FastAPI(title="Event Photo Sharing API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    kreiraj_tabele()


@app.get("/")
def root():
    return {"message": "Event Photo Sharing API radi."}


@app.get("/health")
def health():
    return {"ok": True}


app.include_router(auth.router)
app.include_router(events.router)