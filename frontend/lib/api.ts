// ─────────────────────────────────────────────────────────────────────────────
// src/lib/api.ts
// Jedino mjesto gdje se radi komunikacija sa backendom.
// Sve stranice importuju funkcije odavde — nikad direktno fetch.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://127.0.0.1:8000';

// ─── Tipovi koji odgovaraju backend JSON odgovorima ──────────────────────────

export interface ApiKorisnik {
  id: number;
  ime: string;
  email: string;
  uloga: 'ADMIN' | 'ORGANIZATOR' | 'GOST';
  jezik: string;
  blokiran: boolean;
}

export interface ApiEvent {
  id: number;
  naziv: string;
  opis: string;
  datum: string;
  lokacija: string;
  kod: string;
  aktivan: boolean;
  organizator_id: number;
  broj_fotografija: number;
  broj_ucesnika: number;
}

export interface ApiFotografija {
  id: number;
  event_id: number;
  korisnik_id: number;
  url: string;                 // javni URL slike, npr. http://127.0.0.1:8000/uploads/slika.jpg
  vrijeme_uploada: string;
  broj_lajkova: number;
  broj_komentara: number;
  favorit: boolean;
  liked_by_me: boolean;
}

export async function getUcesnici(eventId: number): Promise<ApiKorisnik[]> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/participants`, { 
    headers: authHeaders() 
  });
  return handleResponse(res);
}

export interface ApiKomentar {
  id: number;
  fotografija_id: number;
  korisnik_id: number;
  ime_korisnika: string;
  sadrzaj: string;
  kreiran_at: string;
}

export interface ApiAlbum {
  id: number;
  event_id: number;
  naziv: string;
  opis: string;
  tip: 'OBICNI' | 'FINALNI';
  share_code: string | null;
  javno: boolean;
  broj_fotografija: number;
}

export interface ApiAlbumDetalji extends ApiAlbum {
  fotografije: ApiFotografija[];
}

export async function deleteAlbum(albumId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Greška pri brisanju albuma');
}

// ─── Helper: Authorization header ────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Helper: provjera odgovora ────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Greška na serveru' }));
    throw new Error(error.detail || 'Greška na serveru');
  }
  return res.json();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function login(email: string, lozinka: string): Promise<{ access_token: string }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, lozinka }),
  });
  return handleResponse(res);
}

export async function getTrenutniKorisnik(): Promise<ApiKorisnik> {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── EVENTI ───────────────────────────────────────────────────────────────────

export async function getEvent(id: number): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function updateEvent(id: number, podaci: Partial<ApiEvent>): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(podaci),
  });
  return handleResponse(res);
}

export async function deleteEvent(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Greška pri brisanju događaja');
}

// ─── FOTOGRAFIJE ──────────────────────────────────────────────────────────────

/** Dohvata sve fotografije za jedan događaj */
export async function getFotografije(eventId: number): Promise<ApiFotografija[]> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/photos`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Dohvata jednu fotografiju */
export async function getFotografija(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Upload jedne ili više fotografija */
export async function uploadFotografije(eventId: number, files: File[]): Promise<ApiFotografija[]> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const res = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    method: 'POST',
    headers: {
      // VAŽNO: ne stavljaj Content-Type ovdje — browser ga sam postavlja za FormData
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  return handleResponse(res);
}

/** Briše fotografiju */
export async function deleteFotografija(photoId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Greška pri brisanju fotografije');
}

/** Toggleuje favorit */
export async function toggleFavorit(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/favorite`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Like fotografije */
export async function likeFotografija(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/like`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Unlike fotografije */
export async function unlikeFotografija(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/like`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── KOMENTARI ────────────────────────────────────────────────────────────────

/** Dohvata komentare za fotografiju */
export async function getKomentari(photoId: number): Promise<ApiKomentar[]> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/comments`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Dodaje novi komentar */
export async function dodajKomentar(photoId: number, sadrzaj: string): Promise<ApiKomentar> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ sadrzaj }),
  });
  return handleResponse(res);
}

