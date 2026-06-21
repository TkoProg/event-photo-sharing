'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { kreirajAlbum } from '@/lib/api';

const PREVODI = {
  BS: {
    nazad: 'Nazad',
    naslov: 'Novi album',
    podnaslov: 'Kreiraj album i dodaj slike ili videe iz galerije',
    labelNaziv: 'Naziv albuma',
    placeholder: 'Npr. Ljetovanje 2026...',
    odustani: 'Odustani',
    kreiraj: 'Kreiraj album',
    kreiranje: 'Kreiranje...',
    greska: 'Greška pri kreiranju albuma. Pokušaj ponovo.',
    praznoPolje: 'Upiši naziv albuma.',
  },
  EN: {
    nazad: 'Back',
    naslov: 'New album',
    podnaslov: 'Create an album and add photos or videos from the gallery',
    labelNaziv: 'Album name',
    placeholder: 'E.g. Summer 2026...',
    odustani: 'Cancel',
    kreiraj: 'Create album',
    kreiranje: 'Creating...',
    greska: 'Error creating album. Please try again.',
    praznoPolje: 'Enter an album name.',
  },
};

export default function CreateAlbumPage() {
  const [albumName, setAlbumName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [jezik, setJezik] = useState('BS');
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('izabraniJezik');
    if (saved) setJezik(saved);
    // Fokusiraj input odmah
    inputRef.current?.focus();
  }, []);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;

  const handleCreate = async () => {
    if (albumName.trim() === '') {
      setErrorMsg(t.praznoPolje);
      inputRef.current?.focus();
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await kreirajAlbum(Number(eventId), albumName.trim(), '', 'FINALNI');
      router.push(`/events/${eventId}?tab=albums`);
    } catch {
      setErrorMsg(t.greska);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">

      {/* Header */}
      <header className="border-b border-white/5 px-6 md:px-12 py-5">
        <button
          onClick={() => router.replace(`/events/${eventId}?tab=albums`)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {t.nazad}
        </button>
      </header>

      {/* Sadržaj */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Ikona i naslov */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t.naslov}</h1>
            <p className="text-gray-500 text-sm mt-2">{t.podnaslov}</p>
          </div>

          {/* Forma */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 tracking-wider uppercase ml-1">
              {t.labelNaziv}
            </label>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={albumName}
                onChange={e => { setAlbumName(e.target.value); setErrorMsg(''); }}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                maxLength={80}
                className={`w-full bg-[#111] border rounded-2xl px-5 py-4 text-white text-sm placeholder:text-gray-700 focus:outline-none transition-all ${
                  errorMsg
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/5 focus:border-white/20'
                }`}
              />
              {/* Enter hint */}
              {albumName.trim().length > 0 && !loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  ↵
                </div>
              )}
            </div>

            {/* Greška */}
            {errorMsg && (
              <p className="text-red-400 text-xs ml-1">{errorMsg}</p>
            )}

            {/* Brojač znakova */}
            <p className="text-gray-700 text-xs text-right mr-1">
              {albumName.length}/80
            </p>
          </div>

          {/* Dugmad */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => router.back()}
              className="flex-1 px-5 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-semibold text-gray-400 hover:text-white active:scale-95"
            >
              {t.odustani}
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || albumName.trim() === ''}
              className="flex-1 px-5 py-3.5 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition-all text-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  {t.kreiranje}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  {t.kreiraj}
                </>
              )}
            </button>
          </div>

          {/* Enter hint ispod */}
          <p className="text-center text-gray-700 text-xs mt-5">
            {albumName.trim().length > 0 ? (
              <span>Pritisni <kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-500 font-mono text-[10px]">Enter</kbd> da kreiras</span>
            ) : null}
          </p>

        </div>
      </div>
    </div>
  );
}