'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AlbumDetails() {
  const params = useParams();
  const router = useRouter();
  
  const id = params?.id;
  const albumId = Number(params?.albumId);
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [albumName, setAlbumName] = useState('Album');
  const [mounted, setMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (albumId) {
      const savedPhotos = localStorage.getItem(`album_photos_${albumId}`);
      if (savedPhotos) {
        try {
          setPhotos(JSON.parse(savedPhotos));
        } catch (e) {
          console.error("Greška pri učitavanju:", e);
        }
      }

      const savedAlbums = localStorage.getItem('moji_albumi');
      if (savedAlbums) {
        const albums = JSON.parse(savedAlbums);
        const currentAlbum = albums.find((a: any) => a.id === albumId);
        if (currentAlbum) setAlbumName(currentAlbum.name);
      }
    }
  }, [albumId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ako lightbox nije otvoren, ništa ne radi
      if (selectedIndex === null) return;

      if (e.key === 'ArrowRight') {
        // Sljedeća slika
        if (selectedIndex < photos.length - 1) {
          setSelectedIndex(selectedIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        // Prethodna slika
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        }
      } else if (e.key === 'Escape') {
        // Zatvori na Esc tipku
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Ovo je bitno: ukloni listener kad se komponenta unmount-a ili kad se promijeni state
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, photos.length]);

  // Funkcija za brisanje slike
  const deletePhoto = () => {
    if (selectedIndex === null) return;
    
    const updatedPhotos = photos.filter((_, index) => index !== selectedIndex);
    setPhotos(updatedPhotos);
    localStorage.setItem(`album_photos_${albumId}`, JSON.stringify(updatedPhotos));

    // Podešavanje indexa nakon brisanja
    if (updatedPhotos.length === 0) {
      setSelectedIndex(null); // Zatvori lightbox ako više nema slika
    } else if (selectedIndex >= updatedPhotos.length) {
      setSelectedIndex(updatedPhotos.length - 1); // Vrati na prethodnu ako smo obrisali zadnju
    }
    // Ako smo obrisali sliku u sredini, sljedeća će automatski doći na taj index
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-sans">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => router.replace(`/events/${id}?tab=albums`)} 
          className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          &larr; Nazad
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-8">{albumName}</h1>

      {photos.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-3xl">
          Nema slika u albumu.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((url, i) => (
            <div 
              key={i} 
              className="aspect-square overflow-hidden rounded-2xl border border-white/10 hover:border-white/30 transition-all cursor-pointer"
              onClick={() => setSelectedIndex(i)}
            >
              <img src={url} alt="Album slika" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedIndex(null); setShowDeleteConfirm(false); }}
        >
          {/* Kontrole */}
          <div className="absolute top-6 right-6 flex items-center gap-4">
            {/* OVDJE SMO DODALI LOGIKU ZA POTVRDU */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-xl animate-in fade-in">
                <span className="text-sm">Sigurna?</span>
                <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} className="text-gray-400 hover:text-white">Ne</button>
                <button onClick={(e) => { e.stopPropagation(); deletePhoto(); setShowDeleteConfirm(false); }} className="text-red-500 font-bold hover:text-red-400">Da</button>
              </div>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="text-red-500 hover:text-red-400 font-bold px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
              >
                Izbriši
              </button>
            )}
            
            <button className="text-white/70 hover:text-white text-4xl" onClick={() => setSelectedIndex(null)}>&times;</button>
          </div>

          {/* Strelice i slika ostaju isti kao prije... */}
          {selectedIndex > 0 && (
            <button onClick={prevImage} className="absolute left-6 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <span className="text-2xl font-bold">&larr;</span>
            </button>
          )}

          <img 
            src={photos[selectedIndex]} 
            alt="Full view" 
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {selectedIndex < photos.length - 1 && (
            <button onClick={nextImage} className="absolute right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all">
              <span className="text-2xl font-bold">&rarr;</span>
            </button>
          )}

          <div className="absolute bottom-6 text-gray-400 bg-black/50 px-3 py-1 rounded-full">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}