'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMojiEventi, getTrenutniKorisnik, ApiEvent } from '../../../lib/api'; // Uvozimo funkciju i tip

export default function EventsListPage() {
  const [jezik, setJezik] = useState('BS');
  const [uloga, setUloga] = useState<string | null>(null);
  
  
  const [eventi, setEventi] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [greska, setGreska] = useState('');
  const [kopiranKodEventa, setKopiranKodEventa] = useState<number | null>(null);

  useEffect(() => {
    // 1. Jezik provjera
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

    
    const ucitajEvente = async () => {
      try {
        setLoading(true);
        const [korisnik, podaci] = await Promise.all([
          getTrenutniKorisnik(),
          getMojiEventi(),
        ]);
        setUloga(korisnik.uloga);
        setEventi(podaci);
      } catch (err: unknown) {
        setGreska(err instanceof Error ? err.message : 'Greška pri učitavanju događaja.');
        setUloga(null);
      } finally {
        setLoading(false);
      }
    };

    ucitajEvente();

    return () => {
      window.removeEventListener('storage', provjeriJezik);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const promijeniJezik = (noviJezik: string) => {
    setJezik(noviJezik);
    localStorage.setItem('izabraniJezik', noviJezik);
    window.dispatchEvent(new Event('storage'));
  };

  const kopirajKod = async (eventId: number, kod: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(kod);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = kod;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setKopiranKodEventa(eventId);
      window.setTimeout(() => setKopiranKodEventa(null), 1600);
    } catch {
      setGreska(jezik === 'BS' ? 'Kod nije kopiran. Pokušaj ponovo.' : 'Code was not copied. Please try again.');
    }
  };

  const prevodi = {
    BS: {
      naslov: "Moji događaji",
      adminNaslov: "Pregled svih događaja",
      dugmeNovi: "+ Novi događaj",
      kodGosta: "Kod za goste",
      kopirajKod: "Kopiraj kod",
      kopirano: "Kopirano",
      nazad: "← Nazad na početak",
      ucitavanje: "Učitavanje događaja...",
      nemaEventa: "Nemate kreiranih događaja. Kreirajte svoj prvi klikom na dugme iznad!",
      nemaEventaBezKreiranja: "Nemate događaja za prikaz."
    },
    EN: {
      naslov: "My Events",
      adminNaslov: "All events overview",
      dugmeNovi: "+ New Event",
      kodGosta: "Guest code",
      kopirajKod: "Copy code",
      kopirano: "Copied",
      nazad: "← Back to home",
      ucitavanje: "Loading events...",
      nemaEventa: "No events created yet. Create your first event by clicking the button above!",
      nemaEventaBezKreiranja: "No events to display."
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;
  const mozeKreiratiEvent = uloga === 'ORGANIZATOR';
  const naslovStranice = uloga === 'ADMIN' ? t.adminNaslov : t.naslov;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center relative overflow-hidden font-sans py-12 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-[#e60023]/10 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight">{naslovStranice}</h1>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
            >
              {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
            </button>
            {mozeKreiratiEvent && (
              <Link href="/organizer/events/new" className="bg-[#e60023] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#c4001d] transition-colors shadow-lg">
                {t.dugmeNovi}
              </Link>
            )}
          </div>
        </div>

        {/* Prikaz greške ako backend zašteka */}
        {greska && (
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-sm text-red-400 mb-6">
            {greska}
          </div>
        )}

        
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-12 font-light animate-pulse">
            {t.ucitavanje}
          </div>
        ) : eventi.length === 0 ? (
          /* Prikaz poruke ako je baza prazna */
          <div className="text-center text-gray-500 text-sm py-12 font-light border border-dashed border-white/10 rounded-[2rem] bg-white/5 p-8">
            {mozeKreiratiEvent ? t.nemaEventa : t.nemaEventaBezKreiranja}
          </div>
        ) : (
         
          <div className="grid gap-4">
            {eventi.map((event) => (
              <div
                key={event.id}
                className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl flex justify-between items-center hover:border-white/20 transition-all group gap-4"
              >
                <Link href={`/events/${event.id}`} className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold group-hover:text-[#e60023] transition-colors">{event.naziv}</h2>
                  <p className="text-sm text-gray-500 font-light">
                    {new Date(event.datum).toLocaleDateString(jezik === 'BS' ? 'bs-BA' : 'en-US')} 
                    {event.lokacija && ` • ${event.lokacija}`}
                  </p>
                </Link>
                <div className="text-right flex items-center gap-3">
                  <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t.kodGosta}</p>
                  <p className="font-mono text-[#e60023] font-bold text-lg tracking-wider">{event.kod}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => kopirajKod(event.id, event.kod, e)}
                    aria-label={t.kopirajKod}
                    title={t.kopirajKod}
                    className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-gray-300 hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center shrink-0"
                  >
                    {kopiranKodEventa === event.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
            {t.nazad}
          </Link>
        </div>
      </div>
    </div>
  );
}
