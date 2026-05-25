'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
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
      placeholderEmail: "Email",
      placeholderLozinka: "Lozinka",
      dugme: "Prijavi se",
      pitanje: "Nemaš račun?",
      akcija: "Registruj se"
    },
    EN: {
      placeholderEmail: "Email",
      placeholderLozinka: "Password",
      dugme: "Sign in",
      pitanje: "Don't have an account?",
      akcija: "Register"
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

        <form className="space-y-4">
          <input type="email" placeholder={t.placeholderEmail} className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500" />
          <input type="password" placeholder={t.placeholderLozinka} className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500" />
          <Link href="/dashboard" className="w-full block text-center bg-white text-black py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-transform mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            {t.dugme}
          </Link>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
          <p className="text-xs text-gray-400">
            {t.pitanje} <Link href="/register" className="text-white font-semibold hover:text-[#e60023] transition-colors">{t.akcija}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}