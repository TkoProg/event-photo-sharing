'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JoinPage() {
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
      naslov: "Pridružite se",
      podnaslov: "Unesite jedinstveni kod događaja.",
      placeholderKod: "Unesite kod",
      dugme: "Pristupi galeriji",
      nazad: "← Nazad"
    },
    EN: {
      naslov: "Join Event",
      podnaslov: "Enter the unique event code.",
      placeholderKod: "Enter code",
      dugme: "Access Gallery",
      nazad: "← Back"
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

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
          Event<span className="font-semibold text-[#e60023]">Photo</span>
        </div>

        <h1 className="text-xl font-medium mb-2 tracking-tight text-white">{t.naslov}</h1>
        <p className="text-xs text-gray-400 mb-8 font-light">{t.podnaslov}</p>

        <form className="space-y-4">
          <input type="text" placeholder={t.placeholderKod} className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-white text-center text-lg tracking-[0.2em] transition-all text-white lowercase placeholder:tracking-normal placeholder:text-sm placeholder:text-gray-600" />
          <button className="w-full bg-[#e60023] text-white py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-transform mt-4 shadow-[0_0_20px_rgba(230,0,35,0.3)]">{t.dugme}</button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">{t.nazad}</Link>
        </div>
      </div>
    </div>
  );
}