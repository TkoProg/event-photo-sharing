'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  getFotografija,
  deleteFotografija,
  toggleFavorit,
  likeFotografija,
  unlikeFotografija,
  getKomentari,
  dodajKomentar,
  getFotografije,
  ApiFotografija,
  ApiKomentar, getTrenutniKorisnik,
  deleteKomentar, ApiKorisnik, getUcesnici,
  dodajTag, deleteTag, ApiTag
} from '@/lib/api';

const PREVODI = {
  BS: {
    nazadUGaleriju: '← Nazad u galeriju',
    nazadNaFeed: '← Nazad na feed',
    obrisiSliku: '🗑️ Izbriši sliku',
    tagovi: 'Tagovi',
    dodajTag: 'Dodaj tag...',
    nemaTagova: 'Ova slika trenutno nema tagova.',
    komentari: 'Komentari',
    napisiKomentar: 'Napiši komentar...',
    posalji: 'Pošalji',
    lajkova: 'lajkova',
    uFavoritima: '⭐ U favoritima',
    dodajUFavorite: '☆ Dodaj u favorite',
    nijePronađena: 'Slika nije pronađena :(',
    brisuceSliku: 'Brisanje slike',
    sigurna: 'Želiš li trajno obrisati ovu sliku?',
    odustani: 'Odustani',
    izbrisi: 'Izbriši',
    nemaKomentara: 'Još nema komentara.',
    greska: 'Greška. Pokušaj ponovo.',
    ucitavanje: 'Učitavanje...',
  },
  EN: {
    nazadUGaleriju: '← Back to gallery',
    nazadNaFeed: '← Back to feed',
    obrisiSliku: '🗑️ Delete photo',
    tagovi: 'Tags',
    dodajTag: 'Add tag...',
    nemaTagova: 'This photo has no tags.',
    komentari: 'Comments',
    napisiKomentar: 'Write a comment...',
    posalji: 'Send',
    lajkova: 'likes',
    uFavoritima: '⭐ In favorites',
    dodajUFavorite: '☆ Add to favorites',
    nijePronađena: 'Photo not found :(',
    brisuceSliku: 'Delete photo',
    sigurna: 'Do you want to permanently delete this photo?',
    odustani: 'Cancel',
    izbrisi: 'Delete',
    nemaKomentara: 'No comments yet.',
    greska: 'Error. Please try again.',
    ucitavanje: 'Loading...',
  }
};

