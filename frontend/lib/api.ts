// ─────────────────────────────────────────────────────────────────────────────
// src/lib/api.ts
// Jedino mjesto gdje se radi komunikacija sa backendom.
// Sve stranice importuju funkcije odavde — nikad direktno fetch.
// Sada autentifikacija ide preko HttpOnly cookie-a.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8000';

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

export interface ApiTag {
  id: number;
  fotografija_id: number;
  oznaceni_korisnik_id: number;
  oznacio_korisnik_id: number;
  kreiran_at: string;
  oznaceni_korisnik_ime?: string | null;
}

export interface ApiFotografija {
  id: number;
  event_id: number;
  korisnik_id: number;
  url: string;
  vrijeme_uploada: string;
  broj_lajkova: number;
  broj_komentara: number;
  favorit: boolean;
  liked_by_me: boolean;
  tagovi?: ApiTag[];
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

export interface ApiAdminStats {
  broj_korisnika: number;
  broj_eventa: number;
  broj_fotografija: number;
  broj_komentara: number;
  broj_lajkova: number;
  broj_albuma: number;
}
export interface ApiReport {
  id: number;
  email: string;
  tip: 'PROBLEM' | 'SUGESTIJA';
  poruka: string;
  korisnik_id: number | null;
  created_at: string;
}

// ─── Helper: JSON header ──────────────────────────────────────────────────────
// Token više NE uzimamo iz localStorage.
// Backend sada čita token iz HttpOnly cookie-a.

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// ─── Helper: provjera odgovora ────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!res.ok) {
    let detail = 'Greška na serveru';

    try {
      const error = text ? JSON.parse(text) : null;
      detail = error?.detail || detail;
    } catch {
      detail = text || detail;
    }

    throw new Error(detail);
  }

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function login(email: string, lozinka: string): Promise<{ access_token: string; korisnik?: ApiKorisnik }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ email, lozinka }),
  });

  return handleResponse(res);
}

export async function register(
  ime: string,
  email: string,
  lozinka: string,
  uloga: 'ORGANIZATOR' | 'GOST',
  jezik: string
): Promise<ApiKorisnik> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ ime, email, lozinka, uloga, jezik }),
  });

  return handleResponse(res);
}

export async function getTrenutniKorisnik(): Promise<ApiKorisnik> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function logout(): Promise<void> {
  localStorage.removeItem('token');

  const res = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<{ message: string }>(res);
}

// ─── EVENTI ───────────────────────────────────────────────────────────────────

export async function getMojiEventi(): Promise<ApiEvent[]> {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function getEvent(id: number): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function kreirajEvent(
  naziv: string,
  datum: string,
  lokacija: string,
  opis: string
): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ naziv, datum, lokacija, opis }),
  });

  return handleResponse(res);
}

export async function updateEvent(id: number, podaci: Partial<ApiEvent>): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(podaci),
  });

  return handleResponse(res);
}

export async function deleteEvent(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

export async function pridruziSeEventu(kod: string): Promise<ApiEvent> {
  const res = await fetch(`${BASE_URL}/events/join`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ kod }),
  });

  return handleResponse(res);
}

export async function getUcesnici(eventId: number): Promise<ApiKorisnik[]> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/participants`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function ukloniUcesnika(eventId: number, korisnikId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/participants/${korisnikId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

// ─── FOTOGRAFIJE ──────────────────────────────────────────────────────────────

export async function getFotografije(eventId: number): Promise<ApiFotografija[]> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function getFotografija(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function uploadFotografije(eventId: number, files: File[]): Promise<ApiFotografija[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    method: 'POST',
    credentials: 'include',
    // VAŽNO: ne stavljamo Content-Type za FormData.
    // Browser ga sam postavlja.
    body: formData,
  });

  return handleResponse(res);
}

export async function deleteFotografija(photoId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

export async function toggleFavorit(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/favorite`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function likeFotografija(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/like`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function unlikeFotografija(photoId: number): Promise<ApiFotografija> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/like`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

// ─── KOMENTARI ────────────────────────────────────────────────────────────────

export async function getKomentari(photoId: number): Promise<ApiKomentar[]> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/comments`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function dodajKomentar(photoId: number, sadrzaj: string): Promise<ApiKomentar> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ sadrzaj }),
  });

  return handleResponse(res);
}

export async function deleteKomentar(komentarId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/comments/${komentarId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

// ─── TAGOVI ───────────────────────────────────────────────────────────────────

export async function dodajTag(photoId: number, oznaceniKorisnikId: number): Promise<ApiTag> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}/tags`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ oznaceni_korisnik_id: oznaceniKorisnikId }),
  });

  return handleResponse(res);
}

export async function deleteTag(tagId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/tags/${tagId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

// ─── ALBUMI ───────────────────────────────────────────────────────────────────

export async function getAlbumi(eventId: number): Promise<ApiAlbum[]> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/albums`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function getAlbum(albumId: number): Promise<ApiAlbumDetalji> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function kreirajAlbum(
  eventId: number,
  naziv: string,
  opis: string,
  tip: 'OBICNI' | 'FINALNI'
): Promise<ApiAlbum> {
  const res = await fetch(`${BASE_URL}/albums`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ event_id: eventId, naziv, opis, tip }),
  });

  return handleResponse(res);
}

export async function dodajFotografijaUAlbum(
  albumId: number,
  fotografijaId: number
): Promise<ApiAlbumDetalji> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}/photos`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ fotografija_id: fotografijaId }),
  });

  return handleResponse(res);
}

export async function ukloniFotografijaIzAlbuma(albumId: number, photoId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}/photos/${photoId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

export async function objaviAlbum(albumId: number): Promise<ApiAlbum> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}/publish`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({}),
  });

  return handleResponse(res);
}

export async function deleteAlbum(albumId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/albums/${albumId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

// ─── JAVNI ALBUM, BEZ PRIJAVE ─────────────────────────────────────────────────

export async function getJavniAlbum(shareCode: string): Promise<ApiAlbumDetalji> {
  const res = await fetch(`${BASE_URL}/share/albums/${shareCode}`, {
    method: 'GET',
  });

  return handleResponse(res);
}

// ─── FEED ─────────────────────────────────────────────────────────────────────

export async function getFeed(): Promise<ApiFotografija[]> {
  const res = await fetch(`${BASE_URL}/feed`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

// ─── ADMIN FUNKCIJE ───────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<ApiAdminStats> {
  const res = await fetch(`${BASE_URL}/admin/stats`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function getAdminUsers(): Promise<ApiKorisnik[]> {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}

export async function toggleBlokirajKorisnika(
  korisnikId: number,
  blokiran: boolean
): Promise<ApiKorisnik> {
  const res = await fetch(`${BASE_URL}/admin/users/${korisnikId}/block`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ blokiran }),
  });

  return handleResponse(res);
}

export async function deleteAdminUser(korisnikId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/users/${korisnikId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: authHeaders(),
  });

  await handleResponse<void>(res);
}

// ─── REPORT / SUPPORT ────────────────────────────────────────────────────────

export async function kreirajReport(
  email: string,
  tip: 'PROBLEM' | 'SUGESTIJA',
  poruka: string
): Promise<ApiReport> {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify({ email, tip, poruka }),
  });

  return handleResponse(res);
}

export async function getReporti(): Promise<ApiReport[]> {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });

  return handleResponse(res);
}