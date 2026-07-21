import React, { useState } from 'react';
import { login, Session } from '../lib/auth';

interface AdminLoginPageProps {
  onAuth: (session: Session) => void;
  onBackToLanding: () => void;
}

const ADMIN_EMAIL = 'admin@cardschool.tg';

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAuth, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.toLowerCase().trim() !== ADMIN_EMAIL) {
      setError('Accès refusé. Ce portail est réservé aux administrateurs CardSchool.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await login(email.trim(), password);
      onAuth(session);
    } catch (err: any) {
      setError(err?.message || 'Identifiants invalides. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(to right, #10b981 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onBackToLanding}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="group-hover:-translate-x-0.5 transition-transform">
          <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
        </svg>
        Retour
      </button>

      {/* Login card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Header badge */}
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative w-16 h-16 bg-gray-900 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">Portail Administrateur</h1>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-[0.15em] mt-1">CardSchool SaaS — Accès Restreint</p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl"
          style={{ boxShadow: '0 0 80px rgba(16,185,129,0.05), 0 25px 50px rgba(0,0,0,0.5)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email field */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Email Administrateur
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@cardschool.tg"
                  className="w-full bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-600 text-sm font-medium rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-emerald-500/50 focus:bg-gray-800 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Mot de Passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••••••"
                  className="w-full bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-600 text-sm font-medium rounded-xl pl-11 pr-12 py-3.5 outline-none focus:border-emerald-500/50 focus:bg-gray-800 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/50 rounded-xl p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-red-400 text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl py-4 flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-lg shadow-emerald-900/40"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Accéder à la Console
                </>
              )}
            </button>

          </form>

          {/* Security notice */}
          <div className="mt-6 pt-6 border-t border-gray-800 flex items-center gap-2 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-[10px] font-semibold leading-relaxed">
              Accès chiffré et restreint aux comptes administrateurs autorisés.
              Toute tentative non autorisée est journalisée.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-[10px] text-gray-700 font-bold uppercase tracking-widest">
          CardSchool SaaS © {new Date().getFullYear()} — Système de Gestion de Cartes Scolaires Togo
        </p>
      </div>
    </div>
  );
};
