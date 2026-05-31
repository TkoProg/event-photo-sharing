'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getJavniAlbum, ApiAlbumDetalji, ApiFotografija } from '@/lib/api';

const PREVODI = {
  BS: {
    fotografija: 'fotografija',
    kopirајLink: 'Kopiraj link',
    linkKopiran: '✅ Link kopiran!',
    albumNijeNađen: 'Album nije pronađen',
    albumNijeNađenOpis: 'Ovaj link je možda istekao ili album ne postoji.',
    javniAlbum: 'Javni album',
    prazanAlbum: 'Ovaj album nema fotografija.',
    zatvori: '✕ Zatvori',
  },
  EN: {
    fotografija: 'photos',
    kopirајLink: 'Copy link',
    linkKopiran: '✅ Link copied!',
    albumNijeNađen: 'Album not found',
    albumNijeNađenOpis: 'This link may have expired or the album does not exist.',
    javniAlbum: 'Public album',
    prazanAlbum: 'This album has no photos.',
    zatvori: '✕ Close',
  }
};

export default function ShareAlbumPage() {
  const params = useParams();
  const shareCode = params?.shareCode as string;

  const [album, setAlbum] = useState<ApiAlbumDetalji | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [jezik, setJezik] = useState('BS');

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) setJezik(sacuvani);

    getJavniAlbum(shareCode)
      .then(data => setAlbum(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareCode]);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !album) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-6xl mb-6">🔒</p>
        <h1 className="text-3xl font-bold mb-3">{t.albumNijeNađen}</h1>
        <p className="text-gray-500 max-w-sm">{t.albumNijeNađenOpis}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">

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
            <img src={selectedPhoto.url} className="w-full h-auto max-h-[85vh] object-contain rounded-2xl select-none" draggable="false" alt="Slika" />
          </div>
          <button onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) + 1); }}
            disabled={(selectedIndex ?? 0) >= photos.length - 1}
            className="absolute right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold tracking-tighter">
            Event<span className="text-[#e60023]">Photo</span>
          </div>
          <button onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'}`}>
            {copied ? t.linkKopiran : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                {t.kopirајLink}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Info o albumu */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          {t.javniAlbum}
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{album.naziv}</h1>
        {album.opis && <p className="text-gray-400 mt-3 text-lg">{album.opis}</p>}
        <p className="text-gray-500 mt-2 text-sm">{photos.length} {t.fotografija}</p>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-16">
        {photos.length === 0 ? (
          <div className="text-center py-24 text-gray-500 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-4xl mb-3">📭</p>
            <p>{t.prazanAlbum}</p>
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