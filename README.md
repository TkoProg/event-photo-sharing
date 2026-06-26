# Flashback

Flashback je full-stack aplikacija za dijeljenje fotografija i videa sa dogadjaja. Ideja je da organizator napravi dogadjaj, podijeli kod gostima, a gosti onda mogu pristupiti galeriji, uploadovati slike i vidjeti zajednicke uspomene.

# Deployment
Aplikacija je deployana na [Flashback](https://flashback.social/).

Projekat ima dva glavna dijela:

```txt
event-photo-sharing/
  backend/   FastAPI API, baza, upload i AI tagovi
  frontend/  Next.js aplikacija koju korisnik vidi u browseru
```

## Sta aplikacija radi

- registracija i login korisnika
- uloge: admin, organizator i gost
- organizator kreira dogadjaje
- gost se pridruzuje dogadjaju preko koda
- pregled dogadjaja za svaku ulogu
- upload fotografija i videa
- galerija, feed, komentari, lajkovi i favoriti
- tagovanje korisnika na fotografijama
- AI tagovi za slike preko CLIP modela
- albumi i finalni/javni albumi preko share linka
- admin panel za korisnike, prijave, dogadjaje i fotografije
- prijava problema ili sugestije kroz Report stranicu

## Tehnologije

Backend:

- Python
- FastAPI
- SQLModel
- SQLite
- JWT auth preko HttpOnly cookie-a
- Torch, Transformers i Pillow za AI tagove

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- qrcode.react

## Kako pokrenuti projekat

Potrebna su dva terminala: jedan za backend, jedan za frontend.

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Na Windowsu se virtualno okruzenje aktivira ovako:

```bash
.venv\Scripts\activate
```

Backend radi na:

```txt
http://127.0.0.1:8000
```

Swagger dokumentacija:

```txt
http://127.0.0.1:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend radi na:

```txt
http://localhost:3000
```

## Bitni fajlovi

```txt
backend/app/main.py              Ulaz u FastAPI aplikaciju
backend/app/config.py            Konfiguracija i .env vrijednosti
backend/app/database.py          SQLite konekcija i lokalne migracije
backend/app/routers/             API rute
backend/app/models/              SQLModel modeli
backend/app/schemas/             Pydantic response/request modeli
backend/app/services/            Auth, upload i AI helperi

frontend/app/                    Next.js stranice
frontend/app/components/         UI komponente
frontend/lib/api.ts              Svi frontend pozivi prema backendu
frontend/eslint.config.mjs       ESLint konfiguracija
```

## Uloge u aplikaciji

Admin:

- vidi admin panel
- upravlja korisnicima
- pregleda sve dogadjaje i fotografije
- rjesava prijave

Organizator:

- kreira i uredjuje svoje dogadjaje
- vidi ucesnike
- upravlja albumima i postavkama dogadjaja
- moze brisati sadrzaj na svom dogadjaju

Gost:

- pridruzuje se dogadjaju preko koda
- vidi dogadjaje na kojima ucestvuje
- uploaduje fotografije
- vidi informacije o dogadjaju

## Pokretanje na mrezi

Backend i frontend sami pronalaze LAN adresu i slobodan port. Prvo se pokrene backend, pa frontend.

```bash
cd backend
python run_network.py
```

Backend ce u terminalu ispisati adresu na kojoj radi i sacuvati je u lokalni `.network.json` fajl.

```bash
cd frontend
npm run dev:network
```

Frontend ce procitati backend adresu, pronaci slobodan frontend port i ispisati URL koji treba otvoriti u browseru.
