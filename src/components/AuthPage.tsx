import React, { useState, useEffect } from 'react';
import { login, register, resendConfirmation, resetPassword, loginWithGoogle, Session } from '../lib/auth';
import { LegalPrivacyModal, LegalTab } from './LegalPrivacyModal';

interface AuthPageProps {
  onAuth: (session: Session) => void;
  onBackToHome?: () => void;
  initialMode?: 'login' | 'register';
}

type Mode = 'login' | 'register' | 'confirm' | 'forgot';

// ── Icônes SVG inline ──────────────────────────────────────────────────────────
const IconSchool = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
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
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);

const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

// ── Témoignages d'établissements scolaires togolais ───────────────────────────
interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  school: string;
  image: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    quote: "« Nous utilisons SukuPass à chaque rentrée scolaire pour éditer nos cartes en quelques clics. Nous ne pourrions plus imaginer travailler sans cet outil. »",
    author: "Mme Akossiwa Mensah",
    role: "Censeure & Responsable Pédagogique",
    school: "Complexe Scolaire La Référence • Lomé, Togo",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=82",
  },
  {
    quote: "« L'import Excel et le mode hors-ligne nous ont fait gagner deux semaines de travail au secrétariat. Les planches A4 Recto/Verso tombent au millimètre près. »",
    author: "M. Koffi Adanou",
    role: "Proviseur",
    school: "Lycée Moderne • Kpalimé, Région des Plateaux",
    image: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=1200&q=82",
  },
  {
    quote: "« Le QR Code anti-fraude et les couleurs nationales rassurent immédiatement les parents d'élèves lors des examens officiels. Un vrai standard professionnel. »",
    author: "M. Essohanam Tchakondo",
    role: "Directeur Administratif",
    school: "Groupe Scolaire Excellence • Kara, Togo",
    image: "https://images.unsplash.com/photo-1567057420215-0afa9aa9253a?auto=format&fit=crop&w=1200&q=82",
  },
];

