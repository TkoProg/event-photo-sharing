'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Photo {
  id: number;
  url: string;
  tags?: string[];
  isFavorite?: boolean;
}

interface Album {
  id: number | string;
  name: string;
  count: number;
}

const MOCK_PHOTOS: Photo[] = [
  { id: 1, url: 'https://picsum.photos/seed/photo-1/400/400', tags: ['mlada', 'vjenčanje', 'ceremonija'], isFavorite: false },
  { id: 2, url: 'https://picsum.photos/seed/photo-2/400/400', tags: ['gosti', 'zabava', 'ples'], isFavorite: true },
  { id: 3, url: 'https://picsum.photos/seed/photo-3/400/400', tags: ['torta', 'hrana', 'vjenčanje'], isFavorite: false },
  { id: 4, url: 'https://picsum.photos/seed/photo-4/400/400', tags: ['priroda', 'dekoracija'], isFavorite: false },
];

export default function AlbumDetails() {
  const params = useParams();
  const eventId = params?.id as string;
  const albumId = params?.albumId as string;
  const router = useRouter();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albumName, setAlbumName] = useState('Učitavanje...');

  useEffect(() => {
    if (!eventId || !albumId) return;

    // 1. UKOLIKO KORISNIK OTVORI ALBUM "FAVORITI"
    if (albumId === 'favorites') {
      setAlbumName('⭐ Favoriti');
      const savedPhotos = localStorage.getItem(`event_photos_${eventId}`);
      
      // Koristimo spasene slike, a ako ih nema u bazi uzimamo MOCK_PHOTOS kao osnovu
      const allPhotos: Photo[] = savedPhotos ? JSON.parse(savedPhotos) : MOCK_PHOTOS;
      const favs = allPhotos.filter(p => p.isFavorite === true);
      setPhotos(favs);
    } 
    // 2. UKOLIKO KORISNIK OTVORI BILO KOJI DRUGI OBIČNI ALBUM
    else {
      const savedAlbums = localStorage.getItem('moji_albumi');
      if (savedAlbums) {
        const albums: Album[] = JSON.parse(savedAlbums);
        const current = albums.find(a => String(a.id) === String(albumId));
        if (current) setAlbumName(current.name);
      }

      const albumPhotosUrls: string[] = JSON.parse(localStorage.getItem(`album_photos_${albumId}`) || '[]');
      const allEventPhotos: Photo[] = JSON.parse(localStorage.getItem(`event_photos_${eventId}`) || '[]');
      
      const matchedPhotos = allEventPhotos.filter(p => albumPhotosUrls.includes(p.url));
      setPhotos(matchedPhotos);
    }
  }, [eventId, albumId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        
        <button onClick={() => router.back()} className="mb-8 text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition-all">
          ← Nazad na albume
        </button>

        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">{albumName}</h1>
          <p className="text-gray-400 mt-3 text-sm md:text-lg">Ukupno fotografija: {photos.length}</p>
        </header>

        {photos.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#111] rounded-3xl border border-white/5">
            <p className="text-4xl mb-3">📭</p>
            <p>Ovaj album je trenutno prazan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {photos.map((foto) => (
              <Link key={foto.id} href={`/photos/${foto.id}`}>
                <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 relative cursor-pointer group">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}