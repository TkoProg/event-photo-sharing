'use client';
import React from 'react';
import Link from 'next/link';

export default function EventsListPage() {
  // Ovo su lažni podaci samo da vidiš kako izgleda
  const mojiEventi = [
    { id: 1, naziv: "Svadba Amra & Dino", datum: "20.06.2026.", kod: "SARA2026" },
    { id: 2, naziv: "Rođendan", datum: "15.05.2026.", kod: "RODJ99" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center relative overflow-hidden font-sans py-12 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-[#e60023]/10 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Moji događaji</h1>
          <Link href="/organizer/events/new" className="bg-[#e60023] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#c4001d] transition-colors shadow-lg">
            + Novi događaj
          </Link>
        </div>

        <div className="grid gap-4">
  {mojiEventi.map((event) => (
    <Link 
      href={`/events/${event.id}`} // OVO POVEZUJE SA [id] FOLDEROM
      key={event.id} 
      className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl flex justify-between items-center hover:border-white/20 transition-all cursor-pointer"
    >
      <div>
        <h2 className="text-xl font-semibold">{event.naziv}</h2>
        <p className="text-sm text-gray-500">{event.datum}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Kod za goste</p>
        <p className="font-mono text-[#e60023] font-bold text-lg tracking-wider">{event.kod}</p>
      </div>
    </Link>
  ))}
</div>

        <div className="mt-12 text-center">
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors">
            &larr; Nazad na početak
          </Link>
        </div>
      </div>
    </div>
  );
}