/** Briše komentar */
export async function deleteKomentar(komentarId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/comments/${komentarId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Greška pri brisanju komentara');
}

// ─── ALBUMI ───────────────────────────────────────────────────────────────────

/** Dohvata albume za događaj */
export async function getAlbumi(eventId: number): Promise<ApiAlbum[]> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/albums`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Dohvata detalje albuma sa fotografijama */
export async function getAlbum(albumId: number): Promise<ApiAlbumDetalji> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Kreira novi album */
export async function kreirajAlbum(eventId: number, naziv: string, opis: string, tip: 'OBICNI' | 'FINALNI'): Promise<ApiAlbum> {
  const res = await fetch(`${BASE_URL}/albums`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ event_id: eventId, naziv, opis, tip }),
  });
  return handleResponse(res);
}

/** Dodaje fotografiju u album */
export async function dodajFotografijaUAlbum(albumId: number, fotografijaId: number): Promise<ApiAlbumDetalji> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}/photos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fotografija_id: fotografijaId }),
  });
  return handleResponse(res);
}

/** Uklanja fotografiju iz albuma */
export async function ukloniFotografijaIzAlbuma(albumId: number, photoId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Greška pri uklanjanju fotografije');
}

/** Objavljuje finalni album i dobija share_code */
export async function objaviAlbum(albumId: number): Promise<ApiAlbum> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}/publish`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── JAVNI ALBUM (bez prijave) ────────────────────────────────────────────────

/** Dohvata javni album po share kodu — ne treba token */
export async function getJavniAlbum(shareCode: string): Promise<ApiAlbumDetalji> {
  const res = await fetch(`${BASE_URL}/share/albums/${shareCode}`);
  return handleResponse(res);
}

// ─── FEED ─────────────────────────────────────────────────────────────────────

/** Dohvata feed fotografija za trenutnog korisnika */
export async function getFeed(): Promise<ApiFotografija[]> {
  const res = await fetch(`${BASE_URL}/feed`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function register(ime: string, email: string, lozinka: string, uloga: 'ORGANIZATOR' | 'GOST', jezik: string): Promise<ApiKorisnik> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ime, email, lozinka, uloga, jezik }),
  });
  return handleResponse(res);
}

export async function lgin(email: string, lozinka: string): Promise<{ access_token: string }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, lozinka }),
  });
  return handleResponse(res);
}

export function logout(): void {
  
  localStorage.removeItem('token');
}

export async function getMojiEventi(): Promise<ApiEvent[]> {
  const res = await fetch(`${BASE_URL}/events`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function kreirajEvent(naziv: string, datum: string, lokacija: string, opis: string): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ naziv, datum, lokacija, opis }),
  });
  return handleResponse(res);
}

export async function pridruziSeEventu(kod: string): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events/join`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ kod }), // Šaljemo kod u JSON formatu
  });
  return handleResponse(res);
}

// ─── ADMIN PANELI VRAĆAJU OVE TIPOVE ──────────────────────────────────────────

export interface ApiAdminStats {
  broj_korisnika: number;
  broj_eventa: number;
  broj_fotografija: number;
  broj_komentara: number;
  broj_lajkova: number;
  broj_albuma: number;
}

// ─── ADMIN FUNKCIJE ───────────────────────────────────────────────────────────

/** Dohvata globalnu statistiku sistema za admin panel */
export async function getAdminStats(): Promise<ApiAdminStats> {
  const res = await fetch(`${BASE_URL}/admin/stats`, { headers: authHeaders() });
  return handleResponse(res);
}


export async function getAdminUsers(): Promise<ApiKorisnik[]> {
  const res = await fetch(`${BASE_URL}/admin/users`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function toggleBlokirajKorisnika(korisnikId: number, blokiran: boolean): Promise<ApiKorisnik> {
  const res = await fetch(`${BASE_URL}/admin/users/${korisnikId}/block`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ blokiran }),
  });
  return handleResponse(res);
}