// ── Formulaire de connexion ────────────────────────────────────────────────────
const LoginForm: React.FC<{
  onAuth: (s: Session) => void;
  onForgotPassword: (prefillEmail: string) => void;
  onSwitchToRegister: () => void;
}> = ({ onAuth, onForgotPassword, onSwitchToRegister }) => {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('sukupass_remember_email') || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      try {
        if (rememberMe) {
          localStorage.setItem('sukupass_remember_email', email.trim());
        } else {
          localStorage.removeItem('sukupass_remember_email');
        }
      } catch { }

      const result = await login(email, password);
      if ('error' in result) {
        setError(result.error);
      } else {
        onAuth(result.session);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success === false) {
        setError(res.error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Entrez votre adresse email"
          required
          autoComplete="email"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all bg-white"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </div>

      {/* Remember for 30 days & Forgot password row */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer accent-emerald-700"
          />
          <span>Se souvenir pendant 30 jours</span>
        </label>
        <button
          type="button"
          onClick={() => onForgotPassword(email)}
          className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          Mot de passe oublié ?
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0b251c] hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {loading ? <><IconLoader /> Connexion en cours...</> : 'Se connecter'}
        </button>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
        >
          <IconGoogle />
          <span>{googleLoading ? 'Redirection Google...' : 'Continuer avec Google'}</span>
        </button>
      </div>

      <div className="text-center pt-4">
        <span className="text-xs text-slate-500">Vous n'avez pas de compte ? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-xs font-extrabold text-emerald-800 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          Essai gratuit 14 jours
        </button>
      </div>
    </form>
  );
};

// ── Formulaire d'inscription ───────────────────────────────────────────────────
const RegisterForm: React.FC<{
  onAuth: (s: Session) => void;
  onNeedsConfirmation: (email: string) => void;
  onSwitchToLogin: () => void;
  onOpenLegal: (tab: LegalTab) => void;
}> = ({ onAuth, onNeedsConfirmation, onSwitchToLogin, onOpenLegal }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState('Lycée');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!schoolName.trim()) { setError("Veuillez entrer le nom de l'établissement."); return; }
    if (!location.trim()) { setError("Veuillez renseigner la ville / localité."); return; }
    if (!phone.trim()) { setError("Veuillez entrer un numéro de téléphone."); return; }
    if (!fullName.trim()) { setError('Veuillez entrer votre nom complet.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (!acceptedTerms) {
      setError("Veuillez accepter la Politique de Confidentialité et les Conditions d'Utilisation.");
      return;
    }
    setLoading(true);
    try {
      const result = await register(
        fullName,
        email,
        password,
        schoolName,
        schoolType,
        location,
        phone
      );
      if (result.success === false) {
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

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success === false) {
        setError(res.error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nom de l'établissement
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={e => setSchoolName(e.target.value)}
            placeholder="Ex: Lycée de Tokoin"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Type d'établissement
          </label>
          <select
            value={schoolType}
            onChange={e => setSchoolType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 bg-white cursor-pointer font-medium"
          >
            <option value="Lycée">Lycée (Second cycle)</option>
            <option value="Collège">Collège (Premier cycle)</option>
            <option value="Complexe Scolaire">Complexe Scolaire</option>
            <option value="Primaire">Primaire / Maternelle</option>
            <option value="Université / Institut">Université / Institut Sup.</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ville / Localité
          </label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Lomé, Togo"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Téléphone WhatsApp
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+228 90 12 34 56"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nom du Responsable
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="M. Koffi ADANOU"
            required
            autoComplete="name"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email de l'école
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="direction@ecole.tg"
            required
            autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 car."
              required
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confirmer
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showConfirm ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>
      </div>

      {confirmPassword && (
        <p className={`text-xs flex items-center gap-1 font-medium ${password === confirmPassword ? 'text-emerald-700' : 'text-red-500'}`}>
          <IconCheck />
          {password === confirmPassword ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
        </p>
      )}

      {/* Privacy & Terms Consent Checkbox */}
      <label className="flex items-start gap-2.5 text-xs text-slate-600 pt-0.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={e => setAcceptedTerms(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer accent-emerald-700 shrink-0"
        />
        <span className="leading-relaxed">
          J'accepte les{' '}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onOpenLegal('cgu'); }}
            className="font-bold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
          >
            Conditions d'Utilisation
          </button>{' '}
          et la{' '}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onOpenLegal('privacy'); }}
            className="font-bold text-slate-900 underline hover:text-emerald-700 cursor-pointer"
          >
            Politique de Confidentialité
          </button>.
        </span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-2.5 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0b251c] hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {loading ? <><IconLoader /> Création du compte...</> : "Démarrer l'essai gratuit 14 jours"}
        </button>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
        >
          <IconGoogle />
          <span>{googleLoading ? 'Redirection Google...' : "S'inscrire avec Google"}</span>
        </button>
      </div>

      <div className="text-center pt-2">
        <span className="text-xs text-slate-500">Vous avez déjà un compte ? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs font-extrabold text-emerald-800 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          Se connecter
        </button>
      </div>
    </form>
  );
};

// ── Formulaire Mot de passe oublié ──────────────────────────────────────────────
const ForgotPasswordForm: React.FC<{
  initialEmail: string;
  onBackToLogin: () => void;
}> = ({ initialEmail, onBackToLogin }) => {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const res = await resetPassword(email);
    if (res.success === false) {
      setStatus('error');
      setErrorMsg(res.error);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="space-y-4">
      {status === 'sent' ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 text-xs leading-relaxed">
          <p className="font-black text-sm text-emerald-900">📧 Lien de réinitialisation envoyé !</p>
          <p>
            Si un compte établissement est associé à <strong>{email}</strong>, vous recevrez un email contenant un lien sécurisé pour définir un nouveau mot de passe.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Adresse email de votre établissement
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="direction@ecole.tg"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/15 outline-none text-sm text-slate-900 bg-white"
            />
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0b251c] hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {status === 'loading' ? <><IconLoader /> Envoi en cours...</> : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          ← Retour à la connexion
        </button>
      </div>
    </div>
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
    if (result.success === false) {
      setResendStatus('error');
      setResendError(result.error);
    } else {
      setResendStatus('sent');
      setCooldown(60);
      setTimeout(() => setResendStatus('idle'), 4000);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="relative mb-5">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 text-emerald-700">
          <IconMail />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-white shadow">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5">Compte créé avec succès ! 🎉</h2>
      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-1">
        Un email de confirmation a été envoyé à
      </p>
      <p className="font-bold text-emerald-800 text-xs sm:text-sm mb-4 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/70">
        {email}
      </p>

      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-left">
        <p className="text-xs font-bold text-amber-800 uppercase mb-2">📋 Étapes à suivre</p>
        <ol className="space-y-1.5">
          {[
            'Ouvrez votre boîte email',
            'Recherchez un email de "SukuPass"',
            'Cliquez sur le bouton de confirmation',
            'Revenez sur cette page et connectez-vous',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
              <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center font-bold text-amber-900 shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {resendStatus === 'sent' && (
        <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl mb-3">
          Email renvoyé avec succès !
        </div>
      )}
      {resendStatus === 'error' && (
        <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-3">{resendError}</div>
      )}

      <div className="w-full space-y-2.5">
        <button
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0b251c] hover:bg-emerald-900 text-white font-bold text-sm cursor-pointer transition-all"
        >
          Aller à la connexion
        </button>
        <button
          onClick={handleResend}
          disabled={resendStatus === 'sending' || cooldown > 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all text-xs cursor-pointer disabled:opacity-50"
        >
          <IconRefresh />
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

// ── Page principale Auth (Split-Screen Editorial Design) ──────────────────────
export const AuthPage: React.FC<AuthPageProps> = ({ onAuth, onBackToHome, initialMode = 'login' }) => {
  const [mode, setMode] = useState<Mode>(initialMode === 'register' ? 'register' : 'login');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [forgotPrefillEmail, setForgotPrefillEmail] = useState('');
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [legalModal, setLegalModal] = useState<{ open: boolean; tab: LegalTab }>({
    open: false,
    tab: 'privacy',
  });

  const handleNeedsConfirmation = (email: string) => {
    setConfirmEmail(email);
    setMode('confirm');
  };

  const handlePrevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const handleNextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const currentTestimonial = TESTIMONIALS[testimonialIndex];

  return (
    <>
      <style>{`@keyframes auth-spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      <div className="min-h-screen bg-[#e8edf3] flex items-center justify-center p-0 sm:p-4 lg:p-8 font-sans">
        {/* Main Split-Screen Container */}
        <div className="w-full max-w-[1220px] min-h-screen sm:min-h-[720px] bg-white sm:rounded-[28px] shadow-[0_24px_80px_rgba(15,23,42,0.09)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
          
          {/* ── LEFT COLUMN: Clean White Authentication Form ── */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-white relative">
            {/* Top Bar: Brand Identity + Back to Home */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm shadow-emerald-950/15">
                  <IconSchool />
                </div>
                <div>
                  <span className="font-extrabold text-base text-slate-900 tracking-tight block leading-none">
                    SukuPass
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block mt-0.5">
                    Togo • UEMOA
                  </span>
                </div>
              </div>

              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  <span>← Retour à l'accueil</span>
                </button>
              )}
            </div>

            {/* Center Form Area */}
            <div className={`w-full mx-auto my-8 transition-all duration-300 ${mode === 'register' ? 'max-w-[440px]' : 'max-w-[380px]'}`}>
              {mode === 'confirm' ? (
                <ConfirmScreen
                  email={confirmEmail}
                  onBackToLogin={() => setMode('login')}
                />
              ) : mode === 'forgot' ? (
                <>
                  <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Mot de passe oublié
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                      Saisissez l'email de votre école pour recevoir un lien de réinitialisation.
                    </p>
                  </div>
                  <ForgotPasswordForm
                    initialEmail={forgotPrefillEmail}
                    onBackToLogin={() => setMode('login')}
                  />
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <h1 className="text-[26px] sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
                      {mode === 'login'
                        ? 'Bienvenue ! Veuillez saisir vos identifiants pour accéder à vos cartes.'
                        : 'Essai gratuit 14 jours (jusqu\'à 15 élèves) • Sans engagement.'}
                    </p>
                  </div>

                  {mode === 'login' ? (
                    <LoginForm
                      key="login"
                      onAuth={onAuth}
                      onForgotPassword={(prefill) => {
                        setForgotPrefillEmail(prefill);
                        setMode('forgot');
                      }}
                      onSwitchToRegister={() => setMode('register')}
                    />
                  ) : (
                    <RegisterForm
                      key="register"
                      onAuth={onAuth}
                      onNeedsConfirmation={handleNeedsConfirmation}
                      onSwitchToLogin={() => setMode('login')}
                      onOpenLegal={(tab) => setLegalModal({ open: true, tab })}
                    />
                  )}
                </>
              )}
            </div>

            {/* Bottom Legal & Privacy Links */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
              <span>© 2026 SukuPass Togo</span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLegalModal({ open: true, tab: 'privacy' })}
                  className="hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
                >
                  Politique de confidentialité
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setLegalModal({ open: true, tab: 'cgu' })}
                  className="hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
                >
                  CGU & Essai 14j
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setLegalModal({ open: true, tab: 'data_protection' })}
                  className="hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
                >
                  Loi 2019-014 (IPDCP)
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Editorial Portrait + Frosted Glass Testimonial Card ── */}
          <div className="lg:col-span-6 relative min-h-[460px] lg:min-h-full overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex flex-col justify-between p-6 sm:p-8 xl:p-10">
            {/* Background Editorial Photo */}
            <img
              src={currentTestimonial.image}
              alt={currentTestimonial.author}
              className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 scale-[1.01]"
            />

            {/* Warm & Emerald Editorial Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-emerald-950/25 to-slate-950/20 pointer-events-none" />

            {/* Top Badges on the Right Image */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-slate-900/45 border border-white/20 text-white text-[11px] font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>République Togolaise • Norme ISO CR80</span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-emerald-600/80 border border-emerald-300/30 text-white text-[11px] font-extrabold shadow-sm">
                <span>⏳ Essai Gratuit 14 Jours</span>
              </div>
            </div>

            {/* Frosted Glassmorphic Quote Overlay Card (Matches Reference Image) */}
            <div className="relative z-10 mt-auto backdrop-blur-xl bg-white/18 border border-white/30 rounded-2xl p-6 sm:p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <p className="text-base sm:text-xl font-bold leading-snug tracking-tight text-white drop-shadow-xs">
                {currentTestimonial.quote}
              </p>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                    {currentTestimonial.author}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-white/90 mt-1">
                    {currentTestimonial.role}
                  </p>
                  <p className="text-[11px] sm:text-xs font-medium text-white/75 mt-0.5">
                    {currentTestimonial.school}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  {/* 5 Stars */}
                  <div className="flex items-center gap-1 text-white text-sm tracking-widest" aria-label="5 étoiles sur 5">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>

                  {/* Prev / Next Circular Glass Arrows */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handlePrevTestimonial}
                      className="w-10 h-10 rounded-full border border-white/40 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      aria-label="Témoignage précédent"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTestimonial}
                      className="w-10 h-10 rounded-full border border-white/40 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      aria-label="Témoignage suivant"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Politique de Confidentialité, CGU, Loi 2019-014 & Mentions Légales */}
      <LegalPrivacyModal
        isOpen={legalModal.open}
        initialTab={legalModal.tab}
        onClose={() => setLegalModal((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};
