'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Photo {
  id: number;
  url: string;
  tags?: string[];
  likes?: number;
  isLiked?: boolean;
  isFavorite?: boolean;
}

const MOCK_PHOTOS: Photo[] = [
  { id: 1, url: 'https://picsum.photos/seed/photo-1/400/400', tags: ['mlada', 'vjenčanje', 'ceremonija'], likes: 12, isLiked: false, isFavorite: false },
  { id: 2, url: 'https://picsum.photos/seed/photo-2/400/400', tags: ['gosti', 'zabava', 'ples'], likes: 5, isLiked: true, isFavorite: true },
  { id: 3, url: 'https://picsum.photos/seed/photo-3/400/400', tags: ['torta', 'hrana', 'vjenčanje'], likes: 0, isLiked: false, isFavorite: false },
  { id: 4, url: 'https://picsum.photos/seed/photo-4/400/400', tags: ['priroda', 'dekoracija'], likes: 2, isLiked: false, isFavorite: false },
];

export default function PhotoDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [eventStorageKey, setEventStorageKey] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [photosList, setPhotosList] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  useEffect(() => {
    let foundPhotos: Photo[] = [];
    let foundKey = '';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('event_photos_')) {
        const localPhotos: Photo[] = JSON.parse(localStorage.getItem(key) || '[]');
        const hasPhoto = localPhotos.some((p) => String(p.id) === String(id));
        if (hasPhoto) { foundPhotos = localPhotos; foundKey = key; break; }
      }
    }

    if (foundPhotos.length === 0) {
      const hasMock = MOCK_PHOTOS.some((p) => String(p.id) === String(id));
      if (hasMock) { foundPhotos = MOCK_PHOTOS; foundKey = 'event_photos_1'; }
    }

    if (foundPhotos.length > 0) {
      const sorted = [...foundPhotos].sort((a, b) => b.id - a.id);
      setPhotosList(sorted);
      setEventStorageKey(foundKey);
      const idx = sorted.findIndex((p) => String(p.id) === String(id));
      setCurrentIndex(idx);
      setPhoto(sorted[idx]);
    }
  }, [id]);

  const navigateTo = (index: number) => {
    if (index >= 0 && index < photosList.length) {
      router.push(`/photos/${photosList[index].id}`);
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

  // Pametna funkcija koja rješava problem sa ažuriranjem testnih slika
  const savePhotoUpdate = (updatedPhoto: Photo) => {
    let allPhotos: Photo[] = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
    
    // Ako je baza prazna, napuni je sa MOCK_PHOTOS kao početnom tačkom
    if (allPhotos.length === 0) {
      allPhotos = [...MOCK_PHOTOS];
    }
    
    const exists = allPhotos.some(p => String(p.id) === String(id));
    let updatedPhotos;
    if (exists) {
      updatedPhotos = allPhotos.map(p => String(p.id) === String(id) ? updatedPhoto : p);
    } else {
      updatedPhotos = [...allPhotos, updatedPhoto];
    }
    
    localStorage.setItem(eventStorageKey, JSON.stringify(updatedPhotos));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !photo) return;
    const tag = newTag.trim().toLowerCase();
    if (!photo.tags?.includes(tag)) {
      const updatedTags = [...(photo.tags || []), tag];
      const updatedPhoto = { ...photo, tags: updatedTags };
      setPhoto(updatedPhoto);
      savePhotoUpdate(updatedPhoto);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!photo) return;
    const updatedTags = photo.tags?.filter(tag => tag !== tagToRemove);
    const updatedPhoto = { ...photo, tags: updatedTags };
    setPhoto(updatedPhoto);
    savePhotoUpdate(updatedPhoto);
  };

  const handleLike = () => {
    if (!photo) return;
    const currentLikes = photo.likes || 0;
    const newIsLiked = !photo.isLiked;
    const newLikesCount = newIsLiked ? currentLikes + 1 : currentLikes - 1;
    const updatedPhoto = { ...photo, likes: newLikesCount, isLiked: newIsLiked };
    setPhoto(updatedPhoto);
    savePhotoUpdate(updatedPhoto);
  };

  const handleFavorite = () => {
    if (!photo) return;
    const newIsFavorite = !photo.isFavorite;
    const updatedPhoto = { ...photo, isFavorite: newIsFavorite };
    setPhoto(updatedPhoto);
    savePhotoUpdate(updatedPhoto);
  };

  const handleBackToGallery = () => {
    if (eventStorageKey) {
      const currentEventId = eventStorageKey.replace('event_photos_', '');
      router.push(`/events/${currentEventId}?tab=photos`);
    } else {
      router.push('/');
    }
  };

  const confirmDelete = () => {
    if (!photo) return;
    const allPhotos: Photo[] = JSON.parse(localStorage.getItem(eventStorageKey) || '[]');
    const updatedPhotos = allPhotos.filter(p => String(p.id) !== String(id));
    localStorage.setItem(eventStorageKey, JSON.stringify(updatedPhotos));
    handleBackToGallery();
  };

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-xl text-gray-500 animate-pulse">Slika nije pronađena :(</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative overflow-hidden w-full max-w-[100vw]">
      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-white">Brisanje slike</h3>
            <p className="text-gray-400 mb-8">Jesi li sigurna da želiš trajno obrisati ovu sliku?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 text-white font-semibold">Odustani</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-500 rounded-xl hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20">Izbriši</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full">
        <button onClick={handleBackToGallery} className="text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition-all">
          ← Nazad u galeriju
        </button>
        <button onClick={() => setShowDeleteModal(true)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">
          🗑️ Izbriši sliku
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 w-full">
        
        <div className="flex-1 bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-center relative group min-h-[50vh] lg:min-h-[70vh] w-full">
          <button onClick={() => navigateTo(currentIndex - 1)} disabled={currentIndex <= 0} className="absolute left-2 md:left-4 bg-black/50 md:bg-black/60 backdrop-blur-md p-2 md:p-3 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all z-10 disabled:opacity-0 disabled:pointer-events-none opacity-100 md:opacity-0 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <img src={photo.url} alt={`Slika ${photo.id}`} className="w-full h-auto max-h-[70vh] object-contain rounded-2xl select-none" draggable="false" />

          <button onClick={() => navigateTo(currentIndex + 1)} disabled={currentIndex >= photosList.length - 1} className="absolute right-2 md:right-4 bg-black/50 md:bg-black/60 backdrop-blur-md p-2 md:p-3 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all z-10 disabled:opacity-0 disabled:pointer-events-none opacity-100 md:opacity-0 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <div className="lg:w-96 space-y-8 w-full">
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold mb-4 text-white">Tagovi</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {(!photo.tags || photo.tags.length === 0) ? (
                <p className="text-sm text-gray-500 italic">Ova slika nema tagova.</p>
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
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Dodaj tag..." className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-white/30 outline-none" />
              <button type="submit" className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200">+</button>
            </form>
          </div>

          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <div className="flex items-center gap-4">
                 <button onClick={handleLike} className="text-3xl hover:scale-110 transition-transform active:scale-95">
                   {photo.isLiked ? '❤️' : '🤍'}
                 </button>
                 <span className="font-bold text-lg text-white">{photo.likes || 0} lajkova</span>
               </div>

               <button
                 onClick={handleFavorite}
                 className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                   photo.isFavorite
                     ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20'
                     : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                 }`}
               >
                 {photo.isFavorite ? '⭐ U favoritima' : '☆ Dodaj u favorite'}
               </button>
            </div>
            
            <h3 className="font-bold text-white">Komentari</h3>
            <div className="space-y-3">
              <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-gray-400">Amra</p>
                <p className="text-sm text-white">Predivna slika! 😍</p>
              </div>
              <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-gray-400">Dino</p>
                <p className="text-sm text-white">Odličan ugao hvatanja.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}