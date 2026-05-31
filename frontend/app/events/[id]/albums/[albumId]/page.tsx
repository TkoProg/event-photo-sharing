'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAlbum, ApiAlbumDetalji, ApiFotografija } from '@/lib/api';

const PREVODI = {
  BS: {
    nazad: '← Nazad na albume',
    fotografija: 'fotografija',
    zatvori: '✕ Zatvori',
    albumPrazan: 'Ovaj album je trenutno prazan.',
    greska: 'Greška pri učitavanju albuma.',
    ucitavanje: 'Učitavanje...',
  },
  EN: {
    nazad: '← Back to albums',
    fotografija: 'photos',
    zatvori: '✕ Close',
    albumPrazan: 'This album is currently empty.',
    greska: 'Error loading album.',
    ucitavanje: 'Loading...',
  }
};

export default function AlbumDetails() {
  const params = useParams();
  const eventId = params?.id as string;
  const albumId = params?.albumId as string;
  const router = useRouter();

  const [album, setAlbum] = useState<ApiAlbumDetalji | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [jezik, setJezik] = useState('BS');

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) setJezik(sacuvani);
    const provjeri = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };
    window.addEventListener('storage', provjeri);

    if (albumId === 'favorites') {
      // Čitamo favorite iz backenda
      import('@/lib/api').then(({ getFotografije }) => {
        getFotografije(Number(eventId))
          .then(photos => {
            const favs = photos.filter(p => p.favorit === true);
            setAlbum({
              id: 'favorites' as any,
              event_id: Number(eventId),
              naziv: '⭐ Favoriti',
              opis: '',
              tip: 'OBICNI',
              share_code: null,
              javno: false,
              broj_fotografija: favs.length,
              fotografije: favs,
            });
          })
          .catch(() => setError(t.greska))
          .finally(() => setLoading(false));
      });
      return () => window.removeEventListener('storage', provjeri);
    }

    getAlbum(Number(albumId))
      .then(data => setAlbum(data))
      .catch(() => setError(t.greska))
      .finally(() => setLoading(false));

    return () => window.removeEventListener('storage', provjeri);
  }, [eventId, albumId]);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const photos: ApiFotografija[] = album?.fotografije ?? [];

  // Navigacija lightboxa
  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) setSelectedIndex(index);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-gray-500">{error ?? t.greska}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Lightbox */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-gray-400 bg-black/60 px-4 py-1.5 rounded-full">
              {(selectedIndex ?? 0) + 1} / {photos.length}
            </div>
            <button onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all">
              ✕
            </button>
            <button onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) - 1); }}
              disabled={(selectedIndex ?? 0) <= 0}
              className="absolute left-4 bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="max-w-4xl w-full px-16" onClick={e => e.stopPropagation()}
              onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <img src={selectedPhoto.url} className="w-full h-auto max-h-[85vh] object-contain rounded-2xl select-none" alt="Slika" draggable="false" />
            </div>
            <button onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) + 1); }}
              disabled={(selectedIndex ?? 0) >= photos.length - 1}
              className="absolute right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}

        <button onClick={() => router.push(`/events/${eventId}?tab=albums`)}
          className="text-gray-500 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors">
          {t.nazad}
        </button>

        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{album.naziv}</h1>
          <p className="text-gray-400 mt-3 text-sm md:text-lg">{photos.length} {t.fotografija}</p>
        </header>

        {photos.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#111] rounded-3xl border border-white/5">
            <p className="text-4xl mb-3">📭</p>
            <p>{t.albumPrazan}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {photos.map((foto, index) => (
              <div key={foto.id} onClick={() => setSelectedIndex(index)}
                className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 relative cursor-pointer group hover:border-white/30 transition-all">
                <img src={foto.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Album slika" />
                {foto.favorit && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-xs">⭐</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}