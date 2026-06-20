'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { kreirajReport, getTrenutniKorisnik } from '@/lib/api';

export default function ReportPage() {
  const [jezik, setJezik] = useState('BS');
  const [email, setEmail] = useState('');
  const [tip, setTip] = useState<'PROBLEM' | 'SUGESTIJA'>('PROBLEM');
  const [poruka, setPoruka] = useState('');
  const [greska, setGreska] = useState('');
  const [uspjeh, setUspjeh] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sacuvaniJezik = localStorage.getItem('izabraniJezik');
    if (sacuvaniJezik) setJezik(sacuvaniJezik);

    getTrenutniKorisnik()
      .then((korisnik) => setEmail(korisnik.email))
      .catch(() => {});
  }, []);

  const promijeniJezik = (noviJezik: string) => {
    setJezik(noviJezik);
    localStorage.setItem('izabraniJezik', noviJezik);
    window.dispatchEvent(new Event('storage'));
  };

  const prevodi = {
    BS: {
      nazad: "← Nazad na dashboard",
      oznaka: "Podrška korisnicima",
      naslov: "Prijavi problem ili pošalji sugestiju",
      email: "Email adresa",
      tip: "Tip poruke",
      problem: "Problem",
      sugestija: "Sugestija",
      poruka: "Opiši problem ili sugestiju...",
      dugme: "Pošalji prijavu",
      slanje: "Slanje...",
      uspjeh: "Vaša prijava je uspješno poslana.",
      greskaPolja: "Molimo popunite sva polja.",
      greskaPoruka: "Poruka mora imati najmanje 10 karaktera.",
      greskaServer: "Slanje nije uspjelo. Pokušajte ponovo.",
      kontaktNaslov: "Brza pomoć",
      kontaktOpis: "Za hitne slučajeve možete kontaktirati podršku:",
      kontaktEmail: "support@eventphoto.demo",
      kontaktTelefon: "+387 61 000 000"
    },
    EN: {
      nazad: "← Back to dashboard",
      oznaka: "User support",
      naslov: "Report a problem or send a suggestion",
      email: "Email address",
      tip: "Message type",
      problem: "Problem",
      sugestija: "Suggestion",
      poruka: "Describe the problem or suggestion...",
      dugme: "Send report",
      slanje: "Sending...",
      uspjeh: "Your report has been sent successfully.",
      greskaPolja: "Please fill in all fields.",
      greskaPoruka: "Message must contain at least 10 characters.",
      greskaServer: "Sending failed. Please try again.",
      kontaktNaslov: "Quick support",
      kontaktOpis: "For urgent issues, you can contact support:",
      kontaktEmail: "support@eventphoto.demo",
      kontaktTelefon: "+387 61 000 000"
    }
  };

  const t = jezik === 'BS' ? prevodi.BS : prevodi.EN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska('');
    setUspjeh('');

    if (!email || !tip || !poruka) {
      setGreska(t.greskaPolja);
      return;
    }

    if (poruka.trim().length < 10) {
      setGreska(t.greskaPoruka);
      return;
    }

    try {
      setLoading(true);

      await kreirajReport(email, tip, poruka.trim());

      setUspjeh(t.uspjeh);
      setPoruka('');
      setTip('PROBLEM');
    } catch {
      setGreska(t.greskaServer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans relative overflow-hidden px-6 py-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[520px] bg-gradient-to-b from-[#e60023]/20 to-transparent blur-[130px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <nav className="flex justify-between items-center mb-16">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
            {t.nazad}
          </Link>

          <button 
            type="button"
            onClick={() => promijeniJezik(jezik === 'BS' ? 'EN' : 'BS')}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider text-gray-400 hover:text-white transition-all"
          >
            {jezik === 'BS' ? '🇬🇧 EN' : '🇧🇦 BS'}
          </button>
        </nav>

        <main className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">
          <section className="pt-0.4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/20 text-xs text-gray-300 mb-12 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#e60023] animate-pulse"></span>
              {t.oznaka}
            </div>

            <h1 className="text-4xl md:text-4xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 leading-tight">
              {t.naslov}
            </h1>

           

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl max-w-xl">
              <h2 className="text-lg font-semibold text-white mb-2">{t.kontaktNaslov}</h2>
              <p className="text-sm text-gray-400 mb-5">{t.kontaktOpis}</p>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
                  <span className="text-gray-500">Email</span>
                  <span className="text-white font-medium">{t.kontaktEmail}</span>
                </div>

                <div className="flex items-center justify-between gap-4 bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
                  <span className="text-gray-500">Telefon</span>
                  <span className="text-white font-medium">{t.kontaktTelefon}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-[2rem] p-7 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.5)]">
            {greska && (
              <div className="mb-5 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-400">
                {greska}
              </div>
            )}

            {uspjeh && (
              <div className="mb-5 p-3 bg-green-500/15 border border-green-500/40 rounded-xl text-xs text-green-400">
                {uspjeh}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.tip}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTip('PROBLEM')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                      tip === 'PROBLEM'
                        ? 'bg-white text-black border-white'
                        : 'bg-black/40 text-gray-400 border-white/10 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {t.problem}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTip('SUGESTIJA')}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all ${
                      tip === 'SUGESTIJA'
                        ? 'bg-white text-black border-white'
                        : 'bg-black/40 text-gray-400 border-white/10 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {t.sugestija}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">{t.poruka}</label>
                <textarea
                  value={poruka}
                  onChange={(e) => setPoruka(e.target.value)}
                  rows={7}
                  placeholder={t.poruka}
                  className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:outline-none focus:border-gray-400 text-sm transition-all text-white placeholder:text-gray-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? t.slanje : t.dugme}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}