'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, login } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [jezik, setJezik] = useState('BS');
  
  const [ime, setIme] = useState('');
  const [email, setEmail] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [greska, setGreska] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska('');
    setLoading(true);

    if (!ime || !email || !lozinka) {
      setGreska(jezik === 'BS' ? 'Molimo popunite sva polja.' : 'Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      await register(ime, email, lozinka, 'ORGANIZATOR', jezik.toLowerCase());
      const authData = await login(email, lozinka);
      localStorage.setItem('token', authData.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      const kodGreske = err.message;
      if (t[kodGreske]) {
        setGreska(t[kodGreske]);
      } else {
        setGreska(jezik === 'BS' ? 'Registracija neuspješna.' : 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const prevodi: Record<string, Record<string, string>> = {
    BS: {
      podnaslov: "Kreirajte račun za organizaciju događaja.",
      placeholderIme: "Ime i prezime",
      placeholderEmail: "Email",
      placeholderLozinka: "Lozinka",
      dugme: "Registruj se",
      pitanje: "Veća imaš račun?",
      akcija: "Prijavi se",
      ucitavanje: "Registracija...",
      ERR_EMAIL_EXISTS: "Korisnik sa ovim emailom već postoji.",
      ERR_ADMIN_PUBLIC_REGISTER: "Admin nalog se ne može javno registrovati."
    },
    EN: {
      podnaslov: "Create an account to organize events.",
      placeholderIme: "Full name",
      placeholderEmail: "Email",
      placeholderLozinka: "Password",
      dugme: "Register",
      pitanje: "Already have an account?",
      akcija: "Sign in",
      ucitavanje: "Registering...",
      ERR_EMAIL_EXISTS: "A user with this email already exists.",
      ERR_ADMIN_PUBLIC_REGISTER: "Admin accounts cannot be registered publicly."
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e60023]/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[380px] p-10 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center">
        <div className="flex justify-end mb-2">
          <button 
            type="button"
            onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
          >
            {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
          </button>
        </div>

        <div className="mb-8 text-2xl font-light tracking-tighter italic">
          Event<span className="font-semibold text-[#e60023]">Photo</span>
        </div>

        <p className="text-xs text-gray-400 mb-6 font-light">{t.podnaslov}</p>

        {greska && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-400 text-left">
            {greska}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder={t.placeholderIme} 
            value={ime}
            onChange={(e) => setIme(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500" 
          />
          <input 
            type="email" 
            placeholder={t.placeholderEmail} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500" 
          />
          <input 
            type="password" 
            placeholder={t.placeholderLozinka} 
            value={lozinka}
            onChange={(e) => setLozinka(e.target.value)}
            className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500" 
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full block text-center bg-white text-black py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? t.ucitavanje : t.dugme}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-400">
            {t.pitanje} <Link href="/" className="text-white font-semibold hover:text-[#e60023] transition-colors">{t.akcija}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}