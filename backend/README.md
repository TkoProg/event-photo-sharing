# Flashback Backend

Ovo je backend dio Flashback aplikacije. Backend je napravljen u FastAPI-ju i zaduzen je za autentifikaciju, bazu, dogadjaje, fotografije, komentare, albume, admin funkcije, prijave i AI tagove.

Backend se pokrece odvojeno od frontenda.

## Tehnologije

- Python
- FastAPI
- SQLModel
- SQLite
- Pydantic settings
- JWT tokeni
- HttpOnly cookie autentifikacija
- python-multipart za upload
- Torch, Transformers i Pillow za AI tagovanje slika

## Pokretanje

Iz root foldera projekta:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Na Windowsu:

```bash
.venv\Scripts\activate
```

Backend se otvara na:

```txt
http://127.0.0.1:8000
```

Ako se aplikacija testira preko lokalne mreze, backend se pokrece ovako:

```bash
python run_network.py
```

Skripta sama pronadje LAN adresu i prvi slobodan backend port. U terminalu ce ispisati nesto kao:

```txt
Backend network URL: http://192.168.x.x:8000
```

Ako je port zauzet, skripta uzima sljedeci slobodan port. Ako se zeli rucno zadati host ili pocetni port:

```bash
NETWORK_HOST=192.168.0.20 BACKEND_PORT=8001 python run_network.py
```

Swagger dokumentacija:

```txt
http://127.0.0.1:8000/docs
```

Health check:

```txt
http://127.0.0.1:8000/health
```

## .env

Primjer konfiguracije je u:

```txt
backend/.env.example
```

Najbitnije vrijednosti:

```txt
DATABASE_URL=sqlite:///./flashback.db
SECRET_KEY=promijeni-ovo-u-dug-random-string
BACKEND_BASE_URL=http://127.0.0.1:8000
UPLOAD_FOLDER=app/uploads
AI_MODEL_NAME=openai/clip-vit-base-patch32
AI_MODEL_LOCAL_FILES_ONLY=false
```

Bez `.env` fajla backend nece normalno raditi jer mu treba `SECRET_KEY`.

## Struktura

```txt
backend/app/main.py          Kreira FastAPI aplikaciju i ukljucuje routere
backend/app/config.py        Cita .env konfiguraciju
backend/app/database.py      SQLite konekcija i kreiranje tabela
backend/app/models/          Tabele u bazi
backend/app/schemas/         Request i response modeli
backend/app/routers/         API rute
backend/app/services/        Pomocni servisi za auth, upload i AI
backend/app/uploads/         Lokalni upload fajlovi
```

## Baza

Koristi se SQLite:

```txt
backend/flashback.db
```

Tabele se kreiraju automatski pri pokretanju aplikacije preko `SQLModel.metadata.create_all`.

Glavni modeli su:

- `Korisnik`
- `Event`
- `EventUcesnik`
- `Fotografija`
- `Komentar`
- `Lajk`
- `Tag`
- `AITag`
- `Album`
- `AlbumFotografija`
- `PrijavaProblema`

## API oblasti

Auth:

- registracija
- login
- logout
- trenutni korisnik
- provjera sesije

Events:

- kreiranje dogadjaja
- lista dogadjaja po ulozi korisnika
- pretraga dogadjaja po nazivu ili kodu
- pridruzivanje preko koda
- izmjena i brisanje dogadjaja
- ucesnici dogadjaja

Photos:

- upload slika i videa
- galerija dogadjaja
- detalj fotografije
- download
- brisanje
- favoriti
- lajkovi
- tagovanje korisnika

Albums:

- kreiranje albuma
- pregled albuma
- dodavanje i uklanjanje fotografija iz albuma
- objava javnog albuma
- javni share link

AI Tags:

- analiza slike
- prihvatanje AI tagova
- odbijanje AI tagova
- brisanje AI tagova

Admin:

- statistika sistema
- lista i pretraga korisnika
- blokiranje korisnika
- brisanje korisnika
- pregled dogadjaja i fotografija

Reports:

- slanje problema ili sugestije
- admin pregled prijava
- promjena statusa prijave
- brisanje prijave

## Autentifikacija

Login kreira JWT token i postavlja ga u HttpOnly cookie:

```txt
access_token
```

Frontend zato ne mora cuvati token u `localStorage`.

Uloge korisnika:

```txt
ADMIN
ORGANIZATOR
GOST
```

## Upload

Uploadovani fajlovi se cuvaju u:

```txt
backend/app/uploads/
```

Backend zatim pravi public URL preko statickog mounta:

```txt
/uploads
```

## AI tagovi

AI tagovanje koristi CLIP model:

```txt
openai/clip-vit-base-patch32
```

Prvi put model moze potrajati jer se mora preuzeti ako nije lokalno dostupan.

## Provjera koda

Nema kompletan automatizovani test suite, ali se mogu provjeriti Python fajlovi:

```bash
python -m py_compile app/main.py
python -m py_compile app/routers/auth.py
python -m py_compile app/routers/events.py
```

Za rucno testiranje koristiti Swagger:

```txt
http://127.0.0.1:8000/docs
```
