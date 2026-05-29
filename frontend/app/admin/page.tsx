'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAdminStats, getAdminUsers, toggleBlokirajKorisnika, ApiAdminStats, ApiKorisnik } from '../../lib/api';

export default function AdminDashboardPage() {
  const [jezik, setJezik] = useState('BS');
  
  // Stanja za podatke sa backenda
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [korisnici, setKorisnici] = useState<ApiKorisnik[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [greska, setGreska] = useState('');

  const ucitajAdminPodatke = async () => {
    try {
      setLoading(true);
      setGreska('');
      
      // Paralelno vučemo i statistiku i korisnike
      const [statsPodaci, korisniciPodaci] = await Promise.all([
        getAdminStats(),
        getAdminUsers()
      ]);
      
      setStats(statsPodaci);
      setKorisnici(korisniciPodaci);
    } catch (err: any) {
      setGreska(err.message || 'Nemate ovlaštenje za pristup admin panelu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sacuvaniJezik = localStorage.getItem('izabraniJezik');
    if (sacuvaniJezik) setJezik(sacuvaniJezik);

    const provjeriJezik = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };

    window.addEventListener('storage', provjeriJezik);
    
    ucitajAdminPodatke();

    return () => window.removeEventListener('storage', provjeriJezik);
  }, []);

  // Funkcija za blokiranje/deblokiranje klikom na dugme
  const handleBlockToggle = async (korisnikId: number, trenutnoBlokiran: boolean) => {
    try {
      // Šaljemo suprotno stanje od trenutnog
      await toggleBlokirajKorisnika(korisnikId, !trenutnoBlokiran);
      // Osvježavamo tabelu korisnika da povuče novo stanje
      const azuriraniKorisnici = await getAdminUsers();
      setKorisnici(azuriraniKorisnici);
    } catch (err: any) {
      alert(err.message || 'Greška pri promjeni statusa korisnika.');
    }
  };

  const prevodi = {
    BS: {
      naslov: "Admin Panel",
      podnaslov: "Pregled i upravljanje kompletnim sistemom.",
      statKorisnici: "Ukupno korisnika",
      statDogadji: "Ukupno događaja",
      statFotografije: "Ukupno fotografija",
      tabelaKorisnici: "Upravljanje korisnicima",
      kolonaIme: "Ime",
      kolonaEmail: "Email",
      kolonaUloga: "Uloga",
      kolonaAkcija: "Akcija",
      dugmeBlokiraj: "Blokiraj",
      dugmeDeblokiraj: "Deblokiraj",
      nazad: "← Nazad na Dashboard",
      ucitavanje: "Učitavanje admin podataka..."
    },
    EN: {
      naslov: "Admin Panel",
      podnaslov: "Overview and system-wide management.",
      statKorisnici: "Total Users",
      statDogadji: "Total Events",
      statFotografije: "Total Photos",
      tabelaKorisnici: "User Management",
      kolonaIme: "Name",
      kolonaEmail: "Email",
      kolonaUloga: "Role",
      kolonaAkcija: "Action",
      dugmeBlokiraj: "Block",
      dugmeDeblokiraj: "Unblock",
      nazad: "← Back to Dashboard",
      ucitavanje: "Loading admin data..."
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-sans animate-pulse">
        {t.ucitavanje}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans py-12 px-8 relative flex flex-col items-center overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[#e60023]/10 blur-[130px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Vrh stranice */}
        <div className="mb-12 text-left">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            {t.naslov}
          </h1>
          <p className="text-gray-400 font-light text-sm">{t.podnaslov}</p>
        </div>

        {greska ? (
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-400 text-sm mb-6">
            {greska}
          </div>
        ) : (
          <>
            {/* Statističke kartice */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{t.statKorisnici}</p>
                <p className="text-4xl font-mono font-bold text-white">{stats?.broj_korisnika || 0}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{t.statDogadji}</p>
                <p className="text-4xl font-mono font-bold text-[#e60023]">{stats?.broj_eventa || 0}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{t.statFotografije}</p>
                <p className="text-4xl font-mono font-bold text-white">{stats?.broj_fotografija || 0}</p>
              </div>
            </div>

            {/* Tabela korisnika */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-6 tracking-tight">{t.tabelaKorisnici}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm font-medium">
                      <th className="pb-4 font-normal">{t.kolonaIme}</th>
                      <th className="pb-4 font-normal">{t.kolonaEmail}</th>
                      <th className="pb-4 font-normal">{t.kolonaUloga}</th>
                      <th className="pb-4 text-right font-normal">{t.kolonaAkcija}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-light">
                    {korisnici.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-medium text-white flex items-center gap-2">
                          {user.ime}
                          {user.blokiran && (
                            <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-sans">
                              BLOKIRAN
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-gray-400">{user.email}</td>
                        <td className="py-4 text-gray-400 font-mono text-xs">{user.uloga}</td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleBlockToggle(user.id, user.blokiran)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                              user.blokiran
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            {user.blokiran ? t.dugmeDeblokiraj : t.dugmeBlokiraj}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors">
            {t.nazad}
          </Link>
        </div>
      </div>
    </div>
  );
}