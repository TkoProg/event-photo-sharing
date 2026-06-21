'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getJavniAlbum, ApiAlbumDetalji, ApiFotografija } from '@/lib/api';
import Link from 'next/link';

const PREVODI = {
  BS: {
    fotografija: 'fotografija',
    kopirајLink: 'Kopiraj link',
    linkKopiran: 'Kopirano!',
    albumNijeNađen: 'Album nije pronađen',
    albumNijeNađenOpis: 'Ovaj link je možda istekao ili album ne postoji.',
    javniAlbum: 'Javni album',
    prazanAlbum: 'Ovaj album nema fotografija.',
    zatvori: '✕ Zatvori',
    slideshow: 'Slideshow',
    zaustavi: 'Zaustavi',
  },
  EN: {
    fotografija: 'photos',
    kopirајLink: 'Copy link',
    linkKopiran: 'Copied!',
    albumNijeNađen: 'Album not found',
    albumNijeNađenOpis: 'This link may have expired or the album does not exist.',
    javniAlbum: 'Public album',
    prazanAlbum: 'This album has no photos.',
    zatvori: '✕ Close',
    slideshow: 'Slideshow',
    zaustavi: 'Stop',
  }
};

export default function ShareAlbumPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareCode = params?.sharecode as string;
  const eventId = searchParams.get('eventId');

  const [album, setAlbum] = useState<ApiAlbumDetalji | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [jezik, setJezik] = useState('BS');
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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

  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) setSelectedIndex(index);
  }, [photos.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateTo(selectedIndex + 1);
      else if (e.key === 'ArrowLeft') navigateTo(selectedIndex - 1);
      else if (e.key === 'Escape') { setSelectedIndex(null); setIsPlaying(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigateTo]);

  // Slideshow
  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;
    if (selectedIndex === null) setSelectedIndex(0);
    const interval = setInterval(() => {
      setSelectedIndex(prev => prev === null ? 0 : (prev + 1) % photos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, photos.length, selectedIndex]);

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || selectedIndex === null) return;
    const distance = touchStart - e.changedTouches[0].clientX;
    if (distance > 50) navigateTo(selectedIndex + 1);
    if (distance < -50) navigateTo(selectedIndex - 1);
    setTouchStart(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href.split('?')[0]); // Ne kopira eventId
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
        {eventId && (
          <Link href={`/events/${eventId}?tab=albums`} className="mt-8 text-sm bg-white/10 px-6 py-3 rounded-full hover:bg-white/20 transition-all font-bold">
            Nazad na događaj
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">

      {/* ─── Lightbox + Slideshow (identično kao u admin panelu) ─── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.97)' }}
          onClick={() => { if (!isPlaying) { setSelectedIndex(null); } }}
        >
          <style>{`
            @keyframes fadeZoom {
              from { opacity: 0; transform: scale(0.97); }
              to   { opacity: 1; transform: scale(1); }
            }
            .anim-fz { animation: fadeZoom 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
          `}</style>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-sm text-white/60 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md select-none">
            {(selectedIndex ?? 0) + 1} / {photos.length}
          </div>

          <div className="absolute top-4 right-4 z-10 flex gap-2 flex-wrap justify-end">
            {isPlaying && (
              <button
                onClick={e => { e.stopPropagation(); setIsPlaying(false); }}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-3 py-2 rounded-full text-xs font-bold transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
                {t.zaustavi}
              </button>
            )}

            {!isPlaying && (
              <button
                onClick={() => setSelectedIndex(null)}
                className="bg-white/10 hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all text-white/70 hover:text-white">
                ✕
              </button>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) - 1); }}
            disabled={(selectedIndex ?? 0) <= 0 || isPlaying}
            className="absolute left-2 md:left-4 z-10 bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div
            className="w-full h-full flex items-center justify-center px-4 md:px-20 pt-20 pb-4"
            onClick={e => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {selectedPhoto.tip_medija === 'video' ? (
              <video
                key={selectedPhoto.url}
                src={selectedPhoto.url}
                className="max-w-full max-h-full object-contain rounded-xl md:rounded-2xl select-none shadow-2xl anim-fz"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
                controls
                playsInline
              />
            ) : (
              <img
                key={selectedPhoto.url}
                src={selectedPhoto.url}
                className="max-w-full max-h-full object-contain rounded-xl md:rounded-2xl select-none shadow-2xl anim-fz"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
                alt="Slika"
                draggable="false"
              />
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) + 1); }}
            disabled={(selectedIndex ?? 0) >= photos.length - 1 || isPlaying}
            className="absolute right-2 md:right-4 z-10 bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div className="h-full bg-white/60 animate-[progress_3s_linear_infinite]" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-30 px-4 md:px-12 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-4">
            {eventId && (
              <Link href={`/events/${eventId}?tab=albums`} className="text-gray-400 hover:text-white text-sm font-semibold flex items-center gap-1.5 pr-4 border-r border-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                <span className="hidden sm:inline">Nazad na albume</span>
              </Link>
            )}
            <div className="text-lg md:text-xl font-bold tracking-tighter hidden sm:block">
              Flash<span className="text-[#e60023]">back</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Slideshow dugme */}
            {photos.length > 0 && (
              <button
                onClick={() => { setSelectedIndex(0); setIsPlaying(true); }}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span className="hidden sm:inline">{t.slideshow}</span>
              </button>
            )}

            {/* Dugme za kopiranje - ISTOG IZGLEDA UVIJEK */}
            <button onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 w-32 md:w-36 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all bg-white text-black hover:bg-gray-200 active:scale-95 shadow-lg">
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
                  {t.linkKopiran}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  {t.kopirајLink}
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ─── Info o albumu ─── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-400 mb-4 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          {t.javniAlbum}
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{album.naziv}</h1>
        {album.opis && <p className="text-gray-400 mt-4 text-base md:text-lg max-w-3xl">{album.opis}</p>}
        <p className="text-gray-500 mt-3 text-sm font-medium">{photos.length} {t.fotografija}</p>
      </div>

      {/* ─── Grid galerija ─── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-16">
        {photos.length === 0 ? (
          <div className="text-center py-24 text-gray-500 bg-white/[0.02] rounded-3xl border border-white/5">
            <p className="text-5xl mb-4">📭</p>
            <p>{t.prazanAlbum}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {photos.map((foto, index) => (
              <div key={foto.id} onClick={() => setSelectedIndex(index)}
                className="aspect-square overflow-hidden rounded-xl md:rounded-2xl bg-[#111] border border-white/5 relative cursor-pointer group hover:border-white/30 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1">
                {foto.tip_medija === 'video' ? (
                  <>
                    <video src={foto.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" muted playsInline preload="metadata" />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-blue-300">VIDEO</div>
                  </>
                ) : (
                  <img src={foto.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Album slika" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 md:p-3">
                  <div className="flex items-center gap-1">
                    {foto.favorit && (
                      <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-yellow-400 font-semibold">⭐</span>
                    )}
                    {foto.broj_lajkova > 0 && (
                      <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/70 font-semibold">❤️ {foto.broj_lajkova}</span>
                    )}
                  </div>
                </div>
                {foto.favorit && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-xs group-hover:opacity-0 transition-opacity">⭐</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
