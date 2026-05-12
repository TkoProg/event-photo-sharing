'use client';
import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  // Lažni podaci za testiranje Admin panela
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
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full">
            &larr; Nazad na Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Tabela Korisnika */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Korisnici
            </h2>
            <div className="space-y-4">
              {sviKorisnici.map(user => (
                <div key={user.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="font-medium">{user.ime}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-400">Obriši</button>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela Evenata */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-[#e60023] rounded-full mr-2"></span> Svi Događaji
            </h2>
            <div className="space-y-4">
              {sviEventi.map(event => (
                <div key={event.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="font-medium">{event.naziv}</p>
                    <p className="text-xs text-gray-500">Kod: {event.kod} | Autor: {event.autor}</p>
                  </div>
                  <button className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-400">Obriši</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistika na dnu */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center">
            <p className="text-gray-500 text-xs uppercase mb-1">Ukupno slika</p>
            <p className="text-2xl font-bold">1,204</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center">
            <p className="text-gray-500 text-xs uppercase mb-1">Aktivni eventi</p>
            <p className="text-2xl font-bold">42</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center">
            <p className="text-gray-500 text-xs uppercase mb-1">Novi korisnici</p>
            <p className="text-2xl font-bold">+12 danas</p>
          </div>
        </div>
      </div>
    </div>
  );
}