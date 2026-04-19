import React, { useState, useEffect } from 'react';
import { login, register, Session } from '../lib/auth';

interface AuthPageProps {
  onAuth: (session: Session) => void;
}

type Mode = 'login' | 'register';

// Toutes les icônes en SVG inline — évite les conflits avec extensions navigateur
const IconSchool = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IconLogin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);
const IconUserPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);
const IconLoader = () => (
  <span style={{
    display: 'inline-block', width: 16, height: 16, flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite',
  }} />
);
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
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
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

// Formulaire de connexion — composant isolé avec sa propre clé
const LoginForm: React.FC<{ onAuth: (s: Session) => void }> = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) onAuth(result.session);
      else setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Adresse email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="exemple@ecole.tg" required autoComplete="email"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mot de passe</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            autoComplete="current-password" data-lpignore="true" data-form-type="other"
            className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm" />
          <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
        {loading ? <><IconLoader /> Connexion...</> : <><IconLogin /> Se connecter</>}
      </button>
    </form>
  );
};

// Formulaire d'inscription — composant isolé avec sa propre clé
const RegisterForm: React.FC<{ onAuth: (s: Session) => void }> = ({ onAuth }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) { setError('Veuillez entrer votre nom complet.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      const result = await register(fullName, email, password);
      if (result.success) onAuth(result.session);
      else setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nom complet</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="Jean Dupont" required autoComplete="name"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Adresse email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="exemple@ecole.tg" required autoComplete="email"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mot de passe</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" required
            autoComplete="new-password" data-lpignore="true" data-form-type="other"
            className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm" />
          <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Confirmer le mot de passe</label>
        <div className="relative">
          <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required
            autoComplete="new-password" data-lpignore="true" data-form-type="other"
            className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm" />
          <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirm ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {confirmPassword && (
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
            <IconCheck />
            {password === confirmPassword ? 'Les mots de passe correspondent' : 'Ne correspondent pas'}
          </p>
        )}
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
        {loading ? <><IconLoader /> Création...</> : <><IconUserPlus /> Créer le compte</>}
      </button>
    </form>
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<Mode>('login');

  return (
    <>
      <style>{`@keyframes auth-spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-100 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-200 mb-4 text-white">
              <IconSchool />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Générateur de Cartes</h1>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">Scolaire • Togo</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button type="button" onClick={() => setMode('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
                  mode === 'login' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-400 hover:text-gray-600'
                }`}>
                <IconLogin /> Connexion
              </button>
              <button type="button" onClick={() => setMode('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
                  mode === 'register' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-400 hover:text-gray-600'
                }`}>
                <IconUserPlus /> Créer un compte
              </button>
            </div>

            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {mode === 'login' ? 'Bon retour 👋' : 'Créer votre compte'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {mode === 'login' ? 'Connectez-vous pour accéder à vos cartes scolaires.' : 'Remplissez le formulaire pour commencer.'}
              </p>

              {/* key= force un remount complet à chaque changement d'onglet
                  → le DOM est entièrement recréé, les extensions ne peuvent plus corrompre */}
              {mode === 'login'
                ? <LoginForm key="login" onAuth={onAuth} />
                : <RegisterForm key="register" onAuth={onAuth} />
              }
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Vos données sont sauvegardées dans le cloud Supabase.
          </p>
        </div>
      </div>
    </>
  );
};
