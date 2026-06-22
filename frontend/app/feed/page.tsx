'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFeed, getTrenutniKorisnik, ApiFotografija } from '@/lib/api';

const PREVODI = {
  BS: {
    naslov: 'Feed',
    podnaslov: 'Najnovije fotografije sa tvojih događaja',
    adminPodnaslov: 'Najnovije fotografije sa svih događaja',
    prazno: 'Nema fotografija još.',
    praznoOpis: 'Pridruži se događaju ili uploaduj prvu sliku!',
    nazad: '← Nazad',
    lajkova: 'lajkova',
    pretrazi: 'Pretraži...',
    greska: 'Greška pri učitavanju. Pokušaj ponovo.',
  },
  EN: {
    naslov: 'Feed',
    podnaslov: 'Latest photos from your events',
    adminPodnaslov: 'Latest photos from all events',
    prazno: 'No photos yet.',
    praznoOpis: 'Join an event or upload your first photo!',
    nazad: '← Back',
    lajkova: 'likes',
    pretrazi: 'Search...',
    greska: 'Error loading feed. Please try again.',
  }
};

export default function FeedPage() {
  const [photos, setPhotos] = useState<ApiFotografija[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm] = useState('');
  const [jezik, setJezik] = useState('BS');
  const [uloga, setUloga] = useState<string | null>(null);

  useEffect(() => {
    const sacuvani = localStorage.getItem('izabraniJezik');
    let animationFrameId: number | null = null;
    const aktivniJezik = sacuvani || 'BS';
    const porukaGreske = (aktivniJezik === 'BS' ? PREVODI.BS : PREVODI.EN).greska;

    if (sacuvani) {
      animationFrameId = window.requestAnimationFrame(() => setJezik(sacuvani));
    }

    const provjeri = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };
    window.addEventListener('storage', provjeri);

    // Dohvati feed sa backenda
    Promise.all([getFeed(), getTrenutniKorisnik()])
      .then(([data, korisnik]) => {
        setPhotos(data);
        setUloga(korisnik.uloga);
      })
      .catch(() => setError(porukaGreske))
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener('storage', provjeri);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const podnaslov = uloga === 'ADMIN' ? t.adminPodnaslov : t.podnaslov;

  // Filter po URL-u (backend nema keyword tagove, pretražujemo po ID-u ili broju)
  const filteredPhotos = photos.filter(foto =>
    !searchTerm.trim() || String(foto.id).includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">

        <header className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-white text-sm mb-4 inline-flex items-center gap-2 transition-colors">
            {t.nazad}
          </Link>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t.naslov}</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-lg">{podnaslov}</p>
        </header>

        {/* Greška */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl mb-8">
            {error}
          </div>
        )}

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
              <div key={foto.id} className="group">
                {/* ?from=feed da dugme nazad vodi na feed */}
                <Link href={`/photos/${foto.id}?from=feed`}>
                  <div className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all cursor-pointer relative">
                    <img
                      src={foto.url}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="Feed slika"
                    />
                    {foto.favorit && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-xs">⭐</div>
                    )}
                  </div>
                </Link>

                {/* Lajkovi */}
                {foto.broj_lajkova > 0 && (
                  <p className="text-xs text-gray-500 mt-2 px-1">❤️ {foto.broj_lajkova} {t.lajkova}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
