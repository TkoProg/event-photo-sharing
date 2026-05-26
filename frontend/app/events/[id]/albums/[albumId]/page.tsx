'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Photo {
  id: number;
  url: string;
  isFavorite?: boolean;
}

interface Album {
  id: number | string;
  name: string;
  count: number;
}

const MOCK_PHOTOS: Photo[] = [
  { id: 1, url: 'https://picsum.photos/seed/photo-1/400/400', isFavorite: false },
  { id: 2, url: 'https://picsum.photos/seed/photo-2/400/400', isFavorite: true },
  { id: 3, url: 'https://picsum.photos/seed/photo-3/400/400', isFavorite: false },
  { id: 4, url: 'https://picsum.photos/seed/photo-4/400/400', isFavorite: false },
];

export default function AlbumDetails() {
  const params = useParams();
  const eventId = params?.id as string;
  const albumId = params?.albumId as string;
  const router = useRouter();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albumName, setAlbumName] = useState('Učitavanje...');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [jezik, setJezik] = useState('BS');

useEffect(() => {
  const jezik = localStorage.getItem('izabraniJezik') || 'BS';
  
  if (albumId === 'favorites') {
    setAlbumName(jezik === 'BS' ? '⭐ Favoriti' : '⭐ Favorites');
    // ... ostatak koda za dohvaćanje slika
  }
}, [albumId]);

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

const prevodi = {
  BS: {
    nazad: '← Nazad na albume',
    fotografija: 'fotografija',
    zatvori: '✕ Zatvori',
    albumPrazan: 'Ovaj album je trenutno prazan.',
  },
  EN: {
    nazad: '← Back to albums',
    fotografija: 'photos',
    zatvori: '✕ Close',
    albumPrazan: 'This album is currently empty.',
  }
};

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  useEffect(() => {
    const jezik = localStorage.getItem('izabraniJezik') || 'BS';
    if (!eventId || !albumId) return;

    if (albumId === 'favorites') {
      setAlbumName(jezik === 'BS' ? '⭐ Favoriti' : '⭐ Favorites');
      const savedPhotos = localStorage.getItem(`event_photos_${eventId}`);
      const allPhotos: Photo[] = savedPhotos ? JSON.parse(savedPhotos) : MOCK_PHOTOS;
      setPhotos(allPhotos.filter(p => p.isFavorite === true));
    } else {
      const savedAlbums = localStorage.getItem('moji_albumi');
      if (savedAlbums) {
        const albums: Album[] = JSON.parse(savedAlbums);
        const current = albums.find(a => String(a.id) === String(albumId));
        if (current) setAlbumName(current.name);
      }
      const albumPhotosUrls: string[] = JSON.parse(localStorage.getItem(`album_photos_${albumId}`) || '[]');
      const allEventPhotos: Photo[] = JSON.parse(localStorage.getItem(`event_photos_${eventId}`) || '[]');
      setPhotos(allEventPhotos.filter(p => albumPhotosUrls.includes(p.url)));
    }
  }, [eventId, albumId]);

  // ─── Navigacija strelicama na tastaturi ──────────────────────────────────────
  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) {
      setSelectedIndex(index);
    }
  }, [photos.length]);

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateTo(selectedIndex + 1);
      else if (e.key === 'ArrowLeft') navigateTo(selectedIndex - 1);
      else if (e.key === 'Escape') setSelectedIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigateTo]);

  // ─── Touch/swipe podrška ─────────────────────────────────────────────────────
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || selectedIndex === null) return;
    const distance = touchStart - e.changedTouches[0].clientX;
    if (distance > 50) navigateTo(selectedIndex + 1);
    if (distance < -50) navigateTo(selectedIndex - 1);
    setTouchStart(null);
  };

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">

        {/* ─── Lightbox ─────────────────────────────────────────────────────── */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Brojač */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-gray-400 bg-black/60 px-4 py-1.5 rounded-full">
              {(selectedIndex ?? 0) + 1} / {photos.length}
            </div>

            {/* Zatvori */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all text-lg"
            >
              {t.zatvori}
            </button>

            {/* Strelica lijevo */}
            <button
              onClick={(e) => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) - 1); }}
              disabled={(selectedIndex ?? 0) <= 0}
              className="absolute left-4 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Slika */}
            <div
              className="max-w-4xl w-full px-16"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={selectedPhoto.url}
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl select-none"
                alt="Pregled slike"
                draggable="false"
              />
            </div>

            {/* Strelica desno */}
            <button
              onClick={(e) => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) + 1); }}
              disabled={(selectedIndex ?? 0) >= photos.length - 1}
              className="absolute right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* ─── Header ───────────────────────────────────────────────────────── */}
        <button
          onClick={() => router.push(`/events/${eventId}?tab=albums`)}
          className="text-gray-500 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors"
        >
          {t.nazad}
        </button>

        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{albumName}</h1>
          <p className="text-gray-400 mt-3 text-sm md:text-lg">{photos.length} {t.fotografija}</p>
        </header>

        {/* ─── Grid ─────────────────────────────────────────────────────────── */}
        {photos.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#111] rounded-3xl border border-white/5">
            <p className="text-4xl mb-3">📭</p>
            <p>{t.albumPrazan}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {photos.map((foto, index) => (
              <div
                key={foto.id}
                onClick={() => setSelectedIndex(index)}
                className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 relative cursor-pointer group"
              >
                <img
                  src={foto.url}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Album slika"
                />
                {foto.isFavorite && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-xs">
                    ⭐
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
