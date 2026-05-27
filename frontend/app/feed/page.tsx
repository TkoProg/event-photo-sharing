'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
 
interface Photo {
  id: number;
  url: string;
  tags: string[];
  isFavorite?: boolean;
  likes?: number;
  eventId: string;
  eventName: string;
}
 
interface EventData {
  id: number;
  name: string;
}
 
const PREVODI = {
  BS: {
    naslov: 'Feed',
    podnaslov: 'Najnovije fotografije sa tvojih događaja',
    prazno: 'Nema fotografija još.',
    praznoOpis: 'Pridruži se događaju ili uploaduj prvu sliku!',
    nazad: '← Nazad',
    lajkova: 'lajkova',
    pretrazi: 'Pretraži po tagu...',
  },
  EN: {
    naslov: 'Feed',
    podnaslov: 'Latest photos from your events',
    prazno: 'No photos yet.',
    praznoOpis: 'Join an event or upload your first photo!',
    nazad: '← Back',
    lajkova: 'likes',
    pretrazi: 'Search by tag...',
  }
};
 
export default function FeedPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jezik, setJezik] = useState('BS');
 
  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    if (sacuvani) setJezik(sacuvani);
 
    const provjeri = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };
    window.addEventListener('storage', provjeri);
 
    // Učitaj sve slike sa svih događaja
    const savedEvents = localStorage.getItem('moji_dogadjaji');
    if (!savedEvents) { setLoading(false); return; }
 
    const events: EventData[] = JSON.parse(savedEvents);
    const allPhotos: Photo[] = [];
 
    events.forEach(event => {
      const savedPhotos = localStorage.getItem(`event_photos_${event.id}`);
      if (savedPhotos) {
        const eventPhotos = JSON.parse(savedPhotos);
        eventPhotos.forEach((photo: Photo) => {
          allPhotos.push({
            ...photo,
            eventId: String(event.id),
            eventName: event.name,
          });
        });
      }
    });
 
    allPhotos.sort((a, b) => b.id - a.id);
    setPhotos(allPhotos);
    setLoading(false);
 
    return () => window.removeEventListener('storage', provjeri);
  }, []);
 
  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
 
  const filteredPhotos = photos.filter(foto =>
    !searchTerm.trim() || foto.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
 
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
 
        <header className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-white text-sm mb-4 inline-flex items-center gap-2 transition-colors">
            {t.nazad}
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t.naslov}</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-lg">{t.podnaslov}</p>
        </header>
 
        {/* Search */}
        <div className="relative mb-8 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            type="text"
            placeholder={t.pretrazi}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all"
          />
        </div>
 
        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-5xl mb-4">📷</p>
            <p className="text-xl font-bold text-white mb-2">{t.prazno}</p>
            <p className="text-sm">{t.praznoOpis}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredPhotos.map(foto => (
              <div key={`${foto.eventId}-${foto.id}`} className="group">
                {/* ← KLJUČNA IZMJENA: dodajemo ?from=feed u link */}
                <Link href={`/photos/${foto.id}?from=feed`}>
                  <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all cursor-pointer relative">
                    <img
                      src={foto.url}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="Feed slika"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-xs font-semibold text-white truncate">{foto.eventName}</p>
                    </div>
                    {foto.isFavorite && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-xs">⭐</div>
                    )}
                  </div>
                </Link>
 
                {foto.tags && foto.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {foto.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-white/5 text-[10px] uppercase px-2 py-0.5 rounded-md text-gray-400 border border-white/5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
 
                <div className="flex items-center justify-between mt-2 px-1">
                  <p className="text-xs text-gray-500 truncate">{foto.eventName}</p>
                  {foto.likes !== undefined && foto.likes > 0 && (
                    <p className="text-xs text-gray-500 flex-shrink-0">❤️ {foto.likes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}