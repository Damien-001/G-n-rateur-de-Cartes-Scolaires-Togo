import React, { useState, useEffect } from 'react';
import { login, register, resendConfirmation, Session } from '../lib/auth';

interface AuthPageProps {
  onAuth: (session: Session) => void;
}

type Mode = 'login' | 'register' | 'confirm';

// ── Icônes SVG inline ──────────────────────────────────────────────────────────
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
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);

// ── Formulaire de connexion ────────────────────────────────────────────────────
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
      if (!result.success) setError(result.error);
      else onAuth(result.session);
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

// ── Formulaire d'inscription ───────────────────────────────────────────────────
const RegisterForm: React.FC<{
  onAuth: (s: Session) => void;
  onNeedsConfirmation: (email: string) => void;
}> = ({ onAuth, onNeedsConfirmation }) => {
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
      if (!result.success) {
        setError(result.error);
      } else if (result.needsConfirmation) {
        onNeedsConfirmation(result.email);
      } else {
        onAuth(result.session);
      }
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

// ── Écran de confirmation email ────────────────────────────────────────────────
const ConfirmScreen: React.FC<{
  email: string;
  onBackToLogin: () => void;
}> = ({ email, onBackToLogin }) => {
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    setResendStatus('sending');
    setResendError('');
    const result = await resendConfirmation(email);
    if (result.success) {
      setResendStatus('sent');
      setCooldown(60);
      setTimeout(() => setResendStatus('idle'), 4000);
    } else {
      setResendStatus('error');
      setResendError(result.error);
    }
  };

  return (
    <div className="flex flex-col items-center text-center px-2 py-4">
      {/* Icône animée */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
          <div className="text-emerald-500">
            <IconMail />
          </div>
        </div>
        {/* Badge succès */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte créé avec succès ! 🎉</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-1">
        Un email de confirmation a été envoyé à
      </p>
      <p className="font-bold text-emerald-700 text-sm mb-5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
        {email}
      </p>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">
        Cliquez sur le lien dans l'email pour activer votre compte,<br />
        puis revenez vous connecter.
      </p>

      {/* Instructions */}
      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
        <p className="text-xs font-bold text-amber-800 uppercase mb-2">📋 Étapes à suivre</p>
        <ol className="space-y-1.5">
          {[
            'Ouvrez votre boîte email',
            'Recherchez un email de "Générateur de Cartes Scolaires"',
            'Cliquez sur le bouton de confirmation',
            'Revenez sur cette page et connectez-vous',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
              <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800 flex-shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Feedback renvoi */}
      {resendStatus === 'sent' && (
        <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Email renvoyé avec succès !
        </div>
      )}
      {resendStatus === 'error' && (
        <div className="w-full bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{resendError}</div>
      )}

      {/* Actions */}
      <div className="w-full space-y-3">
        <button
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <IconLogin />
          Aller à la connexion
        </button>
        <button
          onClick={handleResend}
          disabled={resendStatus === 'sending' || cooldown > 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-emerald-400 hover:text-emerald-600 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendStatus === 'sending' ? (
            <span style={{
              display: 'inline-block', width: 14, height: 14,
              border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#059669',
              borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite',
            }} />
          ) : (
            <IconRefresh />
          )}
          {cooldown > 0
            ? `Renvoyer dans ${cooldown}s`
            : resendStatus === 'sending'
            ? 'Envoi en cours...'
            : "Renvoyer l'email"}
        </button>
      </div>
    </div>
  );
};

// ── Page principale Auth ───────────────────────────────────────────────────────
export const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [confirmEmail, setConfirmEmail] = useState('');

  const handleNeedsConfirmation = (email: string) => {
    setConfirmEmail(email);
    setMode('confirm');
  };

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
            {/* Tabs — masqués sur l'écran de confirmation */}
            {mode !== 'confirm' && (
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
            )}

            <div className="p-8">
              {mode === 'confirm' ? (
                <ConfirmScreen
                  email={confirmEmail}
                  onBackToLogin={() => setMode('login')}
                />
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {mode === 'login' ? 'Bon retour 👋' : 'Créer votre compte'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    {mode === 'login'
                      ? 'Connectez-vous pour accéder à vos cartes scolaires.'
                      : 'Remplissez le formulaire pour commencer.'}
                  </p>
                  {mode === 'login'
                    ? <LoginForm key="login" onAuth={onAuth} />
                    : <RegisterForm key="register" onAuth={onAuth} onNeedsConfirmation={handleNeedsConfirmation} />
                  }
                </>
              )}
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
