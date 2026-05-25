'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
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
      nazad: "← Nazad na Dashboard",
      korisniciNaslov: "Korisnici",
      eventiNaslov: "Svi Događaji",
      obrisi: "Obriši",
      statSlika: "Ukupno slika",
      statEventi: "Aktivni eventi",
      statKorisnici: "Novi korisnici"
    },
    EN: {
      nazad: "← Back to Dashboard",
      korisniciNaslov: "Users",
      eventiNaslov: "All Events",
      obrisi: "Delete",
      statSlika: "Total photos",
      statEventi: "Active events",
      statKorisnici: "New users"
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  const sviKorisnici = [
    { id: 1, ime: "Amra Fazlić", email: "amra@mail.com", uloga: "Organizator" },
    { id: 2, ime: "Tarik H.", email: "tarik@mail.com", uloga: "Gost" },
  ];

  const sviEventi = [
    { id: 1, naziv: "Svadba Amra & Dino", kod: "SARA2026", autor: "Amra Fazlić" },
    { id: 2, naziv: "Maturantska zabava", kod: "MAT2026", autor: "Tarik H." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Admin <span className="text-[#e60023]">Panel</span></h1>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold tracking-wider text-gray-300 hover:text-white transition-all"
            >
              {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
            </button>
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full">
              {t.nazad}
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> {t.korisniciNaslov}</h2>
            <div className="space-y-4">
              {sviKorisnici.map(user => (
                <div key={user.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="font-medium">{user.ime}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-400">{t.obrisi}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center"><span className="w-2 h-2 bg-[#e60023] rounded-full mr-2"></span> {t.eventiNaslov}</h2>
            <div className="space-y-4">
              {sviEventi.map(event => (
                <div key={event.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="font-medium">{event.naziv}</p>
                    <p className="text-xs text-gray-500">Kod: {event.kod} | Autor: {event.autor}</p>
                  </div>
                  <button className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-400">{t.obrisi}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center">
            <p className="text-gray-500 text-xs uppercase mb-1">{t.statSlika}</p>
            <p className="text-2xl font-bold">1,204</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center">
            <p className="text-gray-500 text-xs uppercase mb-1">{t.statEventi}</p>
            <p className="text-2xl font-bold">42</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center">
            <p className="text-gray-500 text-xs uppercase mb-1">{t.statKorisnici}</p>
            <p className="text-2xl font-bold">{jezik === 'BS' ? '+12 danas' : '+12 today'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}