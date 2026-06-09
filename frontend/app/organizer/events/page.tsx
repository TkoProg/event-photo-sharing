'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMojiEventi, getTrenutniKorisnik, ApiEvent } from '../../../lib/api'; // Uvozimo funkciju i tip

export default function EventsListPage() {
  const [jezik, setJezik] = useState('BS');
  const [uloga, setUloga] = useState<string | null>(null);
  
  // Stanja za podatke sa backenda
  const [eventi, setEventi] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [greska, setGreska] = useState('');

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

    // 2. Povlačenje stvarnih događaja sa backenda
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

  const prevodi = {
    BS: {
      naslov: "Moji događaji",
      adminNaslov: "Pregled svih događaja",
      dugmeNovi: "+ Novi događaj",
      kodGosta: "Kod za goste",
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

        {/* Prikaz Loading stanja dok se podaci skidaju */}
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
          /* ISPRAVNA PETLJA SA REALNIM PODACIMA */
          <div className="grid gap-4">
            {eventi.map((event) => (
              <Link 
                href={`/events/${event.id}`}
                key={event.id} 
                className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl flex justify-between items-center hover:border-white/20 transition-all cursor-pointer group"
              >
                <div>
                  <h2 className="text-xl font-semibold group-hover:text-[#e60023] transition-colors">{event.naziv}</h2>
                  <p className="text-sm text-gray-500 font-light">
                    {new Date(event.datum).toLocaleDateString(jezik === 'BS' ? 'bs-BA' : 'en-US')} 
                    {event.lokacija && ` • ${event.lokacija}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t.kodGosta}</p>
                  <p className="font-mono text-[#e60023] font-bold text-lg tracking-wider">{event.kod}</p>
                </div>
              </Link>
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
