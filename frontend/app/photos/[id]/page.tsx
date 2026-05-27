'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
 
interface Photo {
  id: number;
  url: string;
  tags?: string[];
  likes?: number;
  isLiked?: boolean;
  isFavorite?: boolean;
  comments?: { user: string; text: string }[];
}
 
interface Comment {
  id: number;
  author: string;
  text: string;
}
 
const MOCK_PHOTOS: Photo[] = [
  { id: 1, url: 'https://picsum.photos/seed/photo-1/400/400', tags: ['mlada', 'vjenčanje', 'ceremonija'], likes: 12, isLiked: false, isFavorite: false },
  { id: 2, url: 'https://picsum.photos/seed/photo-2/400/400', tags: ['gosti', 'zabava', 'ples'], likes: 5, isLiked: true, isFavorite: true },
  { id: 3, url: 'https://picsum.photos/seed/photo-3/400/400', tags: ['torta', 'hrana', 'vjenčanje'], likes: 0, isLiked: false, isFavorite: false },
  { id: 4, url: 'https://picsum.photos/seed/photo-4/400/400', tags: ['priroda', 'dekoracija'], likes: 2, isLiked: false, isFavorite: false },
];
 
// ─── Prijevodi ────────────────────────────────────────────────────────────────
const PREVODI = {
  BS: {
    nazadUGaleriju: '← Nazad u galeriju',
    nazadNaFeed: '← Nazad na feed',
    obrisiSliku: '🗑️ Izbriši sliku',
    tagovi: 'Tagovi',
    dodajTag: 'Dodaj tag...',
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
    nemaTagova: 'Ova slika nema tagova.',
    nemaKomentara: 'Još nema komentara.',
  },
  EN: {
    nazadUGaleriju: '← Back to gallery',
    nazadNaFeed: '← Back to feed',
    obrisiSliku: '🗑️ Delete photo',
    tagovi: 'Tags',
    dodajTag: 'Add tag...',
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
    nemaTagova: 'This photo has no tags.',
    nemaKomentara: 'No comments yet.',
  }
};
 
