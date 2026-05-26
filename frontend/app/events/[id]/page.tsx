'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Album { id: number | string; name: string; count: number; }
interface Photo { id: number; url: string; tags: string[]; isFavorite?: boolean;likes?: number; isLiked?: boolean; comments?: { user: string; text: string }[]; }
interface Participant { id: number; name: string; }
interface EventData { id: number; name: string; date: string; location: string; description: string; isPrivate: boolean; accessCode: string; }

const TABS_RAW = [
  { id: 'photos', bs: 'Fotografije', en: 'Photos' },
  { id: 'albums', bs: 'Albumi', en: 'Albums' },
  { id: 'participants', bs: 'Učesnici', en: 'Participants' },
  { id: 'settings', bs: 'Postavke', en: 'Settings' },
] as const;
type TabId = (typeof TABS_RAW)[number]['id'];

const MOCK_PHOTOS: Photo[] = [
  { id: 1, url: 'https://picsum.photos/seed/photo-1/400/400', tags: ['mlada', 'vjenčanje'] },
  { id: 2, url: 'https://picsum.photos/seed/photo-2/400/400', tags: ['gosti', 'zabava'] },
  { id: 3, url: 'https://picsum.photos/seed/photo-3/400/400', tags: ['torta', 'hrana'] },
  { id: 4, url: 'https://picsum.photos/seed/photo-4/400/400', tags: ['priroda'] },
];

const EMPTY_EVENT: EventData = { id: 0, name: '', date: '', location: '', description: '', isPrivate: false, accessCode: '' };

// ─── Prijevodi ────────────────────────────────────────────────────────────────
const PREVODI = {
  BS: {
    // Navigacija
    nazad: '← Moji događaji',
    dobrodosli: 'Dobrodošli u kontrolnu ploču događaja.',
    // Fotografije tab
    galerija: 'Galerija fotografija',
    dodajSlike: '+ Dodaj slike',
    zatvori: 'Zatvori',
    pretrazi: 'Pretraži po tagu...',
    nemaTaga: 'Nema slika sa tim tagom.',
    dodajUAlbum: '+ Album',
    izaberiAlbum: 'Izaberi album:',
    nemaAlbuma: 'Nemaš još albuma.',
    odustani: 'Odustani',
    // Upload
    uploadInstrukcija: 'Klikni ili prevuci slike ovdje',
    spremnoZaUpload: 'Spremno za upload',
    uploadUToku: '⏳ Upload u toku...',
    dugmeUpload: '🚀 Uploaduj slike',
    // Albumi tab
    mojiAlbumi: 'Moji albumi',
    kreirajAlbum: '+ Kreiraj album',
    favoriti: '⭐ Favoriti',
    fotografija: 'fotografija',
    albumPrazan: 'Nemaš još albuma. Kreiraj prvi!',
    // Učesnici tab
    ucesniciNaslov: 'Učesnici događaja',
    prijavljeni: 'Prijavljeni',
    simuliraj: '+ Simuliraj login učesnika',
    josNiko: 'Još niko se nije prijavio.',
    online: 'Online',
    // Postavke tab
    osnovneInfo: 'Osnovne informacije',
    osnovneInfoOpis: 'Ažurirajte ključne detalje o svom događaju.',
    nazivDogadjaja: 'Naziv događaja',
    datum: 'Datum',
    lokacija: 'Lokacija',
    opis: 'Opis',
    privatnost: 'Privatnost',
    privatnostOpis: 'Upravljajte pristupom.',
    privatanDogadjaj: 'Privatan događaj',
    potrebanKod: 'Potreban pristupni kod',
    svimaDostupan: 'Svi sa linkom mogu pristupiti',
    pristupniKod: 'Pristupni kod',
    sacuvajPromjene: 'Sačuvaj promjene',
    dangerZone: 'Danger Zone',
    dangerOpis: 'Ove akcije su trajne i nepovratne.',
    obrisiDogadjaj: 'Trajno izbriši događaj',
    // Modali
    sacuvajNaslov: 'Sačuvaj promjene',
    sacuvajPitanje: 'Da li želiš sačuvati izmjene?',
    brisanjeNaslov: '⚠️ Trajno brisanje',
    brisanjePitanje: 'Ova akcija briše događaj i sve slike. Jesi li sigurna?',
    brisanjeAlbumNaslov: 'Brisanje albuma',
    brisanjeAlbumPitanje: 'Da li si sigurna da želiš obrisati ovaj album?',
    izbrisi: 'Izbriši',
    modalOdustani: 'Odustani',
    // Toast
    slikaDodataUAlbum: 'Slika dodata u album! 📸',
    slikaDodana: 'Slika je uspješno uploadana! ✨',
    slikeDodane: 'Slike su uspješno uploadane! 📸',
    promjeneSacuvane: 'Promjene sačuvane! ✅',
  },
  EN: {
    // Navigation
    nazad: '← My events',
    dobrodosli: 'Welcome to the event dashboard.',
    // Photos tab
    galerija: 'Photo gallery',
    dodajSlike: '+ Add photos',
    zatvori: 'Close',
    pretrazi: 'Search by tag...',
    nemaTaga: 'No photos with this tag.',
    dodajUAlbum: '+ Album',
    izaberiAlbum: 'Choose album:',
    nemaAlbuma: "You don't have any albums yet.",
    odustani: 'Cancel',
    // Upload
    uploadInstrukcija: 'Click or drag images here',
    spremnoZaUpload: 'Ready to upload',
    uploadUToku: '⏳ Uploading...',
    dugmeUpload: '🚀 Upload images',
    // Albums tab
    mojiAlbumi: 'My albums',
    kreirajAlbum: '+ Create album',
    favoriti: '⭐ Favorites',
    fotografija: 'photos',
    albumPrazan: "You don't have any albums yet. Create your first!",
    // Participants tab
    ucesniciNaslov: 'Event participants',
    prijavljeni: 'Registered',
    simuliraj: '+ Simulate participant login',
    josNiko: 'Nobody has joined yet.',
    online: 'Online',
    // Settings tab
    osnovneInfo: 'Basic information',
    osnovneInfoOpis: 'Update the key details about your event.',
    nazivDogadjaja: 'Event name',
    datum: 'Date',
    lokacija: 'Location',
    opis: 'Description',
    privatnost: 'Privacy',
    privatnostOpis: 'Manage access to your photos.',
    privatanDogadjaj: 'Private event',
    potrebanKod: 'Access code required',
    svimaDostupan: 'Anyone with the link can access',
    pristupniKod: 'Access code',
    sacuvajPromjene: 'Save changes',
    dangerZone: 'Danger Zone',
    dangerOpis: 'These actions are permanent and irreversible.',
    obrisiDogadjaj: 'Permanently delete event',
    // Modals
    sacuvajNaslov: 'Save changes',
    sacuvajPitanje: 'Do you want to save your changes?',
    brisanjeNaslov: '⚠️ Permanent deletion',
    brisanjePitanje: 'This will delete the event and all photos. Are you sure?',
    brisanjeAlbumNaslov: 'Delete album',
    brisanjeAlbumPitanje: 'Are you sure you want to delete this album?',
    izbrisi: 'Delete',
    modalOdustani: 'Cancel',
    // Toast
    slikaDodataUAlbum: 'Photo added to album! 📸',
    slikaDodana: 'Photo successfully uploaded! ✨',
    slikeDodane: 'Photos successfully uploaded! 📸',
    promjeneSacuvane: 'Changes saved! ✅',
  }
};

type T = typeof PREVODI.BS;

// ─── Custom Hooks ─────────────────────────────────────────────────────────────
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item) as T);
    } catch {}
    setLoaded(true);
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    localStorage.setItem(key, JSON.stringify(valueToStore));
  }, [key, storedValue]);

  return [storedValue, setValue, loaded] as const;
}

