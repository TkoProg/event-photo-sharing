# Event Sharing Platform

Full-stack aplikacija za dijeljenje fotografija i sadrzaja sa dogadjaja.

Projekat je podijeljen na dva glavna dijela:

```txt
event-sharing-platform/
  backend/   - FastAPI backend aplikacija
  frontend/  - Next.js / React frontend aplikacija
```

Frontend i backend su trenutno odvojeni. Povezivanje frontend-a i backend-a cemo uraditi kasnije kroz API pozive.

---

## Tehnologije
Koristiti cemo iste tehnologije koje se koriste na predavanjima / vjezbama:
- Backend: FastAPI
- Frontend: Next.js / React
- GitHub: Zajedno radimo preko branch-ova

---

## Preuzimanje projekta sa GitHub-a

Prvo klonirati repozitorij:

```bash
git clone LINK_DO_REPOZITORIJA
```

Zatim uci u folder projekta:

```bash
cd event-sharing-platform
```

Primjer:

```bash
git clone https://github.com/username/event-photo-sharing.git
cd event-photo-sharing
```

> Napomena: `LINK_DO_REPOZITORIJA` zamijeniti stvarnim linkom naseg GitHub repozitorija.

---

## Pokretanje backend-a

Backend se nalazi u folderu:

```txt
backend/
```

Uci u backend folder:

```bash
cd backend
```

Kreirati Python virtualno okruzenje:

```bash
python -m venv .venv
```

Aktivirati virtualno okruzenje na Windowsu:

```bash
.venv\Scripts\activate
```

Aktivirati virtualno okruzenje na macOS/Linux:

```bash
source .venv/bin/activate
```

Instalirati backend dependency-je:

```bash
pip install -r requirements.txt
```

Pokrenuti FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend ce biti dostupan na:

```txt
http://127.0.0.1:8000
```

Swagger dokumentacija ce biti dostupna na:

```txt
http://127.0.0.1:8000/docs
```

Za zaustavljanje backend servera koristiti:

```txt
CTRL + C
```

---

## Pokretanje frontend-a

Frontend se nalazi u folderu:

```txt
frontend/
```

Iz root foldera projekta uci u frontend folder:

```bash
cd frontend
```

Instalirati frontend dependency-je:

```bash
npm install
```

Pokrenuti frontend aplikaciju:

```bash
npm run dev
```

Frontend ce biti dostupan na:

```txt
http://localhost:3000
```

Za zaustavljanje frontend servera koristiti:

```txt
CTRL + C
```

---

## Pokretanje frontend-a i backend-a istovremeno

Potrebno je otvoriti dva terminala.

U prvom terminalu pokrenuti backend:

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

U drugom terminalu pokrenuti frontend:

```bash
cd frontend
npm run dev
```

Nakon toga aplikacije rade paralelno:

```txt
Backend:  http://127.0.0.1:8000
Frontend: http://localhost:3000
```

---

## Pravilan rad sa Git-om

Ne raditi direktno na `main` branchu.

`main` branch treba predstavljati stabilnu verziju projekta. Svaka nova funkcionalnost treba ici na poseban branch.

---

## Prije pocetka rada

Uvijek prvo prebaciti se na `main`:

```bash
git checkout main
```

Zatim povuci najnovije promjene:

```bash
git pull origin main
```

---

## Kreiranje novog brancha

Za svaki novi zadatak napraviti novi branch:

```bash
git checkout -b feature/naziv-zadatka
```

Primjeri:

```bash
git checkout -b feature/login-page
git checkout -b feature/backend-users
git checkout -b feature/event-form
git checkout -b feature/gallery-page
```

---

## Provjera izmjena

Tokom rada mozete provjeriti koje fajlove ste mijenjali:

```bash
git status
```

---

## Dodavanje izmjena

Dodati sve izmjene:

```bash
git add .
```

Ili dodati samo jedan fajl:

```bash
git add naziv_fajla
```

---

## Commit izmjena

Commit poruka treba biti kratka i jasna:

```bash
git commit -m "Dodana pocetna stranica"
```

Dodatni primjeri commit poruka:

```bash
git commit -m "Dodana FastAPI ruta za korisnike"
git commit -m "Kreirana forma za dodavanje dogadjaja"
git commit -m "Popravljen izgled navigation bara"
```

---

## Slanje brancha na GitHub

Kada zavrsite dio posla, branch poslati na GitHub:

```bash
git push origin feature/naziv-zadatka
```

Primjer:

```bash
git push origin feature/login-page
```

Nakon toga na GitHub-u otvoriti Pull Request prema `main` branchu.

---

## Pull Request pravilo

Kada neko zavrsi svoj branch:

1. Otvoriti Pull Request na GitHub-u.
2. Napisati kratak opis sta je uradjeno.
3. Drugi clan tima treba pregledati promjene.
4. Tek nakon pregleda spojiti Pull Request u `main`.

---

## Povlacenje promjena nakon sto neko drugi spoji kod

Ako je neko drugi spojio promjene u `main`, potrebno je osvjeziti lokalni projekat:

```bash
git checkout main
git pull origin main
```

Ako radite na svom branchu i zelite povuci najnoviji `main` u svoj branch:

```bash
git checkout feature/naziv-zadatka
git merge main
```

---

## Korisne Git komande

Provjera trenutnog brancha:

```bash
git branch
```

Prebacivanje na postojeci branch:

```bash
git checkout naziv-brancha
```

Kreiranje novog brancha:

```bash
git checkout -b naziv-brancha
```

Provjera statusa:

```bash
git status
```

Pregled commit historije:

```bash
git log --oneline
```

Povlacenje najnovijih promjena sa GitHub-a:

```bash
git pull origin main
```

Slanje trenutnog brancha na GitHub:

```bash
git push origin naziv-brancha
```

---

## Sta se ne smije commitati

Ne commitati lokalne i generisane fajlove kao sto su:

```txt
.venv/
venv/
node_modules/
.next/
.env
.idea/
__pycache__/
*.pyc
```

Ovi fajlovi su vec dodani u `.gitignore`.

---

## Struktura projekta

Trenutna struktura projekta:

```txt
event-sharing-platform/
  README.md
  .gitignore

  backend/
    requirements.txt
    test_main.http
    app/
      __init__.py
      main.py

  frontend/
    app/
      favicon.ico
      globals.css
      layout.tsx
      page.tsx
    public/
    package.json
    package-lock.json
    tsconfig.json
    next.config.ts
    postcss.config.mjs
    eslint.config.mjs
```

---

## Backend komande - kratka verzija

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## Frontend komande - kratka verzija

```bash
cd frontend
npm install
npm run dev
```

---

## Napomena za tim

- Raditi preko branchova.
- Ne raditi direktno na `main`.
- Prije rada uvijek uraditi `git pull origin main`.
- Ne commitati `.venv`, `node_modules`, `.env` i slicne lokalne fajlove.
- Za svaku vecu izmjenu otvoriti Pull Request.
- Commit poruke trebaju jasno govoriti sta je promijenjeno.
