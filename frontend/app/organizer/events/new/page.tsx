'use client';
import React from 'react';
import Link from 'next/link';

export default function NewEventPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans py-20">
      
      {/* Pozadinski glow efekat */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e60023]/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Staklena kartica */}
      <div className="relative z-10 w-full max-w-[380px] p-10 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center">
        
        <div className="mb-8 text-2xl font-light tracking-tighter italic">
          Event<span className="font-semibold text-[#e60023]">Photo</span>
        </div>

        <h1 className="text-xl font-medium mb-2 tracking-tight text-white">Novi događaj</h1>
        <p className="text-xs text-gray-400 mb-6 font-light">Unesite detalje za novu galeriju.</p>

        <form className="space-y-4">
          <input 
            name="naziv" 
            type="text" 
            placeholder="npr. Vjenčanje Amra & Dino"
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500"
          />
          
          <input 
            name="datum"
            type="date" 
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white [color-scheme:dark]"
          />
          
          <input 
            name="lokacija"
            type="text" 
            placeholder="Lokacija (npr. Sarajevo)"
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500"
          />

          {/* Dodan opis jer ga Tamir traži u bazi (sekcija 10.2) */}
          <textarea 
            name="opis"
            placeholder="Kratki opis događaja..."
            rows={2}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500 resize-none"
          ></textarea>
          
          <button 
            type="button"
            className="w-full bg-white text-black py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-transform mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Kreiraj događaj
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <Link href="/organizer/events" className="text-xs text-gray-400 hover:text-white transition-colors">
            &larr; Odustani i vrati se nazad
          </Link>
        </div>
        
      </div>
    </div>
  );
}