function useAlbums() {
  const [v, s, l] = useLocalStorage<Album[]>('moji_albumi', []);
  return [v, s, l] as const;
}

function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = setTimeout(() => setMessage(null), 3000);
  }, []);
  return { message, show };
}

// ─── Shared UI Components ─────────────────────────────────────────────────────
function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-8 right-8 bg-white text-black px-6 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right duration-300 font-semibold flex items-center gap-2">
      <span>✨</span> {message}
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

// ─── ImageUploader ────────────────────────────────────────────────────────────
function ImageUploader({ onUploadSuccess, t }: { onUploadSuccess: (s: Photo[]) => void; t: T }) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[] | null) => {
    console.log("Broj primljenih fajlova:", files?.length ?? 0);
    if (!files) return;
    
    // Pretvaramo FileList u običan niz
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
    
    const newPreviews = await Promise.all(
      imageFiles.map(file => {
        return new Promise<{ file: File; url: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ file, url: reader.result as string });
          reader.readAsDataURL(file);
        });
      })
    );

    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = () => {
    if (previews.length === 0) return;
    
    setIsUploading(true);

    const photosToUpload = previews.map((p, index) => ({
      id: Date.now() + index,
      url: p.url,
      tags: [],
      likes: 0,
      isLiked: false,
      isFavorite: false,
      comments: []
    }));

    setTimeout(() => {
      onUploadSuccess(photosToUpload);
      setPreviews([]);
      setIsUploading(false);
    }, 2000);
  };

  return (
    <div className="mb-10 bg-[#111] p-6 rounded-3xl border border-white/5">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40 bg-black'}`}>
        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef}
          onChange={e => processFiles(e.target.files)} />
        <div className="text-4xl mb-3">📁</div>
        <p className="font-semibold">{t.uploadInstrukcija}</p>
      </div>
      {previews.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-3">{t.spremnoZaUpload} ({previews.length}):</p>
          <div className="flex gap-4 flex-wrap mb-4">
            {previews.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20">
                <img src={p.url} alt="preview" className="w-full h-full object-cover" />
                <button onClick={e => { e.stopPropagation(); setPreviews(prev => prev.filter((_, idx) => idx !== i)); }}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs">✕</button>
              </div>
            ))}
          </div>
          <button onClick={handleUpload} disabled={isUploading}
            className={`w-full py-3 rounded-xl font-bold ${isUploading ? 'bg-gray-600 text-white' : 'bg-white text-black'}`}>
            {isUploading ? t.uploadUToku : t.dugmeUpload}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Photos ──────────────────────────────────────────────────────────────
function PhotosTab({ eventId, t }: { eventId: string; t: T }) {
  const [albums] = useAlbums();
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const { message: toastMessage, show: showToast } = useToast();

  const storageKey = `event_photos_${eventId}`;
  const [photos, setPhotos, photosLoaded] = useLocalStorage<Photo[]>(storageKey, MOCK_PHOTOS);

  useEffect(() => {
    const saved = localStorage.getItem(`event_photos_${eventId}`);
    if (!saved) {
      localStorage.setItem(`event_photos_${eventId}`, JSON.stringify(MOCK_PHOTOS));
      setPhotos(MOCK_PHOTOS); // Ažuriraj state da se odmah prikažu
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSelectedPhotoId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const addPhotoToAlbum = (albumId: number | string, photoUrl: string) => {
    const key = `album_photos_${albumId}`;
    const existing: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!existing.includes(photoUrl)) localStorage.setItem(key, JSON.stringify([...existing, photoUrl]));
    setSelectedPhotoId(null);
    showToast(t.slikaDodataUAlbum);
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = imageName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('⬇️');
    } catch { showToast('❌'); }
  };

  const sortedPhotos = [...photos]
    .filter(foto => !searchTerm.trim() || foto.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => b.id - a.id);

  if (!photos) return <div className="text-center">Loading...</div>;

  // Loading skeleton dok se slike učitavaju
  if (!photosLoaded) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold">{t.galerija}</h2>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input type="text" placeholder={t.pretrazi} value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all" />
          </div>
          <button onClick={() => setShowUploader(!showUploader)}
            className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shrink-0">
            {showUploader ? t.zatvori : t.dodajSlike}
          </button>
        </div>
      </div>

      {showUploader && (
        <ImageUploader 
          t={t} 
          onUploadSuccess={(noveSlike : Photo[]) => {
            setPhotos(prev => [...noveSlike, ...prev]);

            const updatedAllPhotos = [...noveSlike, ...photos];
            localStorage.setItem(storageKey, JSON.stringify(updatedAllPhotos));

            const poruka = noveSlike.length > 1 ? t.slikeDodane : t.slikaDodana;
    
            showToast(poruka);
            setShowUploader(false);
          }} 
        />
      )}

      {sortedPhotos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p>{t.nemaTaga}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {sortedPhotos.map(foto => (
            <div key={foto.id} className="relative group">
              {foto.url ? (
                  <Link href={`/photos/${foto.id}`}>
                    <div className="aspect-square ...">
                      <img src={foto.url} className="w-full h-full object-cover" alt="Slika" />
                    </div>
                  </Link>
                ) : (
                  <div className="aspect-square bg-white/5 flex items-center justify-center">
                    Photo not found :(
                  </div>
                )}
              <div className="flex flex-wrap gap-1 mt-3">
                {foto.tags?.map(tag => (
                  <span key={tag} className="bg-white/5 text-[10px] uppercase px-2 py-1 rounded-md text-gray-400 border border-white/5">#{tag}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setSelectedPhotoId(foto.id === selectedPhotoId ? null : foto.id)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-semibold transition-all">
                  {t.dodajUAlbum}
                </button>
                <button onClick={() => handleDownload(foto.url, `slika-${foto.id}.jpg`)}
                  className="px-4 bg-black border border-white/10 hover:bg-gray-800 py-2 rounded-lg text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
              {selectedPhotoId === foto.id && (
                <div ref={menuRef} className="absolute top-16 left-0 right-0 bg-[#1a1a1a] border border-white/10 p-4 rounded-2xl z-20 shadow-2xl">
                  <p className="text-xs text-gray-400 mb-2">{t.izaberiAlbum}</p>
                  {albums.length === 0 && <p className="text-xs text-gray-600 italic">{t.nemaAlbuma}</p>}
                  {albums.map(album => (
                    <button key={album.id} onClick={() => addPhotoToAlbum(album.id, foto.url)}
                      className="block w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm">{album.name}</button>
                  ))}
                  <button onClick={() => setSelectedPhotoId(null)} className="mt-2 text-xs text-red-400">{t.odustani}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Toast message={toastMessage} />
    </div>
  );
}

// ─── Tab: Albums ──────────────────────────────────────────────────────────────
function AlbumsTab({ eventId, t }: { eventId: string; t: T }) {
  const [albums, setAlbums] = useAlbums();
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [realAlbums, setRealAlbums] = useState<Album[]>([]);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    try {
      const savedPhotos = localStorage.getItem(`event_photos_${eventId}`);
      if (savedPhotos) {
        const photos: Photo[] = JSON.parse(savedPhotos);
        setFavCount(photos.filter(p => p.isFavorite).length);
      }
      setRealAlbums(albums.map(album => ({
        ...album,
        count: JSON.parse(localStorage.getItem(`album_photos_${album.id}`) || '[]').length,
      })));
    } catch (err) { console.error(err); }
  }, [eventId, albums]);

  const allVisibleAlbums = [
    { id: 'favorites', name: t.favoriti, count: favCount },
    ...realAlbums,
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">{t.mojiAlbumi}</h2>
        <Link href={`/events/${eventId}/albums/create`}
          className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
          {t.kreirajAlbum}
        </Link>
      </div>

      {allVisibleAlbums.length === 1 && allVisibleAlbums[0].id === 'favorites' && favCount === 0 ? (
        <p className="text-gray-500 italic">{t.albumPrazan}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allVisibleAlbums.map(album => (
            <div key={album.id} className="bg-white/5 p-6 rounded-3xl relative flex flex-col justify-between min-h-[130px] border border-white/5 hover:border-white/10 transition-all">
              <Link href={`/events/${eventId}/albums/${album.id}`}>
                <h3 className="text-xl font-bold hover:underline">{album.name}</h3>
                <p className="text-xs text-gray-500 mt-2">{album.count} {t.fotografija}</p>
              </Link>
              {album.id !== 'favorites' && (
                <button onClick={() => setDeleteId(album.id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-400 transition-colors">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title={t.brisanjeAlbumNaslov}
        message={t.brisanjeAlbumPitanje}
        t={t}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          setAlbums(prev => prev.filter(a => a.id !== deleteId));
          localStorage.removeItem(`album_photos_${deleteId}`);
          setDeleteId(null);
        }}
      />
    </div>
  );
}

// ─── Tab: Participants ────────────────────────────────────────────────────────
function ParticipantsTab({ eventId, t }: { eventId: string; t: T }) {
  const [participants, setParticipants] = useLocalStorage<Participant[]>(`event_users_${eventId}`, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold">{t.ucesniciNaslov}</h2>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{t.prijavljeni} ({participants.length})</h3>
        <button
          onClick={() => setParticipants(prev => [...prev, { id: Date.now(), name: `Novi Korisnik ${prev.length + 1}` }])}
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all">
          {t.simuliraj}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.length === 0 ? (
          <p className="text-gray-500 italic">{t.josNiko}</p>
        ) : (
          participants.map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-green-400">{t.online}</p>
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
  const [data, setData] = useState<EventData>(EMPTY_EVENT);
  const [saveModal, setSaveModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const { message: toastMessage, show: showToast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('moji_dogadjaji');
      if (!saved) return;
      const events: EventData[] = JSON.parse(saved);
      const current = events.find(e => String(e.id) === String(eventId));
      if (current) setData(current);
    } catch (err) { console.error(err); }
  }, [eventId]);

  const handleSave = () => {
    try {
      const saved = localStorage.getItem('moji_dogadjaji');
      const events: EventData[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('moji_dogadjaji', JSON.stringify(events.map(e => String(e.id) === String(eventId) ? data : e)));
      showToast(t.promjeneSacuvane);
    } catch (err) { console.error(err); }
    finally { setSaveModal(false); }
  };

  const handleDelete = () => {
    try {
      const saved = localStorage.getItem('moji_dogadjaji');
      if (!saved) return;
      localStorage.setItem('moji_dogadjaji', JSON.stringify((JSON.parse(saved) as EventData[]).filter(e => String(e.id) !== String(eventId))));
      router.push('/');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-xl space-y-10 animate-in fade-in duration-500 pb-20">
      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">{t.osnovneInfo}</h3>
          <p className="text-gray-500 text-sm mt-1">{t.osnovneInfoOpis}</p>
        </div>
        <div className="space-y-4">
          <FormField label={t.nazivDogadjaja} icon="✏️" value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })} placeholder="Svadba..." />
          <FormField label={t.datum} icon="🗓️" value={data.date}
            onChange={e => setData({ ...data, date: e.target.value })} placeholder="15.06.2026" />
          <FormField label={t.lokacija} icon="📍" value={data.location}
            onChange={e => setData({ ...data, location: e.target.value })} placeholder="Sarajevo..." />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 tracking-wider uppercase flex items-center gap-1.5 ml-1">
              <span>📝</span> {t.opis}
            </label>
            <textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })}
              className="w-full bg-[#111] border border-white/5 p-4 rounded-3xl text-white text-sm focus:border-white/20 focus:ring-0 transition-all placeholder:text-gray-700 min-h-[100px]"
              placeholder="..." />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">{t.privatnost}</h3>
          <p className="text-gray-500 text-sm mt-1">{t.privatnostOpis}</p>
        </div>
        <div className="bg-[#111] p-5 rounded-full border border-white/5 flex items-center justify-between gap-4 cursor-pointer hover:border-white/10 transition-all"
          onClick={() => setData({ ...data, isPrivate: !data.isPrivate })}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{data.isPrivate ? '🔒' : '🔓'}</span>
            <div>
              <p className="font-semibold text-sm">{t.privatanDogadjaj}</p>
              <p className="text-xs text-gray-500">{data.isPrivate ? t.potrebanKod : t.svimaDostupan}</p>
            </div>
          </div>
          <div className={`w-10 h-5 rounded-full p-0.5 flex transition-all ${data.isPrivate ? 'bg-white justify-end' : 'bg-gray-800 justify-start'}`}>
            <div className="w-4 h-4 bg-black rounded-full" />
          </div>
        </div>
        {data.isPrivate && (
          <FormField label={t.pristupniKod} icon="🔑" value={data.accessCode}
            onChange={e => setData({ ...data, accessCode: e.target.value })} placeholder="SARA2026" />
        )}
      </section>

      <button onClick={() => setSaveModal(true)}
        className="w-full bg-white text-black py-4 rounded-full font-bold hover:bg-gray-200 transition-all text-sm active:scale-[0.98]">
        {t.sacuvajPromjene}
      </button>

      <div className="h-px bg-white/5 w-full my-12" />

      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight text-red-500">{t.dangerZone}</h3>
          <p className="text-red-500/70 text-sm">{t.dangerOpis}</p>
        </div>
        <button onClick={() => setDeleteModal(true)}
          className="mt-2 w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-full font-semibold hover:bg-red-500 hover:text-white transition-all text-sm">
          {t.obrisiDogadjaj}
        </button>
      </section>

      <ConfirmModal isOpen={saveModal} title={t.sacuvajNaslov} message={t.sacuvajPitanje} t={t}
        onClose={() => setSaveModal(false)} onConfirm={handleSave} />
      <ConfirmModal isOpen={deleteModal} title={t.brisanjeNaslov} message={t.brisanjePitanje} t={t}
        onClose={() => setDeleteModal(false)} onConfirm={handleDelete} />
      <Toast message={toastMessage} />
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
  const [jezik, setJezik] = useState('BS');

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) setJezik(sacuvani);
    const provjeri = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };
    window.addEventListener('storage', provjeri);
    return () => window.removeEventListener('storage', provjeri);
  }, []);

  useEffect(() => {
    try {
      let events: EventData[];
      const saved = localStorage.getItem('moji_dogadjaji');
      if (!saved) {
        events = [
          { id: 1, name: 'Svadba Ana i Marko', date: '2026-06-30', location: 'Sarajevo', description: '', isPrivate: false, accessCode: '' },
          { id: 2, name: 'Rođendan', date: '2026-07-15', location: 'Mostar', description: '', isPrivate: false, accessCode: '' },
        ];
        localStorage.setItem('moji_dogadjaji', JSON.stringify(events));
      } else {
        events = JSON.parse(saved);
      }
      const found = events.find(e => String(e.id) === String(id));
      setEventName(found?.name ?? `Događaj #${id}`);
    } catch { setEventName(`Događaj #${id}`); }
  }, [id]);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const tabs = TABS_RAW.map(tab => ({ id: tab.id, name: jezik === 'BS' ? tab.bs : tab.en }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans overflow-x-hidden w-full max-w-[100vw]">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-6 md:mb-10 w-full">
          <Link href="/organizer/events"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
            {t.nazad}
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight truncate">{eventName}</h1>
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
          {activeTab === 'photos' && <PhotosTab eventId={id} t={t} />}
          {activeTab === 'albums' && <AlbumsTab eventId={id} t={t} />}
          {activeTab === 'participants' && <ParticipantsTab eventId={id} t={t} />}
          {activeTab === 'settings' && <SettingsTab eventId={id} t={t} />}
        </div>
      </div>
    </div>
  );
}