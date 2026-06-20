'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  deleteAdminUser,
  getAdminStats,
  getAdminUsers,
  getTrenutniKorisnik,
  toggleBlokirajKorisnika,
  getReporti,
  promijeniStatusReporta,
  deleteReport,
  ApiAdminStats,
  ApiKorisnik,
  ApiReport
} from '../../lib/api';

interface PrevodStranice {
  naslov: string;
  podnaslov: string;
  statKorisnici: string;
  statDogadji: string;
  statFotografije: string;
  statPrijave: string;
  tabelaKorisnici: string;
  tabelaPrijave: string;
  kolonaIme: string;
  kolonaEmail: string;
  kolonaUloga: string;
  kolonaAkcija: string;
  dugmeBlokiraj: string;
  dugmeDeblokiraj: string;
  dugmeObrisi: string;
  potvrdiBrisanje: string;
  znackaAktivan: string;
  znackaBlokiran: string;
  nazad: string;
  ucitavanje: string;
  nemaPrijava: string;
  tipProblem: string;
  tipSugestija: string;
  statusOtvoreno: string;
  statusRijeseno: string;
  rijesenoDatum: string;
  dugmeRijesi: string;
  dugmeOtvori: string;
  dugmeObrisiPrijavu: string;
  potvrdiBrisanjePrijave: string;
  prijavaOd: string;
  datumPrijave: string;
  [key: string]: string;
}

const PREVODI_PODACI: Record<string, PrevodStranice> = {
  BS: {
    naslov: "Admin Panel",
    podnaslov: "Pregled i upravljanje kompletnim sistemom.",
    statKorisnici: "Ukupno korisnika",
    statDogadji: "Ukupno događaja",
    statFotografije: "Ukupno fotografija",
    statPrijave: "Prijave korisnika",
    tabelaKorisnici: "Upravljanje korisnicima",
    tabelaPrijave: "Prijave problema i sugestije",
    kolonaIme: "Ime",
    kolonaEmail: "Email",
    kolonaUloga: "Uloga",
    kolonaAkcija: "Akcija",
    dugmeBlokiraj: "Blokiraj",
    dugmeDeblokiraj: "Deblokiraj",
    dugmeObrisi: "Obriši",
    potvrdiBrisanje: "Da li sigurno želiš trajno obrisati ovog korisnika i sve njegove podatke?",
    znackaAktivan: "AKTIVAN",
    znackaBlokiran: "BLOKIRAN",
    nazad: "← Nazad na Dashboard",
    ucitavanje: "Učitavanje admin podataka...",
    nemaPrijava: "Trenutno nema poslanih prijava.",
    tipProblem: "PROBLEM",
    tipSugestija: "SUGESTIJA",
    statusOtvoreno: "OTVORENO",
    statusRijeseno: "RIJEŠENO",
    rijesenoDatum: "Riješeno",
    dugmeRijesi: "Označi riješeno",
    dugmeOtvori: "Vrati u otvoreno",
    dugmeObrisiPrijavu: "Obriši prijavu",
    potvrdiBrisanjePrijave: "Da li sigurno želiš obrisati ovu prijavu?",
    prijavaOd: "Prijava od",
    datumPrijave: "Datum slanja",
    ERR_UNAUTHORIZED_ACTION: "Nemate ovlaštenje za pristup admin panelu.",
    ERR_CANNOT_BLOCK_SELF: "Ne možete blokirati sami sebe.",
    ERR_CANNOT_DELETE_SELF: "Ne možete obrisati sami sebe.",
    ERR_USER_NOT_FOUND: "Korisnik ne postoji na sistemu.",
    ERR_REPORT_NOT_FOUND: "Prijava ne postoji na sistemu."
  },
  EN: {
    naslov: "Admin Panel",
    podnaslov: "Overview and system-wide management.",
    statKorisnici: "Total Users",
    statDogadji: "Total Events",
    statFotografije: "Total Photos",
    statPrijave: "User Reports",
    tabelaKorisnici: "User Management",
    tabelaPrijave: "Problem reports and suggestions",
    kolonaIme: "Name",
    kolonaEmail: "Email",
    kolonaUloga: "Role",
    kolonaAkcija: "Action",
    dugmeBlokiraj: "Block",
    dugmeDeblokiraj: "Unblock",
    dugmeObrisi: "Delete",
    potvrdiBrisanje: "Are you sure you want to permanently delete this user and all their data?",
    znackaAktivan: "ACTIVE",
    znackaBlokiran: "BLOCKED",
    nazad: "← Back to Dashboard",
    ucitavanje: "Loading admin data...",
    nemaPrijava: "There are no submitted reports yet.",
    tipProblem: "PROBLEM",
    tipSugestija: "SUGGESTION",
    statusOtvoreno: "OPEN",
    statusRijeseno: "RESOLVED",
    rijesenoDatum: "Resolved",
    dugmeRijesi: "Mark resolved",
    dugmeOtvori: "Reopen",
    dugmeObrisiPrijavu: "Delete report",
    potvrdiBrisanjePrijave: "Are you sure you want to delete this report?",
    prijavaOd: "Report from",
    datumPrijave: "Submitted at",
    ERR_UNAUTHORIZED_ACTION: "You do not have authorization to access the admin panel.",
    ERR_CANNOT_BLOCK_SELF: "You cannot block yourself.",
    ERR_CANNOT_DELETE_SELF: "You cannot delete yourself.",
    ERR_USER_NOT_FOUND: "User does not exist on the system.",
    ERR_REPORT_NOT_FOUND: "Report does not exist on the system."
  }
};

export default function AdminDashboardPage() {
  const [jezik, setJezik] = useState(() => {
    if (typeof window === 'undefined') return 'BS';
    return localStorage.getItem('izabraniJezik') || 'BS';
  });
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [korisnici, setKorisnici] = useState<ApiKorisnik[]>([]);
  const [reporti, setReporti] = useState<ApiReport[]>([]);
  const [trenutniAdminId, setTrenutniAdminId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [greska, setGreska] = useState('');

  const t = PREVODI_PODACI[jezik] || PREVODI_PODACI.BS;

  const formatirajDatum = (datum: string) => {
    try {
      return new Date(datum).toLocaleString(jezik === 'BS' ? 'bs-BA' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return datum;
    }
  };

  const ucitajAdminPodatke = async (aktivniJezik = jezik) => {
    const aktivniPrevodi = PREVODI_PODACI[aktivniJezik] || PREVODI_PODACI.BS;

    try {
      setLoading(true);
      setGreska('');
      
      const [statsPodaci, korisniciPodaci, trenutniKorisnik, reportiPodaci] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getTrenutniKorisnik(),
        getReporti()
      ]);
      
      setStats(statsPodaci);
      setKorisnici(korisniciPodaci);
      setTrenutniAdminId(trenutniKorisnik.id);
      setReporti(reportiPodaci);
    } catch (err: unknown) {
      const kodGreske = err instanceof Error ? err.message : '';

      if (kodGreske && aktivniPrevodi[kodGreske]) {
        setGreska(aktivniPrevodi[kodGreske]);
      } else {
        setGreska(
          aktivniJezik === 'BS'
            ? 'Nemate ovlaštenje za pristup admin panelu.'
            : 'You do not have authorization to access the admin panel.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sacuvaniJezik = localStorage.getItem('izabraniJezik');
    const aktivniJezik = sacuvaniJezik || 'BS';

    void Promise.resolve().then(() => ucitajAdminPodatke(aktivniJezik));

    const provjeriJezik = () => {
      const trenutni = localStorage.getItem('izabraniJezik');
      if (trenutni) setJezik(trenutni);
    };

    window.addEventListener('storage', provjeriJezik);

    return () => {
      window.removeEventListener('storage', provjeriJezik);
    };
  }, []);

  const handleBlockToggle = async (korisnikId: number, trenutnoBlokiran: boolean) => {
    try {
      await toggleBlokirajKorisnika(korisnikId, !trenutnoBlokiran);
      const azuriraniKorisnici = await getAdminUsers();
      setKorisnici(azuriraniKorisnici);
    } catch (err: unknown) {
      const kodGreske = err instanceof Error ? err.message : '';

      if (kodGreske && t[kodGreske]) {
        alert(t[kodGreske]);
      } else {
        alert(jezik === 'BS' ? 'Greška pri promjeni statusa korisnika.' : 'Error changing user status.');
      }
    }
  };

  const handleDeleteUser = async (korisnikId: number) => {
    if (!window.confirm(t.potvrdiBrisanje)) return;

    try {
      setDeletingId(korisnikId);
      await deleteAdminUser(korisnikId);

      const [azuriraniStats, azuriraniKorisnici] = await Promise.all([
        getAdminStats(),
        getAdminUsers()
      ]);

      setStats(azuriraniStats);
      setKorisnici(azuriraniKorisnici);
    } catch (err: unknown) {
      const kodGreske = err instanceof Error ? err.message : '';

      if (kodGreske && t[kodGreske]) {
        alert(t[kodGreske]);
      } else {
        alert(kodGreske || (jezik === 'BS' ? 'Greška pri brisanju korisnika.' : 'Error deleting user.'));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleReportStatus = async (report: ApiReport) => {
    const noviStatus = report.status === 'RIJESENO' ? 'OTVORENO' : 'RIJESENO';

    try {
      setUpdatingReportId(report.id);
      const azuriraniReport = await promijeniStatusReporta(report.id, noviStatus);

      setReporti((trenutniReporti) =>
        trenutniReporti.map((trenutniReport) =>
          trenutniReport.id === azuriraniReport.id ? azuriraniReport : trenutniReport
        )
      );
    } catch (err: unknown) {
      const kodGreske = err instanceof Error ? err.message : '';
      alert((kodGreske && t[kodGreske]) || kodGreske || (jezik === 'BS' ? 'Greška pri promjeni statusa prijave.' : 'Error changing report status.'));
    } finally {
      setUpdatingReportId(null);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm(t.potvrdiBrisanjePrijave)) return;

    try {
      setDeletingReportId(reportId);
      await deleteReport(reportId);

      setReporti((trenutniReporti) => trenutniReporti.filter((report) => report.id !== reportId));
      setStats((trenutniStats) =>
        trenutniStats
          ? {
              ...trenutniStats,
              broj_prijava: Math.max(0, trenutniStats.broj_prijava - 1),
            }
          : trenutniStats
      );
    } catch (err: unknown) {
      const kodGreske = err instanceof Error ? err.message : '';
      alert((kodGreske && t[kodGreske]) || kodGreske || (jezik === 'BS' ? 'Greška pri brisanju prijave.' : 'Error deleting report.'));
    } finally {
      setDeletingReportId(null);
    }
  };

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
        <div className="mb-12 text-left">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            {t.naslov}
          </h1>
          <p className="text-gray-400 font-light text-sm">{t.podnaslov}</p>
        </div>

        {greska ? (
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-400 text-sm mb-6 text-center">
            {greska}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{t.statPrijave}</p>
                <p className="text-4xl font-mono font-bold text-[#e60023]">{stats?.broj_prijava ?? reporti.length}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl mb-10">
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
                    {korisnici.map((user: ApiKorisnik) => {
                      const isBlokiran = !!user.blokiran;
                      const isCurrentAdmin = trenutniAdminId === user.id;

                      return (
                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 font-medium text-white flex items-center gap-2">
                            {user.ime}
                            {isBlokiran ? (
                              <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-sans">
                                {t.znackaBlokiran}
                              </span>
                            ) : (
                              <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-sans">
                                {t.znackaAktivan}
                              </span>
                            )}
                          </td>

                          <td className="py-4 text-gray-400">{user.email}</td>
                          <td className="py-4 text-gray-400 font-mono text-xs">{user.uloga}</td>

                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={isCurrentAdmin}
                                onClick={() => handleBlockToggle(user.id, isBlokiran)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                  isBlokiran
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {isBlokiran ? t.dugmeDeblokiraj : t.dugmeBlokiraj}
                              </button>

                              <button
                                type="button"
                                disabled={isCurrentAdmin || deletingId === user.id}
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-950/40 text-red-300 border border-red-500/40 hover:bg-red-700 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {deletingId === user.id ? '...' : t.dugmeObrisi}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{t.tabelaPrijave}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {jezik === 'BS'
                      ? 'Ovdje admin vidi poruke koje korisnici pošalju preko Report stranice.'
                      : 'Here the admin can see messages submitted through the Report page.'}
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#e60023]/15 text-[#ff4d68] text-xs font-bold border border-[#e60023]/30">
                  {reporti.length}
                </span>
              </div>

              {reporti.length === 0 ? (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-6 text-center text-sm text-gray-500">
                  {t.nemaPrijava}
                </div>
              ) : (
                <div className="space-y-4">
                  {reporti.map((report) => (
                    <div
                      key={report.id}
                      className="bg-black/30 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t.prijavaOd}</p>
                          <p className="text-sm text-white font-medium">{report.email}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                              report.status === 'RIJESENO'
                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                            }`}
                          >
                            {report.status === 'RIJESENO' ? t.statusRijeseno : t.statusOtvoreno}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                              report.tip === 'PROBLEM'
                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                : 'bg-green-500/15 text-green-400 border-green-500/30'
                            }`}
                          >
                            {report.tip === 'PROBLEM' ? t.tipProblem : t.tipSugestija}
                          </span>

                          <span className="text-xs text-gray-500">
                            {t.datumPrijave}: {formatirajDatum(report.created_at)}
                          </span>

                          {report.rijeseno_at && (
                            <span className="text-xs text-gray-500">
                              {t.rijesenoDatum}: {formatirajDatum(report.rijeseno_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {report.poruka}
                      </p>

                      <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <button
                          type="button"
                          disabled={updatingReportId === report.id}
                          onClick={() => handleReportStatus(report)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            report.status === 'RIJESENO'
                              ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-600 hover:text-white'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          {updatingReportId === report.id
                            ? '...'
                            : report.status === 'RIJESENO'
                              ? t.dugmeOtvori
                              : t.dugmeRijesi}
                        </button>

                        <button
                          type="button"
                          disabled={deletingReportId === report.id}
                          onClick={() => handleDeleteReport(report.id)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-red-950/40 text-red-300 border border-red-500/40 hover:bg-red-700 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {deletingReportId === report.id ? '...' : t.dugmeObrisiPrijavu}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
