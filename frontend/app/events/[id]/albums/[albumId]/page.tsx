'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getAlbum,
  getTrenutniKorisnik,
  ApiAlbumDetalji,
  ApiFotografija,
  objaviAlbum,
  ukloniFotografijaIzAlbuma,
  toggleFavorit,
  deleteAlbum
} from '@/lib/api';
import Link from 'next/link';

const PREVODI = {
  BS: {
    nazad: 'Nazad na albume',
    fotografija: 'fotografija',
    albumPrazan: 'Ovaj album je trenutno prazan.',
    greska: 'Greška pri učitavanju albuma.',
    ukloniIzAlbuma: 'Ukloni iz albuma',
    ukloniIzFavoritima: 'Ukloni iz favorita',
    potvrdaUklanjanja: 'Da li ste sigurni da želite ukloniti ovu sliku iz albuma?',
    potvrdaUklanjanjeFav: 'Da li ste sigurni da želite ukloniti ovu sliku iz favorita?',
    greskaUklanjanja: 'Greška pri uklanjanju slike.',
    ukloni: 'Ukloni',
    odustani: 'Odustani',
    favoriti: 'Favoriti',
    objavljeno: 'Objavljeno',
    objaviAlbum: 'Objavi album',
    objavljivanje: 'Objavljivanje...',
    obrisiAlbum: 'Obriši album',
    potvrdaBrisanjaAlbuma: 'Da li ste sigurni da želite obrisati ovaj album? Fotografije i videi ostaju u galeriji.',
    albumObrisanGreska: 'Greška pri brisanju albuma.',
    kopirajLink: 'Kopiraj link',
    linkKopiran: 'Kopirano!',
    slideshow: 'Slideshow',
    zaustavi: 'Zaustavi',
    greskaObjava: 'Greška pri objavi. Album mora biti tipa FINALNI. Obriši ovaj album i kreiraj novi.',
    prazanAlbum: 'Album je prazan.',
  },
  EN: {
    nazad: 'Back to albums',
    fotografija: 'photos',
    albumPrazan: 'This album is currently empty.',
    greska: 'Error loading album.',
    ukloniIzAlbuma: 'Remove from album',
    ukloniIzFavoritima: 'Remove from favorites',
    potvrdaUklanjanja: 'Are you sure you want to remove this photo from the album?',
    potvrdaUklanjanjeFav: 'Are you sure you want to remove this photo from favorites?',
    greskaUklanjanja: 'Error removing photo.',
    ukloni: 'Remove',
    odustani: 'Cancel',
    favoriti: 'Favorites',
    objavljeno: 'Published',
    objaviAlbum: 'Publish album',
    objavljivanje: 'Publishing...',
    obrisiAlbum: 'Delete album',
    potvrdaBrisanjaAlbuma: 'Are you sure you want to delete this album? Photos and videos will stay in the gallery.',
    albumObrisanGreska: 'Error deleting album.',
    kopirajLink: 'Copy link',
    linkKopiran: 'Copied!',
    slideshow: 'Slideshow',
    zaustavi: 'Stop',
    greskaObjava: 'Error publishing. Album must be FINAL type. Delete this album and create a new one.',
    prazanAlbum: 'Album is empty.',
  }
};

function ConfirmModal({ isOpen, title, message, onClose, onConfirm, confirmLabel, cancelLabel }: {
  isOpen: boolean; title: string; message: string;
  onClose: () => void; onConfirm: () => void;
  confirmLabel: string; cancelLabel: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 mb-8 text-sm">{message}</p>
        <div className="flex gap-4">
          <button onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-all font-semibold text-sm">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 rounded-xl hover:bg-red-600 font-bold text-white transition-all text-sm active:scale-95">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlbumDetails() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const albumId = params?.albumId as string;
  const isFavorites = albumId === 'favorites';

  const [album, setAlbum] = useState<ApiAlbumDetalji | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [jezik, setJezik] = useState('BS');
  const [mozeSve, setMozeSve] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteAlbumModal, setDeleteAlbumModal] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const photos: ApiFotografija[] = album?.fotografije ?? [];

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) setJezik(sacuvani);
    const provjeri = () => {
      const cur = localStorage.getItem('izabraniJezik');
      if (cur) setJezik(cur);
    };
    window.addEventListener('storage', provjeri);

    getTrenutniKorisnik()
      .then(k => setMozeSve(k.uloga === 'ADMIN' || k.uloga === 'ORGANIZATOR'))
      .catch(() => setMozeSve(false));

    if (isFavorites) {
      import('@/lib/api').then(({ getFotografije }) => {
        getFotografije(Number(eventId))
          .then(photos => {
            const favs = photos.filter(p => p.favorit === true);
            setAlbum({
              id: 'favorites' as any,
              event_id: Number(eventId),
              naziv: t.favoriti,
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
  }, [eventId, albumId, t.favoriti, t.greska, isFavorites]);

  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) setSelectedIndex(index);
  }, [photos.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateTo(selectedIndex + 1);
      else if (e.key === 'ArrowLeft') navigateTo(selectedIndex - 1);
      else if (e.key === 'Escape') { setSelectedIndex(null); setIsPlaying(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, navigateTo]);

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
    const dist = touchStart - e.changedTouches[0].clientX;
    if (dist > 50) navigateTo(selectedIndex + 1);
    if (dist < -50) navigateTo(selectedIndex - 1);
    setTouchStart(null);
  };

  const handlePublish = async () => {
    if (!album) return;
    setPublishing(true);
    try {
      const updated = await objaviAlbum(Number(albumId));
      setAlbum(prev => prev ? { ...prev, javno: true, share_code: updated.share_code } : null);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : t.greskaObjava;
      alert(errorMsg);
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (!album?.share_code) return;
    const link = `${window.location.origin}/share/albums/${album.share_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ukloni iz albuma (za obične albume)
  const handleRemoveFromAlbum = async () => {
    const photo = selectedIndex !== null ? photos[selectedIndex] : null;
    if (!photo) return;
    try {
      await ukloniFotografijaIzAlbuma(Number(albumId), photo.id);
      setAlbum(prev => prev ? {
        ...prev,
        fotografije: prev.fotografije.filter(f => f.id !== photo.id),
        broj_fotografija: prev.broj_fotografija - 1,
      } : null);
      setSelectedIndex(null);
      setDeleteModal(false);
    } catch { alert(t.greskaUklanjanja); }
  };

  // Ukloni iz favorita (za favorites album)
  const handleRemoveFromFavorites = async () => {
    const photo = selectedIndex !== null ? photos[selectedIndex] : null;
    if (!photo) return;
    try {
      await toggleFavorit(photo.id); // toggle unfavorite
      setAlbum(prev => prev ? {
        ...prev,
        fotografije: prev.fotografije.filter(f => f.id !== photo.id),
        broj_fotografija: prev.broj_fotografija - 1,
      } : null);
      setSelectedIndex(null);
      setDeleteModal(false);
    } catch { alert(t.greskaUklanjanja); }
  };

  const handleDeleteAlbum = async () => {
    if (isFavorites) return;

    try {
      await deleteAlbum(Number(albumId));
      router.push(`/events/${eventId}?tab=albums`);
    } catch {
      alert(t.albumObrisanGreska);
      setDeleteAlbumModal(false);
    }
  };

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (error || !album) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
      <p className="text-5xl">📁</p>
      <p className="text-gray-500">{error ?? t.greska}</p>
      <Link href={`/events/${eventId}?tab=albums`}
        className="text-sm text-gray-400 hover:text-white transition-colors">{t.nazad}</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">

      {/* ─── Lightbox + Slideshow ───────────────────────────────────────────── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.97)' }}
          onClick={() => { if (!isPlaying) setSelectedIndex(null); }}
        >
          <style>{`
            @keyframes fadeZoom {
              from { opacity: 0; transform: scale(0.97); }
              to   { opacity: 1; transform: scale(1); }
            }
            .anim-fz { animation: fadeZoom 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
          `}</style>

          {/* Brojač */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-sm text-white/60 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md select-none">
            {(selectedIndex ?? 0) + 1} / {photos.length}
          </div>

          {/* Gornji desni kut */}
          <div className="absolute top-4 right-4 z-10 flex gap-2 flex-wrap justify-end">
            {/* Zaustavi slideshow */}
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

            {/* Ukloni — za favorites album */}
            {isFavorites && mozeSve && !isPlaying && (
              <button
                onClick={e => { e.stopPropagation(); setDeleteModal(true); }}
                className="flex items-center gap-1.5 bg-yellow-500/15 hover:bg-yellow-500/30 border border-yellow-500/20 text-yellow-400 px-3 py-2 rounded-full text-xs font-bold transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span className="hidden sm:inline">{t.ukloniIzFavoritima}</span>
              </button>
            )}

            {/* Ukloni — za obične albume */}
            {!isFavorites && mozeSve && !isPlaying && (
              <button
                onClick={e => { e.stopPropagation(); setDeleteModal(true); }}
                className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/30 border border-red-500/20 text-red-400 px-3 py-2 rounded-full text-xs font-bold transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
                <span className="hidden sm:inline">{t.ukloniIzAlbuma}</span>
              </button>
            )}

            {/* Zatvori */}
            {!isPlaying && (
              <button
                onClick={() => setSelectedIndex(null)}
                className="bg-white/10 hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center transition-all text-white/70 hover:text-white">
                ✕
              </button>
            )}
          </div>

          {/* Strelica lijevo */}
          <button
            onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) - 1); }}
            disabled={(selectedIndex ?? 0) <= 0 || isPlaying}
            className="absolute left-2 md:left-4 z-10 bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* Slika */}
          <div
            className="w-full h-full flex items-center justify-center px-4 md:px-20 pt-20 pb-4"
            onClick={e => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              key={selectedPhoto.url}
              src={selectedPhoto.url}
              className="max-w-full max-h-full object-contain rounded-xl md:rounded-2xl select-none shadow-2xl anim-fz"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
              alt="Slika"
              draggable="false"
            />
          </div>

          {/* Strelica desno */}
          <button
            onClick={e => { e.stopPropagation(); navigateTo((selectedIndex ?? 0) + 1); }}
            disabled={(selectedIndex ?? 0) >= photos.length - 1 || isPlaying}
            className="absolute right-2 md:right-4 z-10 bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full border border-white/10 text-white transition-all disabled:opacity-0 disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div className="h-full bg-white/60" style={{ width: '100%', animation: 'progress 3s linear infinite' }} />
            </div>
          )}
        </div>
      )}

      {/* ─── Confirm modal ─────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteModal}
        title={isFavorites ? t.ukloniIzFavoritima : t.ukloniIzAlbuma}
        message={isFavorites ? t.potvrdaUklanjanjeFav : t.potvrdaUklanjanja}
        confirmLabel={t.ukloni}
        cancelLabel={t.odustani}
        onClose={() => setDeleteModal(false)}
        onConfirm={isFavorites ? handleRemoveFromFavorites : handleRemoveFromAlbum}
      />
      <ConfirmModal
        isOpen={deleteAlbumModal}
        title={t.obrisiAlbum}
        message={t.potvrdaBrisanjaAlbuma}
        confirmLabel={t.obrisiAlbum}
        cancelLabel={t.odustani}
        onClose={() => setDeleteAlbumModal(false)}
        onConfirm={handleDeleteAlbum}
      />

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-12 py-4 flex items-center justify-between gap-3">

          <Link href={`/events/${eventId}?tab=albums`}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm font-semibold transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="hidden sm:inline">{t.nazad}</span>
          </Link>

          <p className="text-sm font-semibold text-white/60 truncate flex-1 text-center sm:hidden">
            {isFavorites ? t.favoriti : album.naziv}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {/* Slideshow */}
            {photos.length > 0 && (
              <button
                onClick={() => { setSelectedIndex(0); setIsPlaying(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {t.slideshow}
              </button>
            )}

            {/* Objavi / Kopiraj link — samo za obične albume */}
            {mozeSve && !isFavorites && (
              <>
              {album.javno ? (
                <button onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'
                  }`}>
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {t.linkKopiran}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      <span className="hidden sm:inline">{t.kopirajLink}</span>
                      <span className="sm:hidden">Link</span>
                    </>
                  )}
                </button>
              ) : (
                <button onClick={handlePublish} disabled={publishing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50 active:scale-95 shadow-lg">
                  {publishing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span className="hidden sm:inline">{t.objavljivanje}</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                      <span className="hidden sm:inline">{t.objaviAlbum}</span>
                      <span className="sm:hidden">Objavi</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteAlbumModal(true)}
                title={t.obrisiAlbum}
                aria-label={t.obrisiAlbum}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                <span className="hidden sm:inline">{t.obrisiAlbum}</span>
                <span className="sm:hidden">{t.obrisiAlbum}</span>
              </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Naslov albuma ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-12 pt-8 pb-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2">
            {isFavorites && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Favoriti
              </span>
            )}
            {album.javno && !isFavorites && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {t.objavljeno}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            {isFavorites ? t.favoriti : album.naziv}
          </h1>

          {album.opis && (
            <p className="text-gray-400 text-sm md:text-base max-w-2xl">{album.opis}</p>
          )}

          <p className="text-gray-500 text-sm">{photos.length} {t.fotografija}</p>
        </div>
      </div>

      {/* ─── Galerija ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-12 pb-20">
        {photos.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.02] rounded-3xl border border-white/5">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-500 text-sm">{t.prazanAlbum}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {photos.map((foto, index) => (
              <div
                key={foto.id}
                onClick={() => { setSelectedIndex(index); setIsPlaying(false); }}
                className="relative aspect-square overflow-hidden rounded-xl md:rounded-2xl bg-white/5 border border-white/5 cursor-pointer group hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/50"
              >
                <img
                  src={foto.url}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Album slika"
                />
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
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1 md:p-1.5 rounded-full text-xs group-hover:opacity-0 transition-opacity">⭐</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
