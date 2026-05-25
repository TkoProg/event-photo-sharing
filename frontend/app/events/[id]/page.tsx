'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Album {
  id: number | string;
  name: string;
  count: number;
}

interface Photo {
  id: number;
  url: string;
  tags: string[];
  isFavorite?: boolean;
}

interface Participant {
  id: number;
  name: string;
}

interface EventData {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  isPrivate: boolean;
  accessCode: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'photos', name: 'Fotografije' },
  { id: 'albums', name: 'Albumi' },
  { id: 'participants', name: 'Učesnici' },
  { id: 'settings', name: 'Postavke' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// TODO: Zamijeniti sa pravim API pozivom — ovo su mock podaci samo za prototip
const MOCK_PHOTOS: Photo[] = [
  { id: 1, url: 'https://picsum.photos/seed/photo-1/400/400', tags: ['mlada', 'vjenčanje', 'ceremonija'] },
  { id: 2, url: 'https://picsum.photos/seed/photo-2/400/400', tags: ['gosti', 'zabava', 'ples'] },
  { id: 3, url: 'https://picsum.photos/seed/photo-3/400/400', tags: ['torta', 'hrana', 'vjenčanje'] },
  { id: 4, url: 'https://picsum.photos/seed/photo-4/400/400', tags: ['priroda', 'dekoracija'] },
];

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/** Čita i piše JSON vrijednosti u localStorage uz type safety */
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

/** Čita albume iz localStorage — jedan hook, bez duplikacije */
function useAlbums() {
  return useLocalStorage<Album[]>('moji_albumi', []);
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function ConfirmModal({
  isOpen,
  title = 'Brisanje',
  message = 'Da li ste sigurni?',
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-gray-400 mb-8">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10"
          >
            Odustani
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 rounded-xl hover:bg-red-600 font-bold"
          >
            Izbriši
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-8 right-8 bg-white text-black px-6 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-right duration-300 font-semibold flex items-center gap-2">
      <span>✨</span> {message}
    </div>
  );
}

/** Jednostavan hook za toast notifikacije */
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



// ─── Tab: Photos ──────────────────────────────────────────────────────────────

// ─── Komponenta za Upload (Drag & Drop) ───────────────────────────────────────
function ImageUploader({ onUploadSuccess }: { onUploadSuccess: (novaSlika: Photo) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const processFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, { file, url: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (previews.length === 0) return;
    setIsUploading(true);
    setTimeout(() => {
      previews.forEach((p, index) => {
        // ⬇️ SVAKA NOVA SLIKA DOBIJA TAG "novo" ⬇️
        const novaSlika: Photo = { id: Date.now() + index, url: p.url, tags: ['novo'] };
        onUploadSuccess(novaSlika);
      });
      setPreviews([]);
      setIsUploading(false);
    }, 2000);
  };

  return (
    <div className="mb-10 bg-[#111] p-6 rounded-3xl border border-white/5">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40 bg-black'}`}
      >
        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
        <div className="text-4xl mb-3">📁</div>
        <p className="font-semibold">Klikni ili prevuci slike ovdje</p>
      </div>

      {previews.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-3">Spremno za upload ({previews.length}):</p>
          <div className="flex gap-4 flex-wrap mb-4">
            {previews.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20">
                <img src={p.url} alt="preview" className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); removePreview(i); }} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs">✕</button>
              </div>
            ))}
          </div>
          <button onClick={handleUpload} disabled={isUploading} className={`w-full py-3 rounded-xl font-bold ${isUploading ? 'bg-gray-600' : 'bg-white text-black'}`}>
            {isUploading ? '⏳ Upload u toku...' : '🚀 Uploaduj slike'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Photos ──────────────────────────────────────────────────────────────
function PhotosTab({ eventId }: { eventId: string }) {
  const [albums] = useAlbums();
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [showUploader, setShowUploader] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const { message: toastMessage, show: showToast } = useToast();
  
  const storageKey = `event_photos_${eventId}`;
  const [photos, setPhotos] = useLocalStorage<Photo[]>(storageKey, MOCK_PHOTOS);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSelectedPhotoId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addPhotoToAlbum = (albumId: number | string, photoUrl: string) => {
  const key = `album_photos_${albumId}`;
  const existing: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
  if (!existing.includes(photoUrl)) {
    localStorage.setItem(key, JSON.stringify([...existing, photoUrl]));
  }
  setSelectedPhotoId(null);
  showToast('Slika dodata u album! 📸');
};

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const res = await fetch(imageUrl); const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = imageName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url); showToast("Preuzimanje započeto! ⬇️");
    } catch { showToast("Greška pri preuzimanju slike ❌"); }
  };

  const handleUploadSuccess = (novaSlika: Photo) => {
    setPhotos(prev => [novaSlika, ...prev]);
    showToast("Slika dodana! ✨");
    setShowUploader(false);
  };

  // 1. Prvo filtriramo slike prema pretrazi (tagovima)
  const filteredPhotos = photos.filter((foto) => {
    if (searchTerm.trim() === '') return true; 
    if (!foto.tags) return false;
    return foto.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // 2. 🚀 NOVO: Sortiramo filtrirane slike tako da veći ID (novija slika) ide na vrh 🚀
  const sortedPhotos = [...filteredPhotos].sort((a, b) => b.id - a.id);

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* HEADER SA SEARCH BAROM I DUGMETOM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold">Galerija fotografija</h2>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input 
              type="text" 
              placeholder="Pretraži (npr. torta, mlada)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-white/30 outline-none transition-all"
            />
          </div>

          <button onClick={() => setShowUploader(!showUploader)} className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shrink-0">
            {showUploader ? "Zatvori" : "+ Dodaj slike"}
          </button>
        </div>
      </div>

      {showUploader && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
          <ImageUploader onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* ⚠️ SADA PROVJERAVAMO I MAPIRAMO SORTIRANU LISTU (sortedPhotos) ⚠️ */}
      {sortedPhotos.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p>Nema slika sa tim tagom.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {sortedPhotos.map((foto) => (
            <div key={foto.id} className="relative group">
              <Link href={`/photos/${foto.id}`}>
                <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 relative cursor-pointer">
                  <img src={foto.url} className="w-full h-full object-cover" />
                </div>
              </Link>
              
              <div className="flex flex-wrap gap-1 mt-3">
                {foto.tags?.map(tag => (
                  <span key={tag} className="bg-white/5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md text-gray-400 border border-white/5">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => setSelectedPhotoId(foto.id === selectedPhotoId ? null : foto.id)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-semibold transition-all">
                  + Album
                </button>
                <button onClick={() => handleDownload(foto.url, `slika-${foto.id}.jpg`)} className="px-4 bg-black border border-white/10 hover:bg-gray-800 py-2 rounded-lg text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
              </div>

              {selectedPhotoId === foto.id && (
                <div ref={menuRef} className="absolute top-16 left-0 right-0 bg-[#1a1a1a] border border-white/10 p-4 rounded-2xl z-20 shadow-2xl">
                  <p className="text-xs text-gray-400 mb-2">Izaberi album:</p>
                  {albums.map((album) => (
                    <button key={album.id} onClick={() => addPhotoToAlbum(album.id, foto.url)} className="block w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg text-sm">
                      {album.name}
                    </button>
                  ))}
                  <button onClick={() => setSelectedPhotoId(null)} className="mt-2 text-xs text-red-400">Odustani</button>
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
function AlbumsTab({ eventId }: { eventId: string }) {
  const [albums, setAlbums] = useAlbums();
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  
  // 🚀 NOVO: State u koji spremamo albume sa tačno izbrojanim slikama
  const [realAlbums, setRealAlbums] = useState<Album[]>([]);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    try {
      // 1. Brojimo favorite
      const storageKey = `event_photos_${eventId}`;
      const savedPhotos = localStorage.getItem(storageKey);
      if (savedPhotos) {
        const photos: Photo[] = JSON.parse(savedPhotos);
        const favorites = photos.filter((p) => p.isFavorite === true);
        setFavCount(favorites.length);
      }

      // 2. 🚀 BROJIMO PRAVI BROJ SLIKA ZA SVE OSTALE ALBUME 🚀
      const updatedAlbums = albums.map(album => {
        // Zavirujemo u bazu da vidimo koliko slika ima OVAJ konkretni album
        const photosInThisAlbum = JSON.parse(localStorage.getItem(`album_photos_${album.id}`) || '[]');
        return {
          ...album,
          count: photosInThisAlbum.length // Prepisujemo stari broj sa pravim stanjem!
        };
      });
      
      setRealAlbums(updatedAlbums);

    } catch (err) {
      console.error('Greška pri učitavanju brojača:', err);
    }
  }, [eventId, albums]);

  const handleDelete = () => {
    if (deleteId == null) return;
    setAlbums((prev) => prev.filter((a) => a.id !== deleteId));
    localStorage.removeItem(`album_photos_${deleteId}`);
    setDeleteId(null);
  };

  const favoritesAlbum: Album = {
    id: 'favorites',
    name: '⭐ Favoriti',
    count: favCount,
  };

  // Spajamo Favorite sa našim novim, tačnim albumima
  const allVisibleAlbums = [favoritesAlbum, ...realAlbums];

export default function EventGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Moji albumi</h2>
        <Link
          href={`/events/${eventId}/albums/create`}
          className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5"
        >
          + Kreiraj album
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allVisibleAlbums.map((album) => (
          <div key={album.id} className="bg-white/5 p-6 rounded-3xl relative flex flex-col justify-between min-h-[130px] border border-white/5 hover:border-white/10 transition-all">
            <Link href={`/events/${eventId}/albums/${album.id}`}>
              <h3 className="text-xl font-bold hover:underline">{album.name}</h3>
              <p className="text-xs text-gray-500 mt-2">{album.count} fotografija</p>
            </Link>
            
            {album.id !== 'favorites' && (
              <button
                aria-label="Izbriši album"
                onClick={() => setDeleteId(album.id as number | string)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tvoj postojeći Modal za brisanje */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Tab: Participants ────────────────────────────────────────────────────────

function ParticipantsTab({ eventId }: { eventId: string }) {
  const storageKey = `event_users_${eventId}`;
  const [participants, setParticipants] = useLocalStorage<Participant[]>(storageKey, []);

  const simulateJoin = () => {
    setParticipants((prev) => [
      ...prev,
      { id: Date.now(), name: `Novi Korisnik ${prev.length + 1}` },
    ]);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold">Učesnici događaja</h2>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Prijavljeni ({participants.length})</h3>
        <button
          onClick={simulateJoin}
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
        >
          + Simuliraj login učesnika
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.length === 0 ? (
          <p className="text-gray-500 italic">Još niko se nije prijavio.</p>
        ) : (
          participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────

const EMPTY_EVENT: EventData = {
  id: 0,
  name: '',
  date: '',
  location: '',
  description: '',
  isPrivate: false,
  accessCode: '',
};

function FormField({
  label,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 tracking-wider uppercase flex items-center gap-1.5 ml-1">
        <span>{icon}</span> {label}
      </label>
      <input
        {...props}
        className="w-full bg-[#111] border border-white/5 p-4 rounded-full text-white text-sm focus:border-white/20 focus:ring-0 transition-all placeholder:text-gray-700"
      />
    </div>
  );
}

function SettingsTab({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [data, setData] = useState<EventData>(EMPTY_EVENT);
  const [saveModal, setSaveModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('moji_dogadjaji');
      if (!saved) return;
      const events: EventData[] = JSON.parse(saved);
      const current = events.find((e) => String(e.id) === String(eventId));
      if (current) setData(current);
    } catch (err) {
      console.error('Greška pri učitavanju događaja:', err);
    }
  }, [eventId]);

  const handleSave = () => {
    try {
      const saved = localStorage.getItem('moji_dogadjaji');
      const events: EventData[] = saved ? JSON.parse(saved) : [];
      const updated = events.map((e) => (String(e.id) === String(eventId) ? data : e));
      localStorage.setItem('moji_dogadjaji', JSON.stringify(updated));
    } catch (err) {
      console.error('Greška pri čuvanju:', err);
    } finally {
      setSaveModal(false);
    }
  };

  const handleDelete = () => {
    try {
      const saved = localStorage.getItem('moji_dogadjaji');
      if (!saved) return;
      const filtered = (JSON.parse(saved) as EventData[]).filter(
        (e) => String(e.id) !== String(eventId)
      );
      localStorage.setItem('moji_dogadjaji', JSON.stringify(filtered));
      router.push('/'); // ✅ Next.js router umjesto window.location
    } catch (err) {
      console.error('Greška pri brisanju:', err);
    }
  };

  return (
    <div className="max-w-xl space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Osnovno */}
      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">Osnovne informacije</h3>
          <p className="text-gray-500 text-sm mt-1">Ažurirajte ključne detalje o svom događaju.</p>
        </div>
        <div className="space-y-4">
          <FormField
            label="Naziv događaja"
            icon="✏️"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Svadba..."
          />
          <FormField
            label="Datum"
            icon="🗓️"
            value={data.date}
            onChange={(e) => setData({ ...data, date: e.target.value })}
            placeholder="15.06.2026"
          />
          <FormField
            label="Lokacija"
            icon="📍"
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            placeholder="Sarajevo..."
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 tracking-wider uppercase flex items-center gap-1.5 ml-1">
              <span>📝</span> Opis
            </label>
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full bg-[#111] border border-white/5 p-4 rounded-3xl text-white text-sm focus:border-white/20 focus:ring-0 transition-all placeholder:text-gray-700 min-h-[100px]"
              placeholder="Kratki opis..."
            />
          </div>
        </div>
      </section>

      {/* Privatnost */}
      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight">Privatnost</h3>
          <p className="text-gray-500 text-sm mt-1">Upravljajte pristupom svojim fotografijama.</p>
        </div>
        <div
          className="bg-[#111] p-5 rounded-full border border-white/5 flex items-center justify-between gap-4 cursor-pointer hover:border-white/10 transition-all"
          onClick={() => setData({ ...data, isPrivate: !data.isPrivate })}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{data.isPrivate ? '🔒' : '🔓'}</span>
            <div>
              <p className="font-semibold text-sm">Privatan događaj</p>
              <p className="text-xs text-gray-500">
                {data.isPrivate ? 'Potreban pristupni kod' : 'Svi sa linkom mogu pristupiti'}
              </p>
            </div>
          </div>
          <div
            className={`w-10 h-5 rounded-full p-0.5 flex transition-all ${data.isPrivate ? 'bg-white justify-end' : 'bg-gray-800 justify-start'}`}
          >
            <div className="w-4 h-4 bg-black rounded-full" />
          </div>
        </div>
        {data.isPrivate && (
          <FormField
            label="Pristupni kod"
            icon="🔑"
            value={data.accessCode}
            onChange={(e) => setData({ ...data, accessCode: e.target.value })}
            placeholder="SARA2026"
          />
        )}
      </section>

      {/* Spremi */}
      <button
        onClick={() => setSaveModal(true)}
        className="w-full bg-white text-black py-4 rounded-full font-bold hover:bg-gray-200 transition-all text-sm active:scale-[0.98]"
      >
        Sačuvaj promjene
      </button>

      <div className="h-px bg-white/5 w-full my-12" />

      {/* Danger zone */}
      <section className="space-y-6">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight text-red-500">Danger Zone</h3>
          <p className="text-red-500/70 text-sm">Ove akcije su trajne i nepovratne.</p>
        </div>
        <button
          onClick={() => setDeleteModal(true)}
          className="mt-2 w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-full font-semibold hover:bg-red-500 hover:text-white transition-all text-sm"
        >
          Trajno izbriši događaj
        </button>
      </section>

      {/* ✅ Custom modali umjesto alert/confirm */}
      <ConfirmModal
        isOpen={saveModal}
        title="Sačuvaj promjene"
        message="Da li želiš sačuvati izmjene?"
        onClose={() => setSaveModal(false)}
        onConfirm={handleSave}
      />
      <ConfirmModal
        isOpen={deleteModal}
        title="⚠️ Trajno brisanje"
        message="Ova akcija briše događaj i sve slike. Jesi li sigurna?"
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
      />
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

  const [eventName, setEventName] = useState('Učitavanje...');

  useEffect(() => {
  try {
    let events: EventData[];
    const saved = localStorage.getItem('moji_dogadjaji');

    if (!saved) {
      // Kreira testne događaje ako localStorage prazan
      events = [
        { id: 1, name: 'Svadba Ana i Marko', date: '2026-06-30', location: 'Sarajevo', description: '', isPrivate: false, accessCode: '' },
        { id: 2, name: 'Rođendan', date: '2026-07-15', location: 'Mostar', description: '', isPrivate: false, accessCode: '' },
      ];
      localStorage.setItem('moji_dogadjaji', JSON.stringify(events));
    } else {
      events = JSON.parse(saved);
    }

    const found = events.find((e) => String(e.id) === String(id));
    setEventName(found?.name ?? `Događaj #${id}`);
  } catch {
    setEventName(`Događaj #${id}`);
  }
}, [id]);

  const handleTabChange = (tabId: TabId) => {
    router.replace(`${pathname}?tab=${tabId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans overflow-x-hidden w-full max-w-[100vw]">
      <div className="max-w-6xl mx-auto w-full">
        
        <header className="mb-6 md:mb-10 w-full">
          <Link href="/organizer/events" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
            ← Moji događaji
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight truncate">{eventName}</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-lg">Dobrodošli u kontrolnu ploču događaja.</p>
        </header>

        <nav className="flex w-full justify-between border-b border-white/10 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 text-center py-3 px-1 text-[10px] sm:text-[13px] font-bold transition-all truncate ${
                activeTab === tab.id
                  ? 'text-white border-b-[3px] border-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>

        <div className="mt-6 min-h-[400px] w-full">
          {activeTab === 'photos' && <PhotosTab eventId={id} />}
          {activeTab === 'albums' && <AlbumsTab eventId={id} />}
          {activeTab === 'participants' && <ParticipantsTab eventId={id} />}
          {activeTab === 'settings' && <SettingsTab eventId={id} />}
        </div>
      </div>
    </div>
  );
}