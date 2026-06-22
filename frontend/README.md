# Flashback Frontend

Ovo je frontend dio Flashback aplikacije. Napravljen je u Next.js-u i sluzi kao korisnicki interfejs za login, registraciju, dogadjaje, galeriju, feed, albume, admin panel i ostale stranice.

Frontend ne radi samostalno. Za vecinu funkcija mora biti pokrenut i backend na `http://127.0.0.1:8000`.

## Tehnologije

- Next.js
- React
- TypeScript
- Tailwind CSS
- qrcode.react
- ESLint

## Pokretanje

Iz root foldera projekta:

```bash
cd frontend
npm install
npm run dev
```

Aplikacija se otvara na:

```txt
http://localhost:3000
```

Ako se aplikacija testira preko lokalne mreze, moze se pokrenuti ovako:

```bash
npm run dev:network
```

Skripta sama pronadje LAN adresu i slobodan port. U terminalu ce ispisati nesto kao:

```txt
Frontend network URL: http://192.168.x.x:3000
Backend API URL: http://192.168.x.x:8000
```

Ako je port zauzet, skripta uzima sljedeci slobodan port. Ako se zeli rucno zadati host, moze se poslati `NETWORK_HOST`:

```bash
NETWORK_HOST=192.168.0.20 npm run dev:network
```

## Skripte

```bash
npm run dev      # pokretanje development servera
npm run dev:network  # pokretanje development servera preko lokalne mreze
npm run build    # production build
npm run start    # pokretanje buildane aplikacije
npm run lint     # ESLint provjera
```

TypeScript provjera:

```bash
npx tsc --noEmit
```

## Kako je frontend organizovan

```txt
frontend/app/page.tsx                         Login stranica
frontend/app/register/page.tsx                Registracija
frontend/app/dashboard/page.tsx               Pocetni dashboard
frontend/app/admin/page.tsx                   Admin panel
frontend/app/organizer/events/page.tsx        Lista dogadjaja
frontend/app/organizer/events/new/page.tsx    Kreiranje dogadjaja
frontend/app/events/[id]/page.tsx             Dashboard jednog dogadjaja
frontend/app/events/[id]/upload/page.tsx      Upload fotografija
frontend/app/photos/[id]/page.tsx             Detalj jedne fotografije
frontend/app/feed/page.tsx                    Feed fotografija
frontend/app/join/page.tsx                    Pridruzivanje preko koda
frontend/app/report/page.tsx                  Prijava problema ili sugestije
frontend/app/share/albums/[sharecode]/page.tsx Javni album
frontend/app/components/AITagReview.tsx       Pregled AI tagova
frontend/lib/api.ts                           Svi fetch pozivi prema backendu
```

## API komunikacija

Svi pozivi prema backendu su centralizovani u:

```txt
frontend/lib/api.ts
```

Tamo se nalaze funkcije za:

- login, logout i provjeru sesije
- registraciju
- dogadjaje
- fotografije i upload
- komentare, lajkove i favorite
- tagovanje korisnika
- albume
- feed
- admin funkcije
- report funkcije
- AI tagove

Backend URL se automatski pravi u `api.ts`.

Ako je aplikacija otvorena na `localhost`, frontend zove backend na `localhost:8000`.
Ako je aplikacija otvorena preko network skripte, frontend koristi backend URL iz lokalnog `.network.json` fajla koji napravi backend.

Po potrebi se moze rucno zadati API URL preko env vrijednosti:

```bash
NEXT_PUBLIC_API_URL=http://192.168.0.20:8001 npm run dev:network
```

## Uloge na frontendu

Frontend prikazuje razlicite opcije zavisno od uloge korisnika.

Admin:

- ima admin panel
- vidi sve dogadjaje i fotografije
- moze upravljati korisnicima i prijavama

Organizator:

- kreira dogadjaj
- uredjuje postavke dogadjaja
- vidi ucesnike
- upravlja albumima

Gost:

- pridruzuje se dogadjaju preko koda
- vidi svoje dogadjaje
- uploaduje slike
- vidi osnovne informacije o dogadjaju

## Jezici

Aplikacija koristi dva jezika:

- BS
- EN

Prevodi su trenutno definisani lokalno po stranicama kroz objekte kao `PREVODI`.

## AI tagovi na frontendu

AI tagovi se koriste na upload/review ekranu i na detalju fotografije. Korisnik moze prihvatiti, odbiti ili obrisati AI tag ako ima dozvolu.

## Lint

ESLint je podesen u:

```txt
frontend/eslint.config.mjs
```

Trenutno `npm run lint` prolazi, ali ostavlja nekoliko warninga. Warningi nisu blokirajuci, ali ih je dobro srediti kasnije ako bude vremena.
