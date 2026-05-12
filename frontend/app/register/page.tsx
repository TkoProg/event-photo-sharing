'use client';
import React from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Pozadinski glow efekat */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e60023]/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[380px] p-10 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center">
        
        <div className="mb-8 text-2xl font-light tracking-tighter italic">
          Event<span className="font-semibold text-[#e60023]">Photo</span>
        </div>

        <p className="text-xs text-gray-400 mb-6 font-light">Kreirajte račun za organizaciju događaja.</p>

        <form className="space-y-4">
          <input 
            type="text" 
            placeholder="Ime i prezime"
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500"
          />
          <input 
            type="email" 
            placeholder="Email"
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500"
          />
          <input 
            type="password" 
            placeholder="Lozinka"
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500"
          />
          
          {/* Dugme sada vodi direktno na Dashboard nakon uspješne "registracije" */}
          <Link href="/dashboard" className="w-full block text-center bg-white text-black py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-transform mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Registruj se
          </Link>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-400">
            Već imaš račun? <Link href="/" className="text-white font-semibold hover:text-[#e60023] transition-colors">Prijavi se</Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}