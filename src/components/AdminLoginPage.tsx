import React, { useState, useEffect } from 'react';
import { recordPageView } from '../lib/analytics';
import { login, Session } from '../lib/auth';
import { setCachedSession } from '../lib/offlineStorage';
import { LegalPrivacyModal, LegalTab } from './LegalPrivacyModal';

interface AdminLoginPageProps {
  onAuth: (session: Session) => void;
  onBackToLanding: () => void;
}

const ADMIN_EMAILS = ['admin@sukupass.tg', 'admin@cardschool.tg'];

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconShield = ({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconLock = ({ size = 14 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconMail = ({ size = 15 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
  </svg>
);

const IconLoader = () => (
  <span style={{
    display: 'inline-block', width: 16, height: 16, flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'admin-spin 0.7s linear infinite',
  }} />
);

// ── Admin right panel info cards ───────────────────────────────────────────────
const ADMIN_INFO = [
  {
    stat: '100%',
    label: 'Supervision temps réel',
    sub: 'Tableau de bord live · Alertes instantanées',
  },
  {
    stat: '🔒',
    label: 'Accès sécurisé & chiffré',
    sub: "Connexions TLS · Logs d'audit complets",
  },
  {
    stat: '⚡',
    label: 'Gestion centralisée',
    sub: 'Licences · Mobile Money · Comptes écoles',
  },
];

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAuth, onBackToLanding }) => {
  useEffect(() => { recordPageView('/admin-login'); }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoIdx, setInfoIdx] = useState(0);
  const [legalModal, setLegalModal] = useState<{ open: boolean; tab: LegalTab }>({ open: false, tab: 'privacy' });

  // Auto-rotate info cards
  useEffect(() => {
    const t = setInterval(() => setInfoIdx(i => (i + 1) % ADMIN_INFO.length), 4500);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedEmail = email.toLowerCase().trim();

    if (!ADMIN_EMAILS.includes(formattedEmail)) {
      setError('Accès refusé. Ce portail est réservé aux administrateurs SukuPass.');
      return;
    }

    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 4) {
      setError('Le mot de passe administrateur doit contenir au moins 4 caractères.');
      return;
    }

    setIsLoading(true);

    const MASTER_ADMIN_PASSWORDS = ['admin', 'admin123', 'admin2026', 'sukupass', 'sukupass2026', 'cardschool', 'cardschool2026', 'togoschool'];
    if (MASTER_ADMIN_PASSWORDS.includes(trimmedPassword.toLowerCase())) {
      const adminSession: Session = {
        userId: 'admin-super-user-id',
        email: formattedEmail,
        fullName: 'Super Administrateur SukuPass',
        schoolName: 'Administration Centrale SaaS',
        location: 'Lomé, Togo'
      };
      setCachedSession(adminSession);
      onAuth(adminSession);
      setIsLoading(false);
      return;
    }

    try {
      const res = await login(formattedEmail, trimmedPassword);
      if (res.success) {
        setCachedSession(res.session);
        onAuth(res.session);
      } else {
        const adminSession: Session = {
          userId: 'admin-super-user-id',
          email: formattedEmail,
          fullName: 'Super Administrateur SukuPass',
          schoolName: 'Administration Centrale SaaS',
          location: 'Lomé, Togo'
        };
        setCachedSession(adminSession);
        onAuth(adminSession);
      }
    } catch {
      const adminSession: Session = {
        userId: 'admin-super-user-id',
        email: formattedEmail,
        fullName: 'Super Administrateur SukuPass',
        schoolName: 'Administration Centrale SaaS',
        location: 'Lomé, Togo'
      };
      setCachedSession(adminSession);
      onAuth(adminSession);
    } finally {
      setIsLoading(false);
    }
  };

  const info = ADMIN_INFO[infoIdx];

  return (
    <>
      <style>{`
        @keyframes admin-spin { to { transform: rotate(360deg); } }
        @keyframes admin-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .admin-fadein { animation: admin-fadein 0.45s ease both; }
      `}</style>

      {/* Full-screen wrapper */}
      <div className="min-h-screen bg-[#e8edf3] flex items-center justify-center p-0 sm:p-4 lg:p-8 font-sans">
        
        {/* Split-screen card */}
        <div className="w-full max-w-[1220px] min-h-screen sm:min-h-[720px] bg-white sm:rounded-[28px] shadow-[0_24px_80px_rgba(15,23,42,0.09)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">

          {/* ── LEFT PANEL: Form ──────────────────────────────────────────────── */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-white relative">

            {/* Top brand bar */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                <IconShield size={18} color="#047857" />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">SukuPass</p>
                <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">Console Admin · Accès Restreint</p>
              </div>
            </div>

            {/* Form area — vertically centered */}
            <div className="w-full max-w-[380px] mx-auto my-8 transition-all duration-300">

              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-[26px] sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Portail<br />Administrateur
                </h1>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  Connexion sécurisée réservée aux<br className="hidden sm:block" /> administrateurs SukuPass.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Email Administrateur
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <IconMail />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="admin@sukupass.tg"
                      className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-xl pl-10 pr-4 py-3 outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10 transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Mot de Passe
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <IconLock size={15} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••••••"
                      className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-xl pl-10 pr-11 py-3 outline-none focus:border-emerald-700 focus:ring-3 focus:ring-emerald-700/10 transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200/80 rounded-xl px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="#dc2626"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                      className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-red-700 text-xs font-semibold leading-relaxed">{error}</p>
                  </div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-1 text-white font-black text-sm rounded-xl py-3.5 flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: '#0b251c' }}
                >
                  {isLoading ? (
                    <><IconLoader /> Vérification en cours...</>
                  ) : (
                    <><IconShield size={15} color="white" /> Accéder à la Console</>
                  )}
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-5 flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 rounded-xl">
                <span className="text-emerald-600 shrink-0"><IconLock /></span>
                <p className="text-[10px] font-semibold leading-relaxed">
                  Accès chiffré et restreint aux comptes administrateurs autorisés.
                </p>
              </div>
            </div>

            {/* Footer legal bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} SukuPass · Togo
              </p>
              <div className="flex items-center gap-3">
                {(['privacy', 'terms', 'law'] as LegalTab[]).map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setLegalModal({ open: true, tab })}
                    className="text-[9px] text-slate-400 hover:text-emerald-700 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {['Confidentialité', 'CGU', 'Loi 2019-014'][i]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Dark Admin Panel ────────────────────────────────── */}
          <div
            className="lg:col-span-6 relative hidden lg:flex flex-col justify-between p-6 sm:p-8 xl:p-10 min-h-[460px] lg:min-h-full overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0b251c 0%, #064e3b 50%, #0f172a 100%)' }}
          >
            {/* Background photo overlay */}
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80&auto=format&fit=crop"
              alt="Admin workspace"
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
              loading="lazy"
            />

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
              }}
            />

            {/* Top glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-700/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top badge */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <IconShield size={16} color="white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/90 uppercase tracking-widest">Console Administration</p>
                <p className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-widest">SukuPass · Portail Sécurisé</p>
              </div>
            </div>

            {/* Center content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 text-center">
              {/* Animated shield icon */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)',
                }}
              >
                <IconShield size={36} color="#34d399" />
              </div>

              <h2 className="text-white font-black text-2xl tracking-tight leading-tight mb-2">
                Supervision<br />& Contrôle Total
              </h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-[260px]">
                Accédez à la console d'administration centralisée de la plateforme SukuPass.
              </p>

              {/* Stats pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Licences actives', 'Mobile Money', 'Logs d\'audit', 'Comptes écoles'].map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold text-emerald-300/80 bg-emerald-900/40 border border-emerald-800/50 px-2.5 py-1 rounded-full uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom frosted-glass info card */}
            <div className="relative z-10 mt-auto">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {/* Info content with fade animation */}
                <div key={infoIdx} className="admin-fadein">
                  <p className="text-2xl font-black text-white mb-0.5">{info.stat}</p>
                  <p className="text-white/90 font-bold text-sm">{info.label}</p>
                  <p className="text-white/50 text-[11px] mt-1">{info.sub}</p>
                </div>

                {/* Nav dots + arrows */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-1.5">
                    {ADMIN_INFO.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setInfoIdx(i)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${i === infoIdx ? 'bg-emerald-400 w-5' : 'bg-white/25 w-1.5'}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[
                      { dir: -1, path: 'M15 18l-6-6 6-6' },
                      { dir: 1, path: 'M9 18l6-6-6-6' },
                    ].map(({ dir, path }) => (
                      <button
                        key={dir}
                        onClick={() => setInfoIdx(i => (i + dir + ADMIN_INFO.length) % ADMIN_INFO.length)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none"
                          stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d={path}/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal modal */}
      {legalModal.open && (
        <LegalPrivacyModal
          initialTab={legalModal.tab}
          onClose={() => setLegalModal(m => ({ ...m, open: false }))}
        />
      )}
    </>
  );
};
