'use client';
import React from 'react';
import Link from 'next/link';

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Pozadinski glow efekat */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e60023]/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[380px] p-10 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center">
        
        {/* Logo */}
        <div className="mb-10 text-3xl font-light tracking-tighter italic">
          Event<span className="font-semibold text-[#e60023]">Photo</span>
        </div>

        <h1 className="text-xl font-medium mb-2 tracking-tight text-white">Pridružite se</h1>
        <p className="text-xs text-gray-400 mb-8 font-light">Unesite jedinstveni kod događaja.</p>

        <form className="space-y-4">
          <input 
            type="text" 
            placeholder="Unesite kod"
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-white text-center text-lg tracking-[0.2em] transition-all text-white lowercase placeholder:tracking-normal placeholder:text-sm placeholder:text-gray-600"
          />
          <button className="w-full bg-[#e60023] text-white py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-transform mt-4 shadow-[0_0_20px_rgba(230,0,35,0.3)]">
            Pristupi galeriji
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          {/* OVDJE JE ISPRAVKA: Vraća na /dashboard */}
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
            &larr; Nazad
          </Link>
        </div>
        
      </div>
    </div>
  );
}