export default function PhotoDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
 
  // ← KLJUČNO: čitamo odakle je korisnik došao
  const from = searchParams.get('from'); // 'feed' ili null
 
  const [jezik, setJezik] = useState('BS');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventStorageKey, setEventStorageKey] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [photosList, setPhotosList] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
 
  // Učitaj jezik
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
 
  // Učitaj komentare
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`photo_comments_${id}`);
    if (saved) {
      setComments(JSON.parse(saved));
    } else {
      const mock = [
        { id: 1, author: 'Amra', text: 'Predivna slika! 😍' },
        { id: 2, author: 'Dino', text: 'Odličan ugao hvatanja.' },
      ];
      setComments(mock);
      localStorage.setItem(`photo_comments_${id}`, JSON.stringify(mock));
    }
  }, [id]);
 
  // Učitaj sliku
  useEffect(() => {
    let foundPhotos: Photo[] = [];
    let foundKey = '';
 
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('event_photos_')) {
        const localPhotos: Photo[] = JSON.parse(localStorage.getItem(key) || '[]');
        const hasPhoto = localPhotos.some(p => String(p.id) === String(id));
        if (hasPhoto) { foundPhotos = localPhotos; foundKey = key; break; }
      }
    }
 
    if (foundPhotos.length === 0) {
      const hasMock = MOCK_PHOTOS.some(p => String(p.id) === String(id));
      if (hasMock) { foundPhotos = MOCK_PHOTOS; foundKey = 'event_photos_1'; }
    }
 
    if (foundPhotos.length > 0) {
      const sorted = [...foundPhotos].sort((a, b) => b.id - a.id);
      setPhotosList(sorted);
      setEventStorageKey(foundKey);
      const idx = sorted.findIndex(p => String(p.id) === String(id));
      setCurrentIndex(idx);
      setPhoto(sorted[idx]);
    }
 
    setLoading(false);
  }, [id]);
 
  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
 
  const navigateTo = (index: number) => {
    if (index >= 0 && index < photosList.length) {
      // Zadržavamo ?from=feed pri navigaciji između slika
      const fromParam = from ? `?from=${from}` : '';
      router.push(`/photos/${photosList[index].id}${fromParam}`);
    }
  };
 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex === -1 || photosList.length <= 1) return;
      if (e.key === 'ArrowRight') navigateTo(currentIndex + 1);
      else if (e.key === 'ArrowLeft') navigateTo(currentIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photosList]);
 
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentIndex < photosList.length - 1) navigateTo(currentIndex + 1);
    if (distance < -50 && currentIndex > 0) navigateTo(currentIndex - 1);
  };
 
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !photo) return;
    const tag = newTag.trim().toLowerCase();
    if (!photo.tags?.includes(tag)) {
      const updatedPhoto = { ...photo, tags: [...(photo.tags || []), tag] };
      setPhoto(updatedPhoto);
      const allPhotos: Photo[] = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
      const exists = allPhotos.some(p => String(p.id) === String(id));
      const updatedPhotos = exists
        ? allPhotos.map(p => String(p.id) === String(id) ? updatedPhoto : p)
        : [...allPhotos, updatedPhoto];
      localStorage.setItem(eventStorageKey, JSON.stringify(updatedPhotos));
    }
    setNewTag('');
  };
 
  const handleRemoveTag = (tagToRemove: string) => {
    if (!photo) return;
    const updatedPhoto = { ...photo, tags: photo.tags?.filter(tag => tag !== tagToRemove) };
    setPhoto(updatedPhoto);
    const allPhotos: Photo[] = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
    localStorage.setItem(eventStorageKey, JSON.stringify(allPhotos.map(p => String(p.id) === String(id) ? updatedPhoto : p)));
  };
 
  const handleLike = () => {
    if (!photo) return;
    const updatedPhoto = { ...photo, likes: (photo.likes || 0) + (photo.isLiked ? -1 : 1), isLiked: !photo.isLiked };
    setPhoto(updatedPhoto);
    const allPhotos: Photo[] = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
    localStorage.setItem(eventStorageKey, JSON.stringify(allPhotos.map(p => String(p.id) === String(id) ? updatedPhoto : p)));
  };
 
  const handleFavorite = () => {
    if (!photo) return;
    const updatedPhoto = { ...photo, isFavorite: !photo.isFavorite };
    setPhoto(updatedPhoto);
    const allPhotos: Photo[] = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
    localStorage.setItem(eventStorageKey, JSON.stringify(allPhotos.map(p => String(p.id) === String(id) ? updatedPhoto : p)));
  };
 
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: Comment = { id: Date.now(), author: 'Ja', text: newComment.trim() };
    const updated = [...comments, comment];
    setComments(updated);
    localStorage.setItem(`photo_comments_${id}`, JSON.stringify(updated));
    setNewComment('');
  };
 
  // ← KLJUČNO: funkcija za nazad gleda odakle je korisnik došao
  const handleBack = () => {
    if (from === 'feed') {
      router.push('/feed');
    } else if (eventStorageKey) {
      const currentEventId = eventStorageKey.replace('event_photos_', '');
      router.push(`/events/${currentEventId}?tab=photos`);
    } else {
      router.push('/');
    }
  };
 
  const confirmDelete = () => {
    if (!photo) return;
    const allPhotos: Photo[] = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
    localStorage.setItem(eventStorageKey, JSON.stringify(allPhotos.filter(p => String(p.id) !== String(id))));
    handleBack();
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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden w-full max-w-[100vw]">
 
      {/* Modal za brisanje */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">{t.brisuceSliku}</h3>
            <p className="text-gray-400 mb-8">{t.sigurna}</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 font-semibold">{t.odustani}</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-500 rounded-xl hover:bg-red-600 font-bold">{t.izbrisi}</button>
            </div>
          </div>
        </div>
      )}
 
      {/* Header — KLJUČNO: dugme nazad prikazuje pravi tekst */}
      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full">
        <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition-all">
          {from === 'feed' ? t.nazadNaFeed : t.nazadUGaleriju}
        </button>
        <button onClick={() => setShowDeleteModal(true)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">
          {t.obrisiSliku}
        </button>
      </div>
 
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 w-full">
 
        {/* Slika sa strelicama */}
        <div
          className="flex-1 bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-center relative group min-h-[50vh] lg:min-h-[70vh] w-full"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        >
          <button onClick={() => navigateTo(currentIndex - 1)} disabled={currentIndex <= 0}
            className="absolute left-2 md:left-4 bg-black/50 backdrop-blur-md p-2 md:p-3 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all z-10 disabled:opacity-0 disabled:pointer-events-none opacity-100 md:opacity-0 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
 
          <img src={photo.url} alt={`Slika ${photo.id}`} className="w-full h-auto max-h-[70vh] object-contain rounded-2xl select-none" draggable="false" />
 
          <button onClick={() => navigateTo(currentIndex + 1)} disabled={currentIndex >= photosList.length - 1}
            className="absolute right-2 md:right-4 bg-black/50 backdrop-blur-md p-2 md:p-3 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all z-10 disabled:opacity-0 disabled:pointer-events-none opacity-100 md:opacity-0 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
 
        {/* Sidebar */}
        <div className="lg:w-96 space-y-8 w-full">
 
          {/* Tagovi */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold mb-4">{t.tagovi}</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {(!photo.tags || photo.tags.length === 0) ? (
                <p className="text-sm text-gray-500 italic">{t.nemaTagova}</p>
              ) : (
                photo.tags.map(tag => (
                  <span key={tag} className="bg-white/10 text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg text-white font-semibold flex items-center gap-2">
                    #{tag}
                    <button onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-400">✕</button>
                  </span>
                ))
              )}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} placeholder={t.dodajTag}
                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-white/30 outline-none" />
              <button type="submit" className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200">+</button>
            </form>
          </div>
 
          {/* Lajkovi, favoriti i komentari */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4">
 
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="text-3xl hover:scale-110 transition-transform active:scale-95">
                  {photo.isLiked ? '❤️' : '🤍'}
                </button>
                <span className="font-bold text-lg">{photo.likes || 0} {t.lajkova}</span>
              </div>
              <button onClick={handleFavorite}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${photo.isFavorite ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                {photo.isFavorite ? t.uFavoritima : t.dodajUFavorite}
              </button>
            </div>
 
            <h3 className="font-bold">
              {t.komentari} ({comments.length})
            </h3>
 
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t.napisiKomentar}
                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-white/30 outline-none" />
              <button type="submit" className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200">➤</button>
            </form>
 
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 italic">{t.nemaKomentara}</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="bg-black/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs font-bold text-gray-400">{c.author}</p>
                    <p className="text-sm">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}