'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTrenutniKorisnik, kreirajEvent } from '../../../../lib/api'; // Uvozimo funkciju iz api.ts

export default function NewEventPage() {
  const router = useRouter();
  const [jezik, setJezik] = useState('BS');
  const [provjeraUloge, setProvjeraUloge] = useState(true);
  const [mozeKreiratiEvent, setMozeKreiratiEvent] = useState(false);

  // Stanja za formu
  const [naziv, setNaziv] = useState('');
  const [datum, setDatum] = useState('');
  const [lokacija, setLokacija] = useState('');
  const [opis, setOpis] = useState('');
  
  // Stanja za greške i loading
  const [greska, setGreska] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sacuvaniJezik = localStorage.getItem('izabraniJezik');
    let animationFrameId: number | null = null;

    if (sacuvaniJezik) {
      animationFrameId = window.requestAnimationFrame(() => setJezik(sacuvaniJezik));
    }

    const provjeriJezik = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };

    window.addEventListener('storage', provjeriJezik);

    getTrenutniKorisnik()
      .then((korisnik) => {
        if (korisnik.uloga !== 'ORGANIZATOR') {
          router.replace('/organizer/events');
          return;
        }

        setMozeKreiratiEvent(true);
      })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setProvjeraUloge(false));

    return () => {
      window.removeEventListener('storage', provjeriJezik);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, [router]);

  const promijeniJezik = (noviJezik: string) => {
    setJezik(noviJezik);
    localStorage.setItem('izabraniJezik', noviJezik);
    window.dispatchEvent(new Event('storage'));
  };

  // Funkcija za slanje podataka na backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska('');
    setLoading(true);

    // Osnovna provjera na frontendu
    if (!naziv || !datum) {
      setGreska(jezik === 'BS' ? 'Naziv i datum su obavezni.' : 'Name and date are required.');
      setLoading(false);
      return;
    }

    try {
      // Šaljemo na Tamirov backend
      await kreirajEvent(naziv, datum, lokacija, opis);
      
      // Vraćamo korisnika na listu događaja gdje će vidjeti novi event
      router.push('/organizer/events');
    } catch (err: unknown) {
      setGreska(err instanceof Error ? err.message : 'Greška pri kreiranju događaja.');
    } finally {
      setLoading(false);
    }
  };

  const prevodi = {
    BS: {
      naslov: "Novi događaj",
      podnaslov: "Unesite detalje za novu galeriju.",
      placeholderNaziv: "npr. Vjenčanje Amra & Dino",
      placeholderLokacija: "Lokacija (npr. Sarajevo)",
      placeholderOpis: "Kratki opis događaja...",
      dugme: "Kreiraj događaj",
      ucitavanje: "Kreiranje...",
      nazad: "← Odustani i vrati se nazad"
    },
    EN: {
      naslov: "New Event",
      podnaslov: "Enter details for the new gallery.",
      placeholderNaziv: "e.g. Wedding Amra & Dino",
      placeholderLokacija: "Location (e.g. Sarajevo)",
      placeholderOpis: "Short event description...",
      dugme: "Create Event",
      ucitavanje: "Creating...",
      nazad: "← Cancel and go back"
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  if (provjeraUloge || !mozeKreiratiEvent) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-sans">
        <div className="text-center text-gray-500 text-sm font-light animate-pulse">
          {jezik === 'BS' ? 'Provjera dozvola...' : 'Checking permissions...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans py-20">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e60023]/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[380px] p-10 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center">
        <div className="flex justify-end mb-4">
          <button 
            type="button"
            onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
          >
            {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
          </button>
        </div>

        <div className="mb-8 text-2xl font-light tracking-tighter italic">
          Flash<span className="font-semibold text-[#e60023]">back</span>
        </div>

        <h1 className="text-xl font-medium mb-2 tracking-tight text-white">{t.naslov}</h1>
        <p className="text-xs text-gray-400 mb-6 font-light">{t.podnaslov}</p>

        {/* Prikaz greške ako backend vrati odbijenicu */}
        {greska && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-400 text-left">
            {greska}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder={t.placeholderNaziv} 
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500" 
          />
          <input 
            type="date" 
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white [color-scheme:dark]" 
          />
          <input 
            type="text" 
            placeholder={t.placeholderLokacija} 
            value={lokacija}
            onChange={(e) => setLokacija(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500" 
          />
          <textarea 
            placeholder={t.placeholderOpis} 
            rows={2} 
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500 resize-none"
          ></textarea>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:bg-gray-400"
          >
            {loading ? t.ucitavanje : t.dugme}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <Link href="/organizer/events" className="text-xs text-gray-400 hover:text-white transition-colors">{t.nazad}</Link>
        </div>
      </div>
    </div>
  );
}
