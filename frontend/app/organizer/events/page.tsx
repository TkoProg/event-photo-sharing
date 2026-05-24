'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EventsListPage() {
  const [jezik, setJezik] = useState('BS');

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

  const prevodi = {
    BS: {
      naslov: "Moji događaji",
      dugmeNovi: "+ Novi događaj",
      kodGosta: "Kod za goste",
      nazad: "← Nazad na početak"
    },
    EN: {
      naslov: "My Events",
      dugmeNovi: "+ New Event",
      kodGosta: "Guest code",
      nazad: "← Back to home"
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  const mojiEventi = [
    { id: 1, naziv: "Svadba Amra & Dino", datum: "20.06.2026.", kod: "SARA2026" },
    { id: 2, naziv: "Rođendan", datum: "15.05.2026.", kod: "RODJ99" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center relative overflow-hidden font-sans py-12 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-[#e60023]/10 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight">{t.naslov}</h1>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
            >
              {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
            </button>
            <Link href="/organizer/events/new" className="bg-[#e60023] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#c4001d] transition-colors shadow-lg">
              {t.dugmeNovi}
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {mojiEventi.map((event) => (
            <Link 
              href={`/events/${event.id}`}
              key={event.id} 
              className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl flex justify-between items-center hover:border-white/20 transition-all cursor-pointer"
            >
              <div>
                <h2 className="text-xl font-semibold">{event.naziv}</h2>
                <p className="text-sm text-gray-500">{event.datum}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t.kodGosta}</p>
                <p className="font-mono text-[#e60023] font-bold text-lg tracking-wider">{event.kod}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
            {t.nazad}
          </Link>
        </div>
      </div>
    </div>
  );
}