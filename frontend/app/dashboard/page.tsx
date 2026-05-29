'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
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

  // ─── ČISTA I SIGURNA ODJAVA BEZ VANJSKIH FUNKCIJA ─────────────────────────
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Brišemo token direktno iz memorije browsera
    localStorage.removeItem('token');
    localStorage.clear();
    
    // Tvrdo preusmjeravanje na login stranicu (čisti keš)
    window.location.href = '/';
  };
  // ─────────────────────────────────────────────────────────────────────────

  const prevodi = {
    BS: {
      odjaviSe: "Odjavi se",
      badge: "Vaša privatna galerija uspomena",
      naslovPrviDio: "Uspomene koje",
      naslovDrugiDio: "ne blijede.",
      opis: "Tamo gdje se vaše fotografije pretvaraju u uspomene koje traju. Podijelite radost, emocije i uspomene sa svima koji su bili dio trenutka.",
      unesiKod: "Unesi kod događaja",
      mojiEventi: "Moji događaji",
      adminNaslov: "Admin Panel",
      adminOpis: "Upravljanje korisnicima i sistemom"
    },
    EN: {
      odjaviSe: "Log out",
      badge: "Your private gallery of memories",
      naslovPrviDio: "Memories that",
      naslovDrugiDio: "never fade.",
      opis: "Where your photos turn into memories that last. Share joy, emotions, and memories with everyone who was part of the moment.",
      unesiKod: "Enter event code",
      mojiEventi: "My events",
      adminNaslov: "Admin Panel",
      adminOpis: "User and system management"
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-gradient-to-b from-[#e60023]/20 to-transparent blur-[120px] pointer-events-none"></div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="text-xl font-bold tracking-tighter">
          Event<span className="text-[#e60023]">Photo</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
          >
            {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
          </button>

          {/* SREĐENO DUGME ZA ODJAVU SA ISPRAVNIM REACt KLIKOM */}
          <button 
            type="button"
            onClick={handleLogout}
            className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer font-sans"
          >
            {t.odjaviSe}
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center pt-4 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#e60023] animate-pulse"></span>{t.badge}
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
          {t.naslovPrviDio} <br/> {t.naslovDrugiDio}
        </h1>
        
        <p className="text-lg text-gray-400 mb-12 max-w-xl font-light">{t.opis}</p>

        <div className="relative w-full max-w-4xl h-[320px] sm:h-[400px] mb-12">
          <div className="absolute top-10 left-4 sm:left-10 w-40 sm:w-64 h-48 sm:h-56 bg-gray-800 rounded-2xl rotate-[-12deg] overflow-hidden border border-white/10 shadow-2xl hover:rotate-0 hover:scale-110 transition-all duration-500 cursor-pointer hover:z-30">
             <img src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600" className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" alt="Svadba" />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 sm:w-80 h-64 sm:h-72 bg-gray-800 rounded-2xl z-20 overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(230,0,35,0.15)] hover:scale-105 transition-all duration-500 cursor-pointer">
             <img src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800" className="w-full h-full object-cover" alt="Proslava" />
          </div>
          <div className="absolute top-10 right-4 sm:right-10 w-40 sm:w-64 h-48 sm:h-56 bg-gray-800 rounded-2xl rotate-[12deg] overflow-hidden border border-white/10 shadow-2xl hover:rotate-0 hover:scale-110 transition-all duration-500 cursor-pointer hover:z-30">
             <img src="https://images.unsplash.com/photo-1530103043960-ef38714abb15?q=80&w=600" className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" alt="Zabava" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto z-20 pb-16">
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link href="/join" className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">{t.unesiKod}</Link>
            <Link href="/organizer/events" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full text-sm font-bold hover:bg-white/10 transition-colors backdrop-blur-md">{t.mojiEventi}</Link>
          </div>

          <Link href="/admin" className="w-full block group">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl flex items-center justify-between group-hover:border-[#e60023]/50 transition-all">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-[#e60023]/20 rounded-2xl flex items-center justify-center text-[#e60023]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{t.adminNaslov}</h3>
                  <p className="text-gray-500 text-xs text-left">{t.adminOpis}</p>
                </div>
              </div>
              <div className="text-gray-500 group-hover:text-white transition-colors">&rarr;</div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}