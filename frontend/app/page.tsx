'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, getAuthSession } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [jezik, setJezik] = useState('BS');
  const [email, setEmail] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [greska, setGreska] = useState('');
  const [loading, setLoading] = useState(false);
  const [provjeraPrijave, setProvjeraPrijave] = useState(true);

  useEffect(() => {
    const sacuvaniJezik = localStorage.getItem('izabraniJezik');
    let animationFrameId: number | null = null;

    if (sacuvaniJezik) {
      animationFrameId = window.requestAnimationFrame(() => setJezik(sacuvaniJezik));
    }

    return () => {
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    let aktivno = true;

    const provjeriDaLiJeVecPrijavljen = async () => {
      try {
        const sesija = await getAuthSession();

        if (aktivno && sesija.authenticated) {
          router.replace('/dashboard');
          return;
        }

        if (aktivno) {
          setProvjeraPrijave(false);
        }
      } catch {
        if (aktivno) {
          setProvjeraPrijave(false);
        }
      }
    };

    provjeriDaLiJeVecPrijavljen();

    return () => {
      aktivno = false;
    };
  }, [router]);

  const promijeniJezik = (noviJezik: string) => {
    setJezik(noviJezik);
    localStorage.setItem('izabraniJezik', noviJezik);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska('');
    setLoading(true);

    if (!email || !lozinka) {
      setGreska(jezik === 'BS' ? 'Molimo popunite sva polja.' : 'Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      await login(email, lozinka);

      localStorage.removeItem('token');

      router.replace('/dashboard');
    } catch (err: unknown) {
      const kodGreske = err instanceof Error ? err.message : '';

      if (kodGreske && t[kodGreske]) {
        setGreska(t[kodGreske]);
      } else {
        setGreska(jezik === 'BS' ? 'Prijava neuspješna.' : 'Sign in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const prevodi: Record<string, Record<string, string>> = {
    BS: {
      podnaslov: "Prijavite se na svoj račun.",
      placeholderEmail: "Email",
      placeholderLozinka: "Lozinka",
      dugme: "Prijavi se",
      pitanje: "Nemaš račun?",
      akcija: "Registruj se",
      ucitavanje: "Prijava...",
      provjera: "Učitavanje...",
      ERR_BAD_CREDENTIALS: "Pogrešan email ili lozinka.",
      ERR_USER_BLOCKED: "Vaš korisnički nalog je blokiran."
    },
    EN: {
      podnaslov: "Sign in to your account.",
      placeholderEmail: "Email",
      placeholderLozinka: "Password",
      dugme: "Sign In",
      pitanje: "Don't have an account?",
      akcija: "Register",
      ucitavanje: "Signing in...",
      provjera: "Loading...",
      ERR_BAD_CREDENTIALS: "Incorrect email or password.",
      ERR_USER_BLOCKED: "Your account has been blocked."
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  if (provjeraPrijave) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-sans">
        <p className="text-sm text-gray-400">{t.provjera}</p>
      </div>
    );
  }

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
          Flash<span className="font-semibold text-[#e60023]">back</span>
        </div>

        <p className="text-xs text-gray-400 mb-6 font-light">{t.podnaslov}</p>

        {greska && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-400 text-left">
            {greska}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full block text-center bg-white text-black py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:bg-gray-400"
          >
            {loading ? t.ucitavanje : t.dugme}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-400">
            {t.pitanje} <Link href="/register" className="text-white font-semibold hover:text-[#e60023] transition-colors">{t.akcija}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
