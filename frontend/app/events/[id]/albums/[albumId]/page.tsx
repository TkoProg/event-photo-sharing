'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAlbum, getTrenutniKorisnik, ApiAlbumDetalji, ApiFotografija, objaviAlbum } from '@/lib/api';
import Link from 'next/link';

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
  const [mozeUpravljatiAlbumom, setMozeUpravljatiAlbumom] = useState(false);

  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopyLink = () => {
    if (album?.share_code) {
      const link = `${window.location.origin}/share/albums/${album.share_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublish = async () => {
    if (!album) return;
    setPublishing(true);
    try {
      // ZAMJENA: Koristimo albumId iz linka umjesto album.id
      const objavljeni = await objaviAlbum(Number(albumId));
      
      setAlbum({ ...album, javno: true, share_code: objavljeni.share_code });
    } catch (err: any) {
      alert("Greška pri objavi. Provjerite je li album finalni.");
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) setJezik(sacuvani);
    const provjeri = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };
    window.addEventListener('storage', provjeri);

    getTrenutniKorisnik()
      .then(korisnik => setMozeUpravljatiAlbumom(korisnik.uloga === 'ADMIN' || korisnik.uloga === 'ORGANIZATOR'))
      .catch(() => setMozeUpravljatiAlbumom(false));

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
      else if (e.key === 'Escape') {
        setSelectedIndex(null);
        setIsPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigateTo]);

  // NOVO: Slideshow tajmer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && photos.length > 0) {
      if (selectedIndex === null) setSelectedIndex(0);
      
      interval = setInterval(() => {
        setSelectedIndex((trenutni) => {
          if (trenutni === null) return 0;
          return (trenutni + 1) % photos.length;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, photos.length, selectedIndex]);

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
      {/* Lightbox */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => { setSelectedIndex(null); setIsPlaying(false); }}>
            
            <style>{`
              @keyframes fadeZoom {
                0% { opacity: 0; transform: scale(0.96); }
                100% { opacity: 1; transform: scale(1); }
              }
              .animate-fade-zoom { animation: fadeZoom 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            `}</style>
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
              <img key={selectedPhoto.url} src={selectedPhoto.url} className="w-full h-auto max-h-[85vh] object-contain rounded-2xl select-none shadow-2xl animate-fade-zoom" alt="Slika" draggable="false" />            </div>
            <button onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) + 1); }}
              disabled={(selectedIndex ?? 0) >= photos.length - 1}
              className="absolute right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
        <header className="border-b border-white/10 px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Jedino dugme Nazad */}
          <Link href={`/events/${eventId}?tab=albums`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-colors">
            {t.nazad}
          </Link>

          {/* DESNA STRANA: Akcije za album */}
          {album && (
            <div className="flex gap-3">
              {/* Slideshow dugme vidljivo svima ako ima slika */}
              {photos.length > 0 && (
                <button onClick={() => setIsPlaying(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Slideshow
                </button>
              )}

              {/* Objavi/Kopiraj vidljivo samo adminima i to NE u Favoritima */}
              {mozeUpravljatiAlbumom && albumId !== 'favorites' && (
                album.javno ? (
                  <button onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'}`}>
                    {copied ? '✅ Link kopiran!' : '🔗 Kopiraj link'}
                  </button>
                ) : (
                  <button onClick={handlePublish} disabled={publishing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50">
                    {publishing ? 'Objavljivanje...' : '🌐 Objavi album'}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-12 pb-6">
        {album?.javno && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-green-400 mb-4 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            Objavljeno
          </div>
        )}
        {/* Ako album ima naziv, prikazaće se. Ako nema, ostaće prostor. */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{album?.naziv}</h1>
        {album?.opis && <p className="text-gray-400 mt-3 text-lg">{album.opis}</p>}
        <p className="text-gray-500 mt-2 text-sm">{photos.length} {t.fotografija}</p>
      </div>
      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-16 mt-4">
        {photos.length === 0 ? (
          <div className="text-center py-24 text-gray-500 bg-white/5 rounded-3xl border border-white/5">
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
