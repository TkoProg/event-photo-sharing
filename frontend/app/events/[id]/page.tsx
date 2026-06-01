'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  getEvent, updateEvent, deleteEvent, deleteAlbum,
  getFotografije, deleteFotografija, toggleFavorit,
  getAlbumi, dodajFotografijaUAlbum, getTrenutniKorisnik,
  ApiEvent, ApiFotografija, ApiAlbum, getUcesnici, ApiKorisnik
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant { id: number; name: string; }

const TABS_RAW = [
  { id: 'photos', bs: 'Fotografije', en: 'Photos' },
  { id: 'albums', bs: 'Albumi', en: 'Albums' },
  { id: 'participants', bs: 'Učesnici', en: 'Participants' },
  { id: 'settings', bs: 'Postavke', en: 'Settings' },
] as const;
type TabId = (typeof TABS_RAW)[number]['id'];

// ─── Prijevodi ────────────────────────────────────────────────────────────────
const PREVODI = {
  BS: {
    nazad: '← Moji događaji', dobrodosli: 'Dobrodošli u kontrolnu ploču događaja.',
    galerija: 'Galerija fotografija', dodajSlike: '+ Dodaj slike', zatvori: 'Zatvori',
    pretrazi: 'Pretraži po tagu...', nemaTaga: 'Nema slika sa tim tagom.',
    dodajUAlbum: '+ Album', izaberiAlbum: 'Izaberi album:', nemaAlbuma: 'Nemaš još albuma.',
    odustani: 'Odustani', mojiAlbumi: 'Moji albumi', kreirajAlbum: '+ Kreiraj album',
    favoriti: '⭐ Favoriti', fotografija: 'fotografija', albumPrazan: 'Nemaš još albuma.',
    ucesniciNaslov: 'Učesnici događaja', prijavljeni: 'Prijavljeni',
    simuliraj: '+ Simuliraj login učesnika', josNiko: 'Još niko se nije prijavio.',
    osnovneInfo: 'Osnovne informacije', osnovneInfoOpis: 'Ažurirajte ključne detalje.',
    nazivDogadjaja: 'Naziv događaja', datum: 'Datum', lokacija: 'Lokacija', opis: 'Opis',
    privatnost: 'Privatnost', privatnostOpis: 'Upravljajte pristupom.',
    privatanDogadjaj: 'Status događaja',
    potrebanKod: 'Događaj je zatvoren za goste',
    svimaDostupan: 'Događaj je aktivan i dostupan gostima', pristupniKod: 'Pristupni kod',
    sacuvajPromjene: 'Sačuvaj promjene', dangerZone: 'Danger Zone',
    dangerOpis: 'Ove akcije su trajne i nepovratne.', obrisiDogadjaj: 'Trajno izbriši događaj',
    sacuvajNaslov: 'Sačuvaj promjene', sacuvajPitanje: 'Da li želiš sačuvati izmjene?',
    brisanjeNaslov: '⚠️ Trajno brisanje', brisanjePitanje: 'Ova akcija briše događaj. Jesi li sigurna?',
    izbrisi: 'Sačuvaj', modalOdustani: 'Odustani',
    promjeneSacuvane: 'Promjene sačuvane! ✅', greska: 'Greška. Pokušaj ponovo.',
    lajkova: 'lajkova', uFavoritima: '⭐ Favorit', dodajUFavorite: '☆ Dodaj u favorite',
    aktivan: 'Aktivan', blokiran: 'Blokiran'
  },
  EN: {
    nazad: '← My events', dobrodosli: 'Welcome to the event dashboard.',
    galerija: 'Photo gallery', dodajSlike: '+ Add photos', zatvori: 'Close',
    pretrazi: 'Search by tag...', nemaTaga: 'No photos with this tag.',
    dodajUAlbum: '+ Album', izaberiAlbum: 'Choose album:', nemaAlbuma: "No albums yet.",
    odustani: 'Cancel', mojiAlbumi: 'My albums', kreirajAlbum: '+ Create album',
    favoriti: '⭐ Favorites', fotografija: 'photos', albumPrazan: "No albums yet.",
    ucesniciNaslov: 'Event participants', prijavljeni: 'Registered',
    simuliraj: '+ Simulate login', josNiko: 'Nobody joined yet.',
    osnovneInfo: 'Basic information', osnovneInfoOpis: 'Update key details.',
    nazivDogadjaja: 'Event name', datum: 'Date', lokacija: 'Location', opis: 'Description',
    privatnost: 'Privacy', privatnostOpis: 'Manage access.',
    privatanDogadjaj: 'Event status',
    potrebanKod: 'Event is closed for guests',
    svimaDostupan: 'Event is active and available to guests', pristupniKod: 'Access code',
    sacuvajPromjene: 'Save changes', dangerZone: 'Danger Zone',
    dangerOpis: 'These actions are permanent.', obrisiDogadjaj: 'Permanently delete event',
    sacuvajNaslov: 'Save changes', sacuvajPitanje: 'Save your changes?',
    brisanjeNaslov: '⚠️ Delete', brisanjePitanje: 'This will delete the event. Are you sure?',
    izbrisi: 'Save', modalOdustani: 'Cancel',
    promjeneSacuvane: 'Changes saved! ✅', greska: 'Error. Please try again.',
    lajkova: 'likes', uFavoritima: '⭐ Favorite', dodajUFavorite: '☆ Add to favorites',
    aktivan: 'Active', blokiran: 'Blocked'
  }
};
type T = typeof PREVODI.BS;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useLocalStorage<V>(key: string, init: V) {
  const [val, setVal] = useState<V>(init);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setVal(JSON.parse(s)); } catch {}
  }, [key]);
  const set = useCallback((v: V | ((p: V) => V)) => {
    const toStore = v instanceof Function ? v(val) : v;
    setVal(toStore); localStorage.setItem(key, JSON.stringify(toStore));
  }, [key, val]);
  return [val, set] as const;
}

function useKorisnik() {
  const [uloga, setUloga] = useState<string | null>(null);

  useEffect(() => {
    getTrenutniKorisnik()
      .then(k => setUloga(k.uloga))
      .catch(() => setUloga('GOST'));
  }, []);

  return uloga;
}

function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(null), 3000);
  }, []);
  return { message, show };
}

// ─── Shared Components ────────────────────────────────────────────────────────
function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-8 right-8 bg-white text-black px-6 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right duration-300 font-semibold flex items-center gap-2">
      ✨ {message}
    </div>
  );
}

function ConfirmModal({ isOpen, title, message, onClose, onConfirm, t }: {
  isOpen: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void; t: T;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-gray-400 mb-8">{message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10">{t.modalOdustani}</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-500 rounded-xl hover:bg-red-600 font-bold">{t.izbrisi}</button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 tracking-wider uppercase flex items-center gap-1.5 ml-1">
        <span>{icon}</span> {label}
      </label>
      <input {...props} className="w-full bg-[#111] border border-white/5 p-4 rounded-full text-white text-sm focus:border-white/20 focus:ring-0 transition-all placeholder:text-gray-700" />
    </div>
  );
}

// ─── Tab: Photos ──────────────────────────────────────────────────────────────
function PhotosTab({ eventId, t, mozeSve }: {eventId: string; t: T; mozeSve: boolean; }) {
  const [photos, setPhotos] = useState<ApiFotografija[]>([]);
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [ucesnici, setUcesnici] = useState<ApiKorisnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { message: toastMsg, show: showToast } = useToast();

  useEffect(() => {
    Promise.all([
      getFotografije(Number(eventId)),
      getAlbumi(Number(eventId)),
      getUcesnici(Number(eventId)),
    ]).then(([f, a, u]) => { 
        setPhotos(f); 
        setAlbums(a); 
        setUcesnici(u);
    })
      .catch(() => showToast(t.greska))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSelectedPhotoId(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleFavorit = async (photo: ApiFotografija) => {
    try {
      const updated = await toggleFavorit(photo.id);
      setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch { showToast(t.greska); }
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = name;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch { showToast(t.greska); }
  };

  const filtered = photos.filter(foto => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    // 1. Da li se pretraga poklapa sa ID-jem slike?
    if (String(foto.id).includes(term)) return true;

    // 2. Da li se pretraga poklapa sa nekim od tagovanih ljudi?
    if (foto.tagovi && foto.tagovi.length > 0) {
      const imaPoklapanje = foto.tagovi.some(tag => {
        const ucesnik = ucesnici.find(u => u.id === tag.oznaceni_korisnik_id);
        return ucesnik && ucesnik.ime.toLowerCase().includes(term);
      });
      if (imaPoklapanje) return true;
    }

    return false;
  });

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
      {[1,2,3,4].map(i => <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold">{t.galerija}</h2>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input type="text" placeholder={t.pretrazi} value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-white/30 outline-none" />
          </div>
          {/* Dugme vodi na upload stranicu */}
          <Link href={`/events/${eventId}/upload`}
            className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shrink-0 hover:bg-gray-200 transition-all">
            {t.dodajSlike}
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p>{t.nemaTaga}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filtered.map(foto => (
            <div key={foto.id} className="relative group">
              <Link href={`/photos/${foto.id}`}>
                <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/30 transition-all">
                  <img src={foto.url} className="w-full h-full object-cover" alt="Slika" />
                </div>
              </Link>

              <div className="flex gap-2 mt-3">
                {/* Dodaj u album — samo organizator/admin */}
                {mozeSve && (
                  <button onClick={() => setSelectedPhotoId(foto.id === selectedPhotoId ? null : foto.id)}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-semibold transition-all">
                    {t.dodajUAlbum}
                  </button>
                )}
                {/* Favorit — samo organizator/admin */}
                {mozeSve && (
                  <button onClick={() => handleFavorit(foto)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${foto.favorit ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 hover:bg-white/20 text-gray-400'}`}>
                    ⭐
                  </button>
                )}
                {/* Download — svi */}
                <button onClick={() => handleDownload(foto.url, `slika-${foto.id}.jpg`)}
                  className="px-3 bg-black border border-white/10 hover:bg-gray-800 py-2 rounded-lg text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                {/* DESNA STRANA: Indikator tagova */}
                {foto.tagovi && foto.tagovi.length > 0 && (
                  <span className="text-white/30 text-[11px] font-medium flex items-center gap-1.5 transition-colors hover:text-white/60 cursor-help" title={`Označeno osoba: ${foto.tagovi.length}`}>
                    {foto.tagovi.length}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                )}
              </div>
              {selectedPhotoId === foto.id && (
                <div ref={menuRef} className="absolute top-16 left-0 right-0 bg-[#1a1a1a] border border-white/10 p-4 rounded-2xl z-20 shadow-2xl">
                  <p className="text-xs text-gray-400 mb-2">{t.izaberiAlbum}</p>
                  {albums.length === 0 && <p className="text-xs text-gray-600 italic">{t.nemaAlbuma}</p>}
                  {albums.map(album => (
                    <button key={album.id}
                      onClick={async () => {
                        try {
                          await dodajFotografijaUAlbum(album.id, foto.id);
                          showToast('Slika dodata u album! 📸');
                          setSelectedPhotoId(null);
                        } catch { showToast(t.greska); }
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm">
                      {album.naziv}
                    </button>
                  ))}
                  <button onClick={() => setSelectedPhotoId(null)} className="mt-2 text-xs text-red-400">{t.odustani}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}

// ─── Tab: Albums ──────────────────────────────────────────────────────────────
function AlbumsTab({ eventId, t, mozeSve, jeAdmin }: { eventId: string; t: T; mozeSve: boolean;jeAdmin: boolean; }) {
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const { message: toastMsg, show: showToast } = useToast();

  useEffect(() => {
    getAlbumi(Number(eventId))
      .then(setAlbums)
      .catch(() => showToast(t.greska))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Broji favorite iz fotografija
  const [favCount, setFavCount] = useState(0);
  useEffect(() => {
    getFotografije(Number(eventId))
      .then(photos => setFavCount(photos.filter(p => p.favorit).length))
      .catch(() => {});
  }, [eventId]);

  const allAlbums = [
    { id: 'favorites', naziv: t.favoriti, broj_fotografija: favCount },
    ...albums,
  ];

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">{t.mojiAlbumi}</h2>
        {mozeSve && (
          <Link href={`/events/${eventId}/albums/create`} className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
            {t.kreirajAlbum}
          </Link>
        )}
      </div>

      {allAlbums.length === 1 && favCount === 0 ? (
        <p className="text-gray-500 italic">{t.albumPrazan}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allAlbums.map(album => (
            <div key={album.id} className="bg-white/5 p-6 rounded-3xl relative flex flex-col justify-between min-h-[130px] border border-white/5 hover:border-white/10 transition-all">
              <Link href={`/events/${eventId}/albums/${album.id}`}>
                <h3 className="text-xl font-bold hover:underline">{album.naziv}</h3>
                <p className="text-xs text-gray-500 mt-2">{album.broj_fotografija} {t.fotografija}</p>
              </Link>
              {/* X dugme — samo admin */}
              {jeAdmin && album.id !== 'favorites' && (
                <button onClick={async () => {
                  try {
                    await deleteAlbum(Number(album.id));
                    setAlbums(prev => prev.filter(a => a.id !== album.id));
                  } catch { showToast(t.greska); }
                }}
                className="absolute top-4 right-4 text-red-500 hover:text-red-400">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}

// ─── Tab: Participants ────────────────────────────────────────────────────────
function ParticipantsTab({ eventId, t }: { eventId: string; t: T }) {
  const [participants, setParticipants] = useState<ApiKorisnik[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUcesnici(Number(eventId))
      .then(setParticipants)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold">{t.ucesniciNaslov}</h2>
      <h3 className="text-xl font-semibold">
        {t.prijavljeni} ({participants.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.length === 0 ? (
          <p className="text-gray-500 italic">{t.josNiko}</p>
        ) : (
          participants.map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                {p.ime.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">
                  {p.uloga === 'GOST' ? 'Gost' : p.ime}
                </p>
                <p className="text-xs text-gray-400">{p.email}</p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  p.uloga === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                  p.uloga === 'ORGANIZATOR' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {p.uloga}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────
function SettingsTab({ eventId, t }: { eventId: string; t: T }) {
  const router = useRouter();
  const [form, setForm] = useState({ naziv: '', datum: '', lokacija: '', opis: '', aktivan: true, kod: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const { message: toastMsg, show: showToast } = useToast();

  useEffect(() => {
    getEvent(Number(eventId))
      .then(e => setForm({ naziv: e.naziv, datum: e.datum, lokacija: e.lokacija, opis: e.opis, aktivan: e.aktivan, kod: e.kod }))
      .catch(() => showToast(t.greska))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { kod, ...formBezKoda } = form;
    await updateEvent(Number(eventId), formBezKoda);
      showToast(t.promjeneSacuvane);
    } catch { showToast(t.greska); }
    finally { setSaving(false); setSaveModal(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(Number(eventId));
      window.location.href = '/organizer/events';
    } catch (err: any) {
      showToast(err.message || t.greska);
      setDeleteModal(false);
    }
  };

  if (loading) return (
    <div className="max-w-xl space-y-4 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-full bg-white/5" />)}
    </div>
  );

  return (
    <div className="max-w-xl space-y-10 animate-in fade-in duration-500 pb-20">
      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">{t.osnovneInfo}</h3>
          <p className="text-gray-500 text-sm mt-1">{t.osnovneInfoOpis}</p>
        </div>
        <div className="space-y-4">
          <FormField label={t.nazivDogadjaja} icon="✏️" value={form.naziv} onChange={e => setForm({ ...form, naziv: e.target.value })} placeholder="Svadba..." />
          <FormField label={t.datum} icon="🗓️" type="date" value={form.datum} onChange={e => setForm({ ...form, datum: e.target.value })} />
          <FormField label={t.lokacija} icon="📍" value={form.lokacija} onChange={e => setForm({ ...form, lokacija: e.target.value })} placeholder="Sarajevo..." />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 tracking-wider uppercase flex items-center gap-1.5 ml-1"><span>📝</span> {t.opis}</label>
            <textarea value={form.opis} onChange={e => setForm({ ...form, opis: e.target.value })}
              className="w-full bg-[#111] border border-white/5 p-4 rounded-3xl text-white text-sm focus:border-white/20 transition-all placeholder:text-gray-700 min-h-[100px]"
              placeholder="Kratki opis..." />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">{t.privatnost}</h3>
          <p className="text-gray-500 text-sm mt-1">{t.privatnostOpis}</p>
        </div>
        <div className="bg-[#111] p-5 rounded-full border border-white/5 flex items-center justify-between gap-4 cursor-pointer hover:border-white/10 transition-all"
          onClick={() => setForm({ ...form, aktivan: !form.aktivan })}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{form.aktivan ? '✅' : '⛔'}</span>
            <div>
              <p className="font-semibold text-sm">{t.privatanDogadjaj}</p>
              <p className="text-xs text-gray-500">{form.aktivan ? t.svimaDostupan : t.potrebanKod}</p>
            </div>
          </div>
          <div className={`w-10 h-5 rounded-full p-0.5 flex transition-all ${form.aktivan ? 'bg-white justify-end' : 'bg-gray-800 justify-start'}`}>
            <div className="w-4 h-4 bg-black rounded-full" />
          </div>
        </div>
      </section>

      <button onClick={() => setSaveModal(true)} disabled={saving}
        className="w-full bg-white text-black py-4 rounded-full font-bold hover:bg-gray-200 transition-all text-sm active:scale-[0.98] disabled:opacity-50">
        {saving ? '...' : t.sacuvajPromjene}
      </button>

      <div className="h-px bg-white/5 w-full my-12" />

      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight text-red-500">{t.dangerZone}</h3>
          <p className="text-red-500/70 text-sm">{t.dangerOpis}</p>
        </div>
        <button onClick={() => setDeleteModal(true)}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-full font-semibold hover:bg-red-500 hover:text-white transition-all text-sm">
          {t.obrisiDogadjaj}
        </button>
      </section>

      <ConfirmModal isOpen={saveModal} title={t.sacuvajNaslov} message={t.sacuvajPitanje} t={t} onClose={() => setSaveModal(false)} onConfirm={handleSave} />
      <ConfirmModal isOpen={deleteModal} title={t.brisanjeNaslov} message={t.brisanjePitanje} t={t} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} />
      <Toast message={toastMsg} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventDashboard() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') ?? 'photos') as TabId;
  const [eventName, setEventName] = useState('...');
  const [eventLoading, setEventLoading] = useState(true);
  const [jezik, setJezik] = useState('BS');
  const uloga = useKorisnik();
  const jeGost = uloga === 'GOST';
  const jeOrganizator = uloga === 'ORGANIZATOR';
  const jeAdmin = uloga === 'ADMIN';
  const mozeSve = jeOrganizator || jeAdmin;

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) setJezik(sacuvani);
    const provjeri = () => {
      const t = localStorage.getItem('izabraniJezik');
      if (t) setJezik(t);
    };
    window.addEventListener('storage', provjeri);
    return () => window.removeEventListener('storage', provjeri);
  }, []);

  useEffect(() => {
    if (!id) return;
    getEvent(Number(id))
      .then(e => setEventName(e.naziv))
      .catch(() => setEventName(`Događaj #${id}`))
      .finally(() => setEventLoading(false));
  }, [id]);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const tabs = TABS_RAW
    .filter(tab => {
      if (!mozeSve && tab.id === 'settings') return false;
      if (!mozeSve && tab.id === 'participants') return false;
      if (!mozeSve && tab.id === 'albums') return false;
      return true;
    })
    .map(tab => ({ id: tab.id, name: jezik === 'BS' ? tab.bs : tab.en }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans overflow-x-hidden w-full max-w-[100vw]">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-6 md:mb-10 w-full">
          <Link href="/organizer/events" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
            {t.nazad}
          </Link>
          {eventLoading ? (
            <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse" />
          ) : (
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight truncate">{eventName}</h1>
          )}
          <p className="text-gray-400 mt-2 text-sm md:text-lg">{t.dobrodosli}</p>
        </header>

        <nav className="flex w-full justify-between border-b border-white/10 mb-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => router.replace(`${pathname}?tab=${tab.id}`)}
              className={`flex-1 text-center py-3 px-1 text-[10px] sm:text-[13px] font-bold transition-all truncate ${activeTab === tab.id ? 'text-white border-b-[3px] border-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab.name}
            </button>
          ))}
        </nav>

        <div className="mt-6 min-h-[400px] w-full">
          {activeTab === 'photos' && <PhotosTab eventId={id} t={t} mozeSve={mozeSve} />}
          {activeTab === 'albums' && mozeSve && <AlbumsTab eventId={id} t={t} mozeSve={mozeSve} jeAdmin={jeAdmin} />}
          {activeTab === 'participants' && mozeSve && <ParticipantsTab eventId={id} t={t} />}
          {activeTab === 'settings' && mozeSve && <SettingsTab eventId={id} t={t} />}
        </div>
      </div>
    </div>
  );
}