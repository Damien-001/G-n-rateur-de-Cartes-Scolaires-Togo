import { cfFetch, setAuthToken, getAuthToken } from './cloudflareClient';
import { getCachedSession, setCachedSession, setStoredSchoolInfo, setStoredStudents } from './offlineStorage';
import { saveAdminLog, registerSchoolRecord, createPreassignedLicenseForSchool, AdminSchoolDetail, dbToSchoolInfo, dbToStudent } from './db';
import { DEFAULT_SCHOOL_INFO, SchoolInfo, computeDefaultTrialExpiresAt } from '../types';

export interface Session {
  userId: string;
  email: string;
  fullName: string;
  schoolName?: string;
  schoolType?: string;
  location?: string;
  phone?: string;
  isOfflineGuest?: boolean;
}

/** Vérifie la session active avec Cloudflare D1 et support hors-ligne */
export async function getSession(): Promise<Session | null> {
  const cached = getCachedSession();
  const token = getAuthToken();

  if (token) {
    try {
      const res = await cfFetch('/api/auth/me');
      if (res.success && res.session) {
        const activeSession: Session = {
          userId: res.session.userId,
          email: res.session.email,
          fullName: res.session.fullName,
          schoolName: res.session.schoolName,
          schoolType: res.session.schoolType,
          location: res.session.location,
          phone: res.session.phone,
        };
        setCachedSession(activeSession);
        return activeSession;
      }
    } catch (err) {
      console.log('⚡ Utilisation de la session en cache local (hors-ligne ou réseau lent)');
    }
  }

  return cached;
}

/** Inscription via Cloudflare D1 */
export async function register(
  fullName: string,
  email: string,
  password: string,
  schoolName: string,
  schoolType: string,
  location: string,
  phone: string
): Promise<
  | { success: true; session: Session; needsConfirmation: false }
  | { success: true; session: null; needsConfirmation: true; email: string }
  | { success: false; error: string }
> {
  try {
    const res = await cfFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        schoolName: schoolName.trim(),
        schoolType: schoolType.trim(),
        location: location.trim(),
        phone: phone.trim(),
      }),
    });

    if (!res.success) {
      return { success: false, error: res.error || 'Erreur lors de la création du compte.' };
    }

    if (res.token) {
      setAuthToken(res.token);
    }

    const newSession: Session = {
      userId: res.session.userId,
      email: res.session.email,
      fullName: res.session.fullName,
      schoolName: res.session.schoolName,
      schoolType: res.session.schoolType,
      location: res.session.location,
      phone: res.session.phone,
    };

    setCachedSession(newSession);

    const initialInfo: SchoolInfo = {
      ...DEFAULT_SCHOOL_INFO,
      name: schoolName.trim().toUpperCase(),
      schoolType: schoolType.trim() || 'Lycée',
      location: location.trim(),
      phone: phone.trim(),
      subscriptionPlan: 'free',
      trialExpiresAt: computeDefaultTrialExpiresAt(),
      region: 'Grand Lomé',
      customQuota: 15,
    };

    const schoolDetail: AdminSchoolDetail = {
      ...initialInfo,
      userId: newSession.userId,
      managerName: fullName.trim(),
      managerEmail: email.trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
      studentCount: 0,
    };

    // 1. Enregistrer en arrière-plan (0ms d'attente pour afficher le dashboard immédiatement)
    setStoredSchoolInfo(newSession.userId, initialInfo);
    registerSchoolRecord(schoolDetail).catch(() => {});

    // 2. Générer automatiquement une clé de licence pré-assignée en arrière-plan
    createPreassignedLicenseForSchool(
      newSession.userId,
      schoolName.trim().toUpperCase(),
      email.trim().toLowerCase(),
      phone.trim()
    ).catch(err => console.warn('Auto-generation preassigned license error:', err));

    // 3. Journaliser l'inscription en arrière-plan
    saveAdminLog(
      newSession.userId,
      'Nouvelle Inscription',
      `Établissement enregistré (${schoolType}) à ${location}`,
      schoolName
    ).catch(() => {});

    return { success: true, session: newSession, needsConfirmation: false };
  } catch (e: any) {
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur Cloudflare. Vérifiez votre connexion internet.' };
    }
    return { success: false, error: e?.message ?? 'Erreur inconnue.' };
  }
}

/** Renvoyer l'email de confirmation (Non nécessaire sur Cloudflare D1 : activation directe) */
export async function resendConfirmation(
  _email: string
): Promise<{ success: true } | { success: false; error: string }> {
  return { success: true };
}

/** Connexion via Cloudflare D1 */
export async function login(
  email: string,
  password: string
): Promise<{ success: true; session: Session } | { success: false; error: string }> {
  try {
    const res = await cfFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    if (!res.success) {
      return { success: false, error: res.error || 'Email ou mot de passe incorrect.' };
    }

    if (res.token) {
      setAuthToken(res.token);
    }

    const session: Session = {
      userId: res.session.userId,
      email: res.session.email,
      fullName: res.session.fullName,
      schoolName: res.session.schoolName,
      schoolType: res.session.schoolType,
      location: res.session.location,
      phone: res.session.phone,
    };

    setCachedSession(session);

    // Pré-hydrater immédiatement le cache local si le Worker a inclus schoolInfo & students dans la réponse de login
    try {
      if (res.schoolInfo) {
        const mappedSchool = dbToSchoolInfo(res.schoolInfo);
        setStoredSchoolInfo(session.userId, mappedSchool);
      }
      if (Array.isArray(res.students)) {
        const mappedStudents = res.students.map(dbToStudent);
        setStoredStudents(session.userId, mappedStudents);
      }
    } catch { }

    return { success: true, session };
  } catch (e: any) {
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.' };
    }
    return { success: false, error: e?.message ?? 'Erreur inconnue.' };
  }
}

/** Réinitialisation du mot de passe */
export async function resetPassword(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!email || !email.trim()) {
    return { success: false, error: 'Veuillez saisir votre adresse email.' };
  }
  return { success: true };
}

/** Connexion Google OAuth (Placeholder) */
export async function loginWithGoogle(): Promise<{ success: true } | { success: false; error: string }> {
  return { success: false, error: 'Connexion Google en cours de configuration sur Cloudflare.' };
}

/** Déconnexion */
export async function logout(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    cfFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }
  setAuthToken(null);
  setCachedSession(null);
}

/** Écoute les changements de session */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const cached = getCachedSession();
  callback(cached);
  return {
    data: {
      subscription: {
        unsubscribe: () => {},
      },
    },
  };
}
