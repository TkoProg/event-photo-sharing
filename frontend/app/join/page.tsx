'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pridruziSeEventu } from '../../lib/api';

interface PrevodStranice {
  naslov: string;
  podnaslov: string;
  placeholderKod: string;
  dugme: string;
  ucitavanje: string;
  nazad: string;
  [key: string]: string;
}

const PREVODI_PODACI: Record<string, PrevodStranice> = {
  BS: {
    naslov: "Pridružite se",
    podnaslov: "Unesite jedinstveni kod događaja.",
    placeholderKod: "Unesite kod",
    dugme: "Pristupi galeriji",
    ucitavanje: "Provjera...",
    nazad: "← Nazad",
    ERR_EVENT_NOT_FOUND: "Događaj sa ovim kodom ne postoji.",
    ERR_EVENT_INACTIVE: "Događaj više nije aktivan.",
    ERR_ADMIN_CANNOT_JOIN: "Administrator ne pristupa eventima putem koda.",
    ERR_ORGANIZER_CANNOT_JOIN: "Vi ste organizator ovog eventa. Pristupite mu preko liste svojih događaja."
  },
  EN: {
    naslov: "Join Event",
    podnaslov: "Enter the unique event code.",
    placeholderKod: "Enter code",
    dugme: "Access Gallery",
    ucitavanje: "Checking...",
    nazad: "← Back",
    ERR_EVENT_NOT_FOUND: "Event with this code does not exist.",
    ERR_EVENT_INACTIVE: "This event is no longer active.",
    ERR_ADMIN_CANNOT_JOIN: "Administrator cannot join events via code.",
    ERR_ORGANIZER_CANNOT_JOIN: "You are the organizer of this event. Access it through your event list."
  }
};

export default function JoinPage() {
  const router = useRouter();
  const [jezik, setJezik] = useState('BS');
  
  const [kod, setKod] = useState('');
  const [greska, setGreska] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const kodIzLinka = new URLSearchParams(window.location.search).get('code');
    if (kodIzLinka) {
      setKod(kodIzLinka);
    }
  }, []);

  useEffect(() => {
    const sacuvaniJezik = localStorage.getItem('izabraniJezik');
    if (sacuvaniJezik) {
      setJezik(sacuvaniJezik);
    }

    const provjeriJezik = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };

    window.addEventListener('storage', provjeriJezik);
    return () => window.removeEventListener('storage', provjeriJezik);
  }, []);

  const promijeniJezik = (noviJezik: string) => {
    setJezik(noviJezik);
    localStorage.setItem('izabraniJezik', noviJezik);
    window.dispatchEvent(new Event('storage'));
  };

  const t = PREVODI_PODACI[jezik] || PREVODI_PODACI.BS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska('');
    
    if (!kod.trim()) {
      setGreska(jezik === 'BS' ? 'Molimo unesite kod događaja.' : 'Please enter an event code.');
      return;
    }

    setLoading(true);

    try {
      const event = await pridruziSeEventu(kod.trim());
      router.push(`/events/${event.id}`);
    } catch (err: any) {
      const kodGreske = err.message;
      if (kodGreske && t[kodGreske]) {
        setGreska(t[kodGreske]);
      } else {
        setGreska(jezik === 'BS' ? 'Greška pri pridruživanju.' : 'Error joining event.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e60023]/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[380px] p-10 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center">
        <div className="flex justify-end mb-2">
          <button 
            type="button"
            onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
          >
            {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
          </button>
        </div>

        <div className="mb-10 text-3xl font-light tracking-tighter italic">
          Flash<span className="font-semibold text-[#e60023]">back</span>
        </div>

        <h1 className="text-xl font-medium mb-2 tracking-tight text-white">{t.naslov}</h1>
        <p className="text-xs text-gray-400 mb-8 font-light">{t.podnaslov}</p>

        {greska && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-400 text-center">
            {greska}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder={t.placeholderKod}
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-white text-center text-lg tracking-[0.2em] transition-all text-white uppercase placeholder:tracking-normal placeholder:text-sm placeholder:text-gray-600" 
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#e60023] text-white py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform mt-4 shadow-[0_0_20px_rgba(230,0,35,0.3)] disabled:bg-gray-700"
          >
            {loading ? t.ucitavanje : t.dugme}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">{t.nazad}</Link>
        </div>
      </div>
    </div>
  );
}