export default function PhotoDetail() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const [jezik, setJezik] = useState('BS');
  const [photo, setPhoto] = useState<ApiFotografija | null>(null);
  const [komentari, setKomentari] = useState<ApiKomentar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uloga, setUloga] = useState<string | null>(null);
  const [korisnikId, setKorisnikId] = useState<number | null>(null);
  const [trenutniKorisnik, setTrenutniKorisnik] = useState<ApiKorisnik | null>(null);

  useEffect(() => {
    getTrenutniKorisnik()
      .then(k => {
        setUloga(k.uloga);
        setKorisnikId(k.id);
        setTrenutniKorisnik(k);
      })
      .catch(() => setUloga('GOST'));
  }, []);

  const jeOrganizator = uloga === 'ORGANIZATOR';
  const jeAdmin = uloga === 'ADMIN';
  const mozeSve = jeOrganizator || jeAdmin;

  // ─── STRELICE I NAVIGACIJA LOGIKA (Dodano iz koda 1) ────────────────────────
  const [photosList, setPhotosList] = useState<ApiFotografija[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // ─── TAGOVI LOGIKA (Lokalni fallback jer ApiFotografija nema tagove) ──────────
  const [ucesnici, setUcesnici] = useState<ApiKorisnik[]>([]);
  const [odabraniKorisnikId, setOdabraniKorisnikId] = useState<number | ''>('');
  const [trazeniPojam, setTrazeniPojam] = useState('');
  const [fokusiraniIndex, setFokusiraniIndex] = useState(-1);
  const [prikaziPrijedloge, setPrikaziPrijedloge] = useState(false);
  const [tagovi, setTagovi] = useState<ApiTag[]>([]);

  // Jezik provjera
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

  // Učitaj sliku, komentare i niz slika za listanje
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      getFotografija(id),
      getKomentari(id),
    ])
      .then(([foto, kom]) => {
        setPhoto(foto);
        setKomentari(kom);

        const dodajTrenutnogKorisnika = (lista: ApiKorisnik[]) => {
          if (!trenutniKorisnik || lista.some(u => u.id === trenutniKorisnik.id)) {
            return lista;
          }

          return [trenutniKorisnik, ...lista];
        };

        if (mozeSve) {
          getUcesnici(foto.event_id)
            .then(lista => setUcesnici(dodajTrenutnogKorisnika(lista)))
            .catch(() => setUcesnici(dodajTrenutnogKorisnika([])));
        } else {
          setUcesnici(dodajTrenutnogKorisnika([]));
        }

        setTagovi(foto.tagovi || []);
        return getFotografije(foto.event_id);
      })
      .then((sveSlike) => {
        // Sortiramo isto kao na galeriji (od najnovije)
        const sorted = [...sveSlike].sort((a, b) => b.id - a.id);
        setPhotosList(sorted);
        const idx = sorted.findIndex(p => p.id === id);
        setCurrentIndex(idx);
      })
      .catch(() => setError(PREVODI[jezik === 'BS' ? 'BS' : 'EN'].greska))
      .finally(() => setLoading(false));
  }, [id, jezik, mozeSve, trenutniKorisnik]);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const mozeObrisatiSliku = Boolean(photo && (mozeSve || photo.korisnik_id === korisnikId));

  // Funkcija za prebacivanje slika
  const navigateTo = useCallback((index: number) => {
    if (index >= 0 && index < photosList.length) {
      const fromParam = from ? `?from=${from}` : '';
      router.push(`/photos/${photosList[index].id}${fromParam}`);
    }
  }, [photosList, from, router]);

  // Slušanje tastature (Strelica Lijevo / Desno)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex === -1 || photosList.length <= 1) return;
      if (e.key === 'ArrowRight') navigateTo(currentIndex + 1);
      else if (e.key === 'ArrowLeft') navigateTo(currentIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photosList, navigateTo]);

  // Touch podrška za mobitele
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentIndex < photosList.length - 1) navigateTo(currentIndex + 1);
    if (distance < -50 && currentIndex > 0) navigateTo(currentIndex - 1);
  };

  const handleBack = () => {
    if (from === 'feed') {
      router.push('/feed');
    } else if (photo) {
      router.push(`/events/${photo.event_id}?tab=photos`);
    } else {
      router.push('/');
    }
  };

  const handleLike = async () => {
    if (!photo) return;
    try {
      const updated = photo.liked_by_me
        ? await unlikeFotografija(photo.id)
        : await likeFotografija(photo.id);
      setPhoto(updated);
    } catch { setError(t.greska); }
  };

  const handleFavorit = async () => {
    if (!photo) return;
    try {
      const updated = await toggleFavorit(photo.id);
      setPhoto(updated);
    } catch { setError(t.greska); }
  };

  const handleDelete = async () => {
    if (!photo) return;
    try {
      await deleteFotografija(photo.id);
      handleBack();
    } catch { setError(t.greska); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !photo) return;
    setSubmittingComment(true);
    try {
      const komentar = await dodajKomentar(photo.id, newComment.trim());
      setKomentari(prev => [...prev, komentar]);
      setNewComment('');
    } catch { setError(t.greska); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteKomentar = async (komentarId: number) => {
    try {
      await deleteKomentar(komentarId);
      setKomentari(prev => prev.filter(k => k.id !== komentarId));
    } catch { setError(t.greska); }
  };

  // Upravljanje tagovima (Lokalno spašavanje)
const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odabraniKorisnikId || !photo) return;

    const vecTagovan = tagovi.some(tag => tag.oznaceni_korisnik_id === Number(odabraniKorisnikId));
    if (vecTagovan) {
      setTrazeniPojam('');
      setOdabraniKorisnikId('');
      return; 
    }

    try {
      const noviTag = await dodajTag(photo.id, Number(odabraniKorisnikId));
      setTagovi(prev => [...prev, noviTag]);
      setOdabraniKorisnikId(''); 
    } catch (error) {
      setError(t.greska);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      // 1. Šaljemo zahtjev serveru da obriše tag
      await deleteTag(tagId);
      
      // 2. Ažuriramo ekran: izbacujemo obrisani tag iz niza tagova
      setTagovi(prev => prev.filter(tag => tag.id !== tagId));
    } catch (error) {
      setError(t.greska);
    }
  };

  const filtriraniUcesnici = ucesnici.filter(u => {
    const odgovaraPretrazi = u.ime.toLowerCase().includes(trazeniPojam.toLowerCase());
    const vecTagovan = tagovi.some(tag => tag.oznaceni_korisnik_id === u.id);
    return odgovaraPretrazi && !vecTagovan;
  });

  const odaberiKorisnika = (korisnik: ApiKorisnik) => {
    setOdabraniKorisnikId(korisnik.id);
    setTrazeniPojam(korisnik.ime);
    setPrikaziPrijedloge(false);
    setFokusiraniIndex(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-xl text-gray-500">{t.nijePronađena}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 w-full max-w-[100vw] font-sans">

      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full">
        {/* Lijevo — nazad */}
        <button
          onClick={handleBack}
          className="text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition-all"
        >
          {from === 'feed' ? t.nazadNaFeed : t.nazadUGaleriju}
        </button>

        {/* Desno — brisanje */}
        {mozeObrisatiSliku && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            {t.obrisiSliku}
          </button>
        )}
      </div>

      {/* MODAL ZA BRISANJE */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-4 text-white">{t.brisuceSliku}</h3>
            <p className="text-gray-400 mb-8">{t.sigurna}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="flex-1 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 text-white font-semibold transition-all"
              >
                {t.odustani}
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 px-4 py-3 bg-red-500 rounded-xl hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                {t.izbrisi}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl z-40 text-sm">
          {error}
        </div>
      )}


      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 w-full">

        {/* Slika sa strelicama za navigaciju i swipe podrškom */}
        <div 
          className="flex-1 bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-center min-h-[50vh] lg:min-h-[70vh] relative group w-full"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        >
          {/* Strelica Lijevo */}
          <button 
            onClick={() => navigateTo(currentIndex - 1)} 
            disabled={currentIndex <= 0}
            className="absolute left-4 bg-black/50 backdrop-blur-md p-3 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all z-10 disabled:opacity-0 disabled:pointer-events-none opacity-100 md:opacity-0 group-hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <img
            src={photo.url}
            alt={`Slika ${photo.id}`}
            className="w-full h-auto max-h-[70vh] object-contain rounded-2xl select-none"
            draggable="false"
          />

          {/* Strelica Desno */}
          <button 
            onClick={() => navigateTo(currentIndex + 1)} 
            disabled={currentIndex >= photosList.length - 1}
            className="absolute right-4 bg-black/50 backdrop-blur-md p-3 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all z-10 disabled:opacity-0 disabled:pointer-events-none opacity-100 md:opacity-0 group-hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Sidebar */}
        <div className="lg:w-96 space-y-8 w-full">

          {/* Tagovi sekcija (Prava Baza Podataka) */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold mb-4">{t.tagovi}</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {tagovi.length === 0 ? (
                <p className="text-sm text-gray-500 italic">{t.nemaTagova}</p>
              ) : (
                tagovi.map(tag => {
                  // Backend vraća samo ID osobe, pa tražimo njeno ime u nizu učesnika
                  const ucesnik = ucesnici.find(u => u.id === tag.oznaceni_korisnik_id);
                  const ime = tag.oznaceni_korisnik_ime || (ucesnik ? ucesnik.ime : `Korisnik`);
                  const mozeObrisatiTag = Boolean(
                    mozeSve
                    || photo.korisnik_id === korisnikId
                    || tag.oznacio_korisnik_id === korisnikId
                    || tag.oznaceni_korisnik_id === korisnikId
                  );

                  return (
                    <span key={tag.id} className="bg-transparent border border-white/30 text-xs px-3 py-1.5 rounded-lg text-white font-semibold flex items-center gap-2">
                      @{ime}
                      {mozeObrisatiTag && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          aria-label={`Obrisi tag ${ime}`}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>
            
            <form onSubmit={(e) => {
              handleAddTag(e);
              setTrazeniPojam('');
            }} className="flex gap-2">
              
              {/* Pametno polje za pretragu sa podrškom za tastaturu */}
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={trazeniPojam}
                  onChange={e => {
                    setTrazeniPojam(e.target.value);
                    setPrikaziPrijedloge(true);
                    setOdabraniKorisnikId('');
                    setFokusiraniIndex(-1); // Resetujemo fokus kad korisnik kuca
                  }}
                  onFocus={() => setPrikaziPrijedloge(true)}
                  onKeyDown={(e) => {
                    if (prikaziPrijedloge && filtriraniUcesnici.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault(); // Spriječava pomjeranje cijele stranice
                        setFokusiraniIndex(prev => Math.min(prev + 1, filtriraniUcesnici.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setFokusiraniIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter' && fokusiraniIndex >= 0) {
                        e.preventDefault(); // Spriječava slanje cijele forme
                        odaberiKorisnika(filtriraniUcesnici[fokusiraniIndex]);
                      }
                    }
                  }}
                  placeholder="Upiši ime osobe..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-white/30 outline-none" 
                />

                {/* Lista prijedloga koja iskače ispod polja */}
                {/* Lista prijedloga koja iskače ispod polja */}
                {prikaziPrijedloge && trazeniPojam && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto shadow-2xl">
                    {filtriraniUcesnici.length > 0 ? (
                      filtriraniUcesnici.map((u, index) => (
                        <li 
                          key={u.id}
                          onClick={() => odaberiKorisnika(u)}
                          onMouseEnter={() => setFokusiraniIndex(index)} 
                          className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                            fokusiraniIndex === index 
                              ? 'bg-gray-200 text-black font-bold' // Osvijetljena pozadina i deblja slova kad idemo strelicama
                              : 'hover:bg-gray-100 text-gray-800'  // Normalan izgled
                          }`}
                        >
                          {u.ime}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-sm text-gray-500 italic">Nema rezultata</li>
                    )}
                  </ul>
                )}
              </div>

              <button 
                type="submit" 
                disabled={!odabraniKorisnikId}
                className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                +
              </button>
            </form>
          </div>

          {/* Lajkovi i favorit */}
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="text-3xl hover:scale-110 transition-transform active:scale-95">
              {photo.liked_by_me ? '❤️' : '🤍'}
            </button>
            <span className="font-bold text-lg">{photo.broj_lajkova} {t.lajkova}</span>
          </div>
          {mozeSve && (
            <button onClick={handleFavorit}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                photo.favorit
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}>
              {photo.favorit ? t.uFavoritima : t.dodajUFavorite}
            </button>
          )}
        </div>

        {/* Komentari */}
        <h3 className="font-bold">{t.komentari} ({komentari.length})</h3>

        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={t.napisiKomentar}
            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-white/30 outline-none"
          />
          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            {submittingComment ? '...' : '➤'}
          </button>
        </form>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {komentari.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{t.nemaKomentara}</p>
          ) : (
            komentari.map(k => {
              const mozeObrisati = mozeSve || k.korisnik_id === korisnikId;
              return (
                <div key={k.id} className="bg-black/50 p-3 rounded-xl border border-white/5 flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400">{k.ime_korisnika}</p>
                    <p className="text-sm">{k.sadrzaj}</p>
                  </div>
                  {mozeObrisati && (
                    <button onClick={() => handleDeleteKomentar(k.id)}
                      className="text-gray-600 hover:text-red-400 text-xs shrink-0 transition-colors">
                      ✕
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

        </div>
      </div>
    </div>
  );
}
