'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTrenutniKorisnik, logout } from '@/lib/api';

function FloatingNavItem({
  href,
  label,
  active = false,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`group flex h-12 w-14 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-14 sm:w-20 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7 ${
        active
          ? 'bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_30px_rgba(255,255,255,0.16)]'
          : 'hover:bg-white/10'
      }`}
    >
      <div
        className={`transition-all duration-300 ${
          active
            ? 'text-white scale-110'
            : 'text-gray-300 group-hover:text-white group-hover:scale-110'
        }`}
      >
        {children}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [jezik, setJezik] = useState('BS');
  const [uloga, setUloga] = useState<string | null>(null);

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

    return () => {
      window.removeEventListener('storage', provjeriJezik);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    getTrenutniKorisnik()
      .then((korisnik) => setUloga(korisnik.uloga))
      .catch(() => setUloga(null));
  }, []);

  const promijeniJezik = (noviJezik: string) => {
    setJezik(noviJezik);
    localStorage.setItem('izabraniJezik', noviJezik);
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      await logout();
    } catch {
      localStorage.removeItem('token');
    } finally {
      window.location.href = '/';
    }
  };

  const prevodi = {
    BS: {
      odjaviSe: "Odjavi se",
      badge: "Vaša privatna galerija uspomena",
      naslovPrviDio: "Uspomene koje",
      naslovDrugiDio: "ne blijede.",
      opis: "Tamo gdje se vaše fotografije pretvaraju u uspomene koje traju. Podijelite radost, emocije i uspomene sa svima koji su bili dio trenutka.",
      pregledSvihDogadjaja: "Pregled svih događaja",
      adminNaslov: "Admin Panel",
      adminOpis: "Upravljanje korisnicima i sistemom",
      pridruziSeNaslov: "Pridruži se događaju",
      pridruziSeOpis: "Unesi kod za goste i pristupi galeriji događaja.",
      pridruziSeDugme: "Unesi kod",
      navHome: "Početna",
      navFeed: "Feed",
      navProfil: "Moji događaji",
      navReport: "Prijavi problem ili pošalji sugestiju"
    },
    EN: {
      odjaviSe: "Log out",
      badge: "Your private gallery of memories",
      naslovPrviDio: "Memories that",
      naslovDrugiDio: "never fade.",
      opis: "Where your photos turn into memories that last. Share joy, emotions, and memories with everyone who was part of the moment.",
      pregledSvihDogadjaja: "All events overview",
      adminNaslov: "Admin Panel",
      adminOpis: "User and system management",
      pridruziSeNaslov: "Join an event",
      pridruziSeOpis: "Enter a guest code and access the event gallery.",
      pridruziSeDugme: "Enter code",
      navHome: "Home",
      navFeed: "Feed",
      navProfil: "My events",
      navReport: "Report a problem or send a suggestion"
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;
  const jeAdmin = uloga === 'ADMIN';
  const jeGost = uloga === 'GOST';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden relative flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[420px] sm:h-[560px] bg-gradient-to-b from-[#e60023]/20 to-transparent blur-[100px] sm:blur-[130px] pointer-events-none"></div>

      <nav className="relative z-10 flex justify-between items-center gap-3 px-4 py-4 sm:px-8 sm:py-6 max-w-7xl mx-auto w-full">
        <div className="text-lg sm:text-xl font-bold tracking-tighter">
          Flash<span className="text-[#e60023]">back</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            type="button"
            onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
          >
            {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
          </button>

          <button 
            type="button"
            onClick={handleLogout}
            className="px-2 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer font-sans sm:px-5 sm:text-sm"
          >
            {t.odjaviSe}
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-grow flex flex-col items-center pt-7 px-4 text-center max-w-5xl mx-auto sm:px-6 sm:pt-12 md:pt-16">
        <div className="inline-flex max-w-full items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300 mb-6 backdrop-blur-md sm:px-4 sm:text-xs sm:mb-10">
          <span className="w-2 h-2 rounded-full bg-[#e60023] animate-pulse"></span>
          {t.badge}
        </div>
        
        <h1 className="text-4xl leading-[1.05] sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-5 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
          {t.naslovPrviDio} <br /> {t.naslovDrugiDio}
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-10 sm:mb-16 md:mb-20 max-w-xl font-light leading-relaxed">
          {t.opis}
        </p>

        <div className="relative w-full max-w-4xl h-[250px] sm:h-[360px] md:h-[400px] mb-12 sm:mb-16 md:mb-20">
          <div className="absolute top-12 left-1/2 -translate-x-[95%] w-[8.5rem] h-[10.5rem] bg-gray-800 rounded-2xl rotate-[-12deg] overflow-hidden border border-white/10 shadow-2xl hover:rotate-0 hover:scale-105 transition-all duration-500 cursor-pointer hover:z-30 sm:top-10 sm:left-5 sm:translate-x-0 sm:w-64 sm:h-[16.5rem] sm:hover:scale-110">
            <img 
              src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600" 
              className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" 
              alt="Svadba" 
            />
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-60 bg-gray-800 rounded-2xl z-20 overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(230,0,35,0.15)] hover:scale-105 transition-all duration-500 cursor-pointer sm:w-80 sm:h-[22rem]">
            <img 
              src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800" 
              className="w-full h-full object-cover" 
              alt="Proslava" 
            />
          </div>

          <div className="absolute top-12 left-1/2 translate-x-[-5%] w-[8.5rem] h-[10.5rem] bg-gray-800 rounded-2xl rotate-[12deg] overflow-hidden border border-white/10 shadow-2xl hover:rotate-0 hover:scale-105 transition-all duration-500 cursor-pointer hover:z-30 sm:top-10 sm:left-auto sm:right-5 sm:translate-x-0 sm:w-64 sm:h-[16.5rem] sm:hover:scale-110">
            <img 
              src="https://images.unsplash.com/photo-1530103043960-ef38714abb15?q=80&w=600" 
              className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" 
              alt="Zabava" 
            />
          </div>
        </div>


        {jeGost && (
          <Link href="/join" className="w-full max-w-xl mb-10 sm:mb-14 group">
            <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-5 group-hover:border-[#e60023]/50 transition-all sm:p-6 sm:rounded-[2rem]">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left">
                <div className="w-11 h-11 bg-[#e60023]/20 rounded-2xl flex items-center justify-center text-[#e60023] shrink-0 sm:w-12 sm:h-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M7 8h10" />
                    <path d="M7 12h4" />
                    <path d="M13 16h4" />
                  </svg>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white sm:text-lg">{t.pridruziSeNaslov}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed sm:text-sm">{t.pridruziSeOpis}</p>
                </div>
              </div>

              <span className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#e60023] text-white text-sm font-bold group-hover:bg-[#c4001d] transition-colors">
                {t.pridruziSeDugme}
              </span>
            </div>
          </Link>
        )}


        <div className="flex flex-col items-center gap-10 w-full max-w-lg mx-auto z-20 pb-12 sm:gap-16 sm:pb-20">
          <div className="relative max-w-full">
            <div className="absolute -inset-4 rounded-full bg-[#e60023]/15 blur-3xl"></div>
            <div className="absolute -inset-2 rounded-full bg-white/10 blur-2xl"></div>

            <div className="relative flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-2 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_35px_rgba(255,255,255,0.08),0_0_70px_rgba(230,0,35,0.14),0_25px_70px_rgba(0,0,0,0.65)] sm:gap-4 sm:px-5 sm:py-2.5">
              <FloatingNavItem href="/dashboard" label={t.navHome} active>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="29" 
                  height="29" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M10.95 2.85a1.5 1.5 0 0 1 2.1 0l7.2 6.9a1.5 1.5 0 0 1 .45 1.08V19a2.5 2.5 0 0 1-2.5 2.5h-3.45a1.25 1.25 0 0 1-1.25-1.25V15.5a1.5 1.5 0 0 0-3 0v4.75a1.25 1.25 0 0 1-1.25 1.25H5.8A2.5 2.5 0 0 1 3.3 19v-8.17a1.5 1.5 0 0 1 .45-1.08l7.2-6.9Z" />
                </svg>
              </FloatingNavItem>

              <FloatingNavItem href="/feed" label={t.navFeed}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="28" 
                  height="28" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="6" height="6" rx="1.7" />
                  <rect x="14" y="4" width="6" height="6" rx="1.7" />
                  <rect x="4" y="14" width="6" height="6" rx="1.7" />
                  <rect x="14" y="14" width="6" height="6" rx="1.7" />
                </svg>
              </FloatingNavItem>

              <FloatingNavItem 
                href="/organizer/events" 
                label={jeAdmin ? t.pregledSvihDogadjaja : t.navProfil}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="30" 
                  height="30" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </FloatingNavItem>

              <FloatingNavItem href="/report" label={t.navReport}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="29" 
                  height="29" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  <path d="M12 7v5" />
                  <path d="M12 15h.01" />
                </svg>
              </FloatingNavItem>
            </div>
          </div>

          {jeAdmin && (
            <Link href="/admin" className="w-full block group">
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex items-center justify-between gap-4 group-hover:border-[#e60023]/50 transition-all sm:p-8 md:p-12 sm:rounded-[2rem]">
                <div className="flex items-center gap-3 text-left sm:gap-4">
                  <div className="w-11 h-11 bg-[#e60023]/20 rounded-2xl flex items-center justify-center text-[#e60023] shrink-0 sm:w-12 sm:h-12">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="34" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white sm:text-lg">{t.adminNaslov}</h3>
                    <p className="text-gray-500 text-xs text-left leading-relaxed">{t.adminOpis}</p>
                  </div>
                </div>

                <div className="text-gray-500 group-hover:text-white transition-colors">&rarr;</div>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
