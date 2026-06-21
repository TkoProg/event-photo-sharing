'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  getEvent, updateEvent, deleteEvent, deleteAlbum,
  getFotografije, toggleFavorit,
  getAlbumi, dodajFotografijaUAlbum, getTrenutniKorisnik,
  ApiFotografija, ApiAlbum, ApiAITag, ApiTag, getUcesnici, ApiKorisnik, ukloniUcesnika
} from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
type GalleryPhoto = ApiFotografija & { tagovi?: ApiTag[]; ai_tagovi?: ApiAITag[] };
type AlbumWithPhotos = ApiAlbum & { fotografije?: GalleryPhoto[] };
type DashboardTexts = typeof PREVODI.BS;

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
    aiFilter: 'Filtriraj po AI tagovima',
    ocistiFilter: 'Očisti',
    sveSlike: 'Sve slike',
    samoMoje: 'Samo moje',
    galerijaPrazna: 'Galerija je prazna.',
    dodajUAlbum: '+ Album', izaberiAlbum: 'Izaberi album:', nemaAlbuma: 'Nemaš još albuma.',
    odustani: 'Odustani', mojiAlbumi: 'Moji albumi', kreirajAlbum: '+ Kreiraj album',
    favoriti: 'Favoriti', fotografija: 'fotografija', albumPrazan: 'Nemaš još albuma.',
    slikaDodataUAlbum: 'Slika dodata u album! ✅',
    brisanjeAlbumaNaslov: 'Brisanje albuma',
    brisanjeAlbumaPitanje: 'Da li želiš obrisati ovaj album?',
    izbrisiDugme: 'Obriši',
    odustaniDugme: 'Odustani',
    ucesniciNaslov: 'Učesnici događaja', prijavljeni: 'Prijavljeni',
    ukloniUcesnika: 'Ukloni',
    ucesnikUklonjen: 'Učesnik je uklonjen.',
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
    aiFilter: 'Filter by AI tags',
    ocistiFilter: 'Clear',
    sveSlike: 'All photos',
    samoMoje: 'Only mine',
    galerijaPrazna: 'The gallery is empty.',
    dodajUAlbum: '+ Album', izaberiAlbum: 'Choose album:', nemaAlbuma: "No albums yet.",
    odustani: 'Cancel', mojiAlbumi: 'My albums', kreirajAlbum: '+ Create album',
    favoriti: 'Favorites', fotografija: 'photos', albumPrazan: "No albums yet.",
    slikaDodataUAlbum: 'Photo added to album! ✅',
    brisanjeAlbumaNaslov: 'Delete album',
    brisanjeAlbumaPitanje: 'Do you want to delete this album?',
    izbrisiDugme: 'Delete',
    odustaniDugme: 'Cancel',
    ucesniciNaslov: 'Event participants', prijavljeni: 'Registered',
    ukloniUcesnika: 'Remove',
    ucesnikUklonjen: 'Participant removed.',
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

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
};

function ConfirmModal({ isOpen, title, message, onClose, onConfirm, confirmLabel, cancelLabel, danger = false }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-gray-400 mb-8">{message}</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 font-semibold">{cancelLabel}</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-3 rounded-xl font-bold ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-white text-black hover:bg-gray-200'}`}>{confirmLabel}</button>
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
function PhotosTab({ eventId, t, mozeSve }: { eventId: string; t: DashboardTexts; mozeSve: boolean }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<AlbumWithPhotos[]>([]);
  const [ucesnici, setUcesnici] = useState<ApiKorisnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [samoMoje, setSamoMoje] = useState(false);
  const [trenutniKorisnikId, setTrenutniKorisnikId] = useState<number | null>(null);
  const [selectedAITags, setSelectedAITags] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const { message: toastMsg, show: showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [f, a] = await Promise.all([
          getFotografije(Number(eventId)),
          getAlbumi(Number(eventId)),
        ]);
        if (cancelled) return;
        setPhotos(f); setAlbums(a);
        if (mozeSve) {
          const u = await getUcesnici(Number(eventId));
          if (!cancelled) setUcesnici(u);
        }
        try {
          const k = await getTrenutniKorisnik();
          if (!cancelled) setTrenutniKorisnikId(k.id);
        } catch {}
      } catch { if (!cancelled) showToast(t.greska); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [eventId, mozeSve, showToast, t.greska]);

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

  const filtered = photos.filter((foto) => {
    if (samoMoje && trenutniKorisnikId) {
      const naSlici = foto.tagovi?.some((tag) => tag.oznaceni_korisnik_id === trenutniKorisnikId);
      if (!naSlici) return false;
    }

    // AI tag filtering
    if (selectedAITags.length > 0) {
      const fotoAITags = (foto.ai_tagovi || [])
        .filter((tag) => tag.status === 'ACCEPTED')
        .map((tag) => tag.tag_naziv);
      const hasSelectedTag = selectedAITags.some(tag => fotoAITags.includes(tag));
      if (!hasSelectedTag) return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    if (String(foto.id).includes(term)) return true;
    const matchTag = foto.tagovi?.some((tag) => {
      const u = ucesnici.find(u => u.id === tag.oznaceni_korisnik_id);
      const ime = tag.oznaceni_korisnik_ime || u?.ime || '';
      return ime.toLowerCase().includes(term);
    });
    return !!matchTag;
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
        <div className="flex flex-wrap md:flex-nowrap w-full md:w-auto gap-2 md:gap-3">
          {trenutniKorisnikId && (
            <button onClick={() => setSamoMoje(!samoMoje)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border shrink-0 ${samoMoje ? 'bg-[#e60023] border-[#e60023] text-white' : 'bg-[#111] border-white/10 text-gray-300 hover:border-white/30'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>{samoMoje ? t.sveSlike : t.samoMoje}</span>
            </button>
          )}
          <div className="relative flex-1 min-w-35 md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input type="text" placeholder={t.pretrazi} value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs md:text-sm text-white focus:border-white/30 outline-none" />
          </div>
          <Link href={`/events/${eventId}/upload`}
            className="bg-white text-black px-4 py-2 rounded-xl text-xs md:text-sm font-bold shrink-0 hover:bg-gray-200 transition-all flex items-center">
            {t.dodajSlike}
          </Link>
        </div>
      </div>

      {/* AI Tag Filter */}
      {Boolean(photos.find(p => (p.ai_tagovi || []).length > 0)) && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
          <p className="text-xs font-bold text-blue-400 mb-3">🤖 {t.aiFilter}</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(
              photos
                .flatMap(p => (p.ai_tagovi || []).filter(t => t.status === 'ACCEPTED'))
                .map(t => t.tag_naziv)
            )).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedAITags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                )}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedAITags.includes(tag)
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedAITags.length > 0 && (
              <button
                onClick={() => setSelectedAITags([])}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all"
              >
                ✕ {t.ocistiFilter}
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">{searchTerm || samoMoje || selectedAITags.length > 0 ? '🔍' : '📭'}</p>
          <p>{searchTerm || samoMoje || selectedAITags.length > 0 ? t.nemaTaga : t.galerijaPrazna}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filtered.map(foto => {
            const tagoviOsoba = foto.tagovi ?? [];
            const aiTagovi = foto.ai_tagovi ?? [];

            return (
            <div key={foto.id} className="relative group flex flex-col">
              
              <Link href={`/photos/${foto.id}`} className="relative z-0">
                <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/30 transition-all">
                  <img src={foto.url} className="w-full h-full object-cover" alt="Slika" />
                </div>
              </Link>

              {/* Akcije ispod slike */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2 md:mt-3">
                {mozeSve && (
                  <button onClick={() => setSelectedPhotoId(foto.id === selectedPhotoId ? null : foto.id)}
                    className="flex-1 min-w-15 bg-white/10 hover:bg-white/20 px-2 py-1.5 md:py-2 rounded-lg text-[11px] md:text-sm font-semibold transition-all">
                    {t.dodajUAlbum}
                  </button>
                )}
                
                {mozeSve && (
                  <button onClick={() => handleFavorit(foto)}
                    className={`px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm transition-all shrink-0 ${foto.favorit ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 hover:bg-white/20 text-gray-400'}`}>
                    ⭐
                  </button>
                )}
                
                <button onClick={() => handleDownload(foto.url, `slika-${foto.id}.jpg`)}
                  className="px-2 py-1.5 md:px-3 md:py-2 bg-black border border-white/10 hover:bg-gray-800 rounded-lg text-white shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="md:w-4 md:h-4">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>

                {tagoviOsoba.length > 0 && (
                  <span className="ml-auto text-white/30 text-[10px] md:text-[11px] flex items-center gap-1 hover:text-white/60 cursor-help shrink-0"
                    title={`Označenih osoba: ${tagoviOsoba.length}`}>
                    {tagoviOsoba.length}
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="md:w-3 md:h-3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                )}

                {aiTagovi.filter((tag) => tag.status === 'ACCEPTED').length > 0 && (
                  <span className="text-blue-400/70 text-[10px] md:text-[11px] flex items-center gap-1 hover:text-blue-400 cursor-help shrink-0"
                    title={`AI tagovi: ${aiTagovi.filter((tag) => tag.status === 'ACCEPTED').map((tag) => tag.tag_naziv).join(', ')}`}>
                    🤖 {aiTagovi.filter((tag) => tag.status === 'ACCEPTED').length}
                  </span>
                )}
              </div>

              {/* Modal za odabir albuma */}
              {selectedPhotoId === foto.id && (
                <div ref={menuRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] bg-[#1a1a1a]/95 backdrop-blur-md border border-white/20 p-3 md:p-4 rounded-2xl z-20 shadow-2xl">
                  <p className="text-[10px] md:text-xs text-gray-400 mb-2">{t.izaberiAlbum}</p>
                  
                  {albums.length === 0 && <p className="text-[10px] md:text-xs text-gray-600 italic">{t.nemaAlbuma}</p>}
                  
                  <div className="max-h-32 md:max-h-40 overflow-y-auto space-y-1">
                    {albums.map(album => (
                      <button key={album.id}
                        onClick={async () => {
                          const slikaVecPostoji = album.fotografije?.some((f) => f.id === foto.id);
                          if (slikaVecPostoji) {
                            showToast('Ova slika je već u tom albumu! 📸');
                            setSelectedPhotoId(null);
                            return;
                          }

                          try {
                            await dodajFotografijaUAlbum(album.id, foto.id);
                            setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, broj_fotografija: (a.broj_fotografija || 0) + 1 } : a));
                            showToast(t.slikaDodataUAlbum);
                            setSelectedPhotoId(null);
                          } catch { showToast(t.greska); }
                        }}
                        className="block w-full text-left px-2 py-1.5 md:px-3 md:py-2 hover:bg-white/10 rounded-lg text-xs md:text-sm font-medium truncate transition-colors">
                        {album.naziv}
                      </button>
                    ))}
                  </div>
                  
                  <button onClick={() => setSelectedPhotoId(null)} className="mt-2 w-full text-center py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] md:text-xs text-red-400 font-bold transition-colors">
                    {t.odustani}
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}

// ─── Tab: Albums ──────────────────────────────────────────────────────────────
function AlbumsTab({ eventId, t, mozeSve, jeAdmin }: { eventId: string; t: DashboardTexts; mozeSve: boolean; jeAdmin: boolean }) {
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [favCount, setFavCount] = useState(0);
  const [deleteAlbumModal, setDeleteAlbumModal] = useState<{ isOpen: boolean; albumId: number | null }>({ isOpen: false, albumId: null });
  const { message: toastMsg, show: showToast } = useToast();

  useEffect(() => {
    getAlbumi(Number(eventId))
      .then(setAlbums)
      .catch(() => showToast(t.greska))
      .finally(() => setLoading(false));
      
    getFotografije(Number(eventId))
      .then(photos => setFavCount(photos.filter(p => p.favorit).length))
      .catch(() => {});
  }, [eventId, showToast, t.greska]);

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
          <Link href={`/events/${eventId}/albums/create`}
            className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
            {t.kreirajAlbum}
          </Link>
        )}
      </div>

      {allAlbums.length === 1 && favCount === 0 ? (
        <p className="text-gray-500 italic">{t.albumPrazan}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {allAlbums.map(album => (
            <div key={album.id} className="bg-white/5 p-5 md:p-6 rounded-3xl relative border border-white/5 hover:border-white/10 transition-all flex items-center gap-4 group">
              
              {/* Ikonica fascikle (ili zvijezda za favorite) */}
              <div className="text-4xl shrink-0 transition-transform duration-300 group-hover:scale-110">
                {album.id === 'favorites' ? '⭐' : '📁'}
              </div>
              
                      <div className="grow min-w-0 pr-6">
                <Link href={`/events/${eventId}/albums/${album.id}`} className="block">
                  <h3 className="text-lg md:text-xl font-bold hover:underline truncate">{album.naziv}</h3>
                  <p className="text-xs text-gray-500 mt-1">{album.broj_fotografija} {t.fotografija}</p>
                </Link>
              </div>

              {/* Brisanje — samo admin, i ne za favorites */}
              {jeAdmin && album.id !== 'favorites' && (
                <button
                  onClick={() => setDeleteAlbumModal({ isOpen: true, albumId: Number(album.id) })}
                  className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-600 hover:text-red-500 transition-colors p-1"
                  title="Obriši album"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal za brisanje albuma */}
      <ConfirmModal
        isOpen={deleteAlbumModal.isOpen}
        title={t.brisanjeAlbumaNaslov}
        message={t.brisanjeAlbumaPitanje}
        confirmLabel={t.izbrisiDugme}
        cancelLabel={t.odustaniDugme}
        danger={true}
        onClose={() => setDeleteAlbumModal({ isOpen: false, albumId: null })}
        onConfirm={async () => {
          if (deleteAlbumModal.albumId) {
            try {
              await deleteAlbum(deleteAlbumModal.albumId);
              setAlbums(prev => prev.filter(a => Number(a.id) !== deleteAlbumModal.albumId));
              showToast('Album obrisan! ✅');
            } catch { showToast(t.greska); }
          }
          setDeleteAlbumModal({ isOpen: false, albumId: null });
        }}
      />
      <Toast message={toastMsg} />
    </div>
  );
}

// ─── Tab: Participants ────────────────────────────────────────────────────────
function ParticipantsTab({ eventId, t }: { eventId: string; t: T }) {
  const [participants, setParticipants] = useState<ApiKorisnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { message: toastMsg, show: showToast } = useToast();

  useEffect(() => {
    getUcesnici(Number(eventId))
      .then(setParticipants)
      .catch(() => showToast(t.greska))
      .finally(() => setLoading(false));
  }, [eventId, showToast, t.greska]);

  const handleRemoveParticipant = async (participantId: number) => {
    setRemovingId(participantId);

    try {
      await ukloniUcesnika(Number(eventId), participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      showToast(t.ucesnikUklonjen);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.greska;

      if (message === "Ucesnik ne postoji na ovom eventu.") {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        showToast(t.ucesnikUklonjen);
        return;
      }

      showToast(message || t.greska);
    } finally {
      setRemovingId(null);
    }
  };

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
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
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
              <button
                type="button"
                disabled={removingId === p.id}
                onClick={() => handleRemoveParticipant(p.id)}
                className="text-xs px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingId === p.id ? '...' : t.ukloniUcesnika}
              </button>
            </div>
          ))
        )}
      </div>
      <Toast message={toastMsg} />
    </div>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────
function SettingsTab({ eventId, t }: { eventId: string; t: T }) {
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
  }, [eventId, showToast, t.greska]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { kod: _kod, ...formBezKoda } = form;
      await updateEvent(Number(eventId), formBezKoda);
      showToast(t.promjeneSacuvane);
    } catch {
      showToast(t.greska);
    }
    finally { setSaving(false); setSaveModal(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(Number(eventId));
      window.location.href = '/organizer/events';
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t.greska);
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
              className="w-full bg-[#111] border border-white/5 p-4 rounded-3xl text-white text-sm focus:border-white/20 transition-all placeholder:text-gray-700 min-h-25"
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

      <ConfirmModal isOpen={saveModal} title={t.sacuvajNaslov} message={t.sacuvajPitanje} confirmLabel={t.izbrisi} cancelLabel={t.modalOdustani} onClose={() => setSaveModal(false)} onConfirm={handleSave} />
      <ConfirmModal isOpen={deleteModal} title={t.brisanjeNaslov} message={t.brisanjePitanje} confirmLabel={t.izbrisi} cancelLabel={t.modalOdustani} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} />
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
  const jeOrganizator = uloga === 'ORGANIZATOR';
  const jeAdmin = uloga === 'ADMIN';
  const mozeSve = jeOrganizator || jeAdmin;

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) {
      window.requestAnimationFrame(() => setJezik(sacuvani));
    }
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
      .filter(tab => mozeSve || (tab.id !== 'settings' && tab.id !== 'participants'))
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

        <div className="mt-6 min-h-100 w-full">
          {activeTab === 'photos' && <PhotosTab eventId={id} t={t} mozeSve={mozeSve} />}
          {activeTab === 'albums' && <AlbumsTab eventId={id} t={t} mozeSve={mozeSve} jeAdmin={jeAdmin} />}
          {activeTab === 'participants' && mozeSve && <ParticipantsTab eventId={id} t={t} />}
          {activeTab === 'settings' && mozeSve && <SettingsTab eventId={id} t={t} />}
        </div>
      </div>
    </div>
  );
}
