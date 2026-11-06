import { supabase } from './supabase';
import type { User, Session as SupabaseSession } from '@supabase/supabase-js';
import { getCachedSession, setCachedSession, setStoredSchoolInfo } from './offlineStorage';
import { saveAdminLog, registerSchoolRecord, createPreassignedLicenseForSchool, AdminSchoolDetail } from './db';
import { DEFAULT_SCHOOL_INFO, DEFAULT_CARD_COLORS, SchoolInfo, computeDefaultTrialExpiresAt } from '../types';

// On réexporte Session avec la même interface qu'avant
// pour ne pas casser les composants existants
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

function toSession(user: User): Session {
  return {
    userId: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string) ?? user.email ?? '',
    schoolName: user.user_metadata?.school_name as string,
    schoolType: user.user_metadata?.school_type as string,
    location: user.user_metadata?.location as string,
    phone: user.user_metadata?.phone as string,
  };
}

/** Vérifie la session active avec support hors-ligne immédiat */
export async function getSession(): Promise<Session | null> {
  const cached = getCachedSession();
  
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const activeSession = toSession(data.session.user);
      setCachedSession(activeSession);
      return activeSession;
    }
  } catch (err) {
    console.log('⚠️ Récupération Supabase getSession échouée, utilisation du cache local');
  }

  // Fallback sur la session en cache si réseau indisponible
  return cached;
}

/** Inscription */
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { 
          full_name: fullName.trim(),
          school_name: schoolName.trim(),
          school_type: schoolType.trim(),
          location: location.trim(),
          phone: phone.trim()
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return { success: false, error: 'Un compte avec cet email existe déjà.' };
      }
      if (error.message.includes('Password should be')) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };
      }
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('too many')) {
        return { success: false, error: 'Trop de tentatives. Attendez quelques minutes avant de réessayer.' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Erreur lors de la création du compte.' };
    }

    const initialInfo: SchoolInfo = {
      ...DEFAULT_SCHOOL_INFO,
      name: schoolName.trim().toUpperCase(),
      schoolType: schoolType.trim() || 'Lycée',
      location: location.trim(),
      phone: phone.trim(),
      subscriptionPlan: 'free',
      trialExpiresAt: computeDefaultTrialExpiresAt(),
      region: 'Grand Lomé',
      customQuota: 15
    };

    const schoolDetail: AdminSchoolDetail = {
      ...initialInfo,
      userId: data.user.id,
      managerName: fullName.trim(),
      managerEmail: email.trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
      studentCount: 0
    };

    // 1. Enregistrer dans tous les canaux de persistance
    await registerSchoolRecord(schoolDetail);

    // 2. Générer automatiquement une clé de licence pré-assignée pour cette école
    await createPreassignedLicenseForSchool(
      data.user.id,
      schoolName.trim().toUpperCase(),
      email.trim().toLowerCase(),
      phone.trim()
    ).catch(err => console.warn('Auto-generation preassigned license error:', err));

    // 3. Journaliser l'inscription dans le registre d'audit
    await saveAdminLog(
      data.user.id,
      'Nouvelle Inscription',
      `Établissement enregistré (${schoolType}) à ${location}`,
      schoolName
    ).catch(() => {});

    // Supabase renvoie session === null quand la confirmation par email est activée
    if (!data.session) {
      return { success: true, session: null, needsConfirmation: true, email: data.user.email ?? email };
    }

    const newSession = toSession(data.user);
    setCachedSession(newSession);

    return { success: true, session: newSession, needsConfirmation: false };
  } catch (e: any) {
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.' };
    }
    return { success: false, error: e?.message ?? 'Erreur inconnue.' };
  }
}

/** Renvoyer l'email de confirmation */
export async function resendConfirmation(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erreur inconnue.' };
  }
}

/** Connexion */
export async function login(
  email: string,
  password: string
): Promise<{ success: true; session: Session } | { success: false; error: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (
        error.message.includes('Invalid login') ||
        error.message.includes('invalid_credentials') ||
        error.message.includes('Email not confirmed')
      ) {
        return { success: false, error: 'Email ou mot de passe incorrect.' };
      }
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('too many')) {
        return { success: false, error: 'Trop de tentatives. Attendez quelques minutes avant de réessayer.' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Erreur lors de la connexion.' };
    }

    const session = toSession(data.user);
    setCachedSession(session);
    return { success: true, session };
  } catch (e: any) {
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.' };
    }
    return { success: false, error: e?.message ?? 'Erreur inconnue.' };
  }
}

/** Réinitialisation du mot de passe par email */
export async function resetPassword(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: 'Veuillez saisir votre adresse email.' };
    }
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Impossible d\'envoyer l\'email de réinitialisation.' };
  }
}

/** Connexion / Inscription rapide via Google OAuth */
export async function loginWithGoogle(): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erreur lors de la connexion Google.' };
  }
}

/** Déconnexion */
export async function logout(): Promise<void> {
  setCachedSession(null);
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Erreur déconnexion supabase:', e);
  }
}

/** Écoute les changements de session */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, supabaseSession) => {
    if (supabaseSession?.user) {
      const s = toSession(supabaseSession.user);
      setCachedSession(s);
      callback(s);
    } else if (event === 'SIGNED_OUT') {
      const cached = getCachedSession();
      if (!cached?.isOfflineGuest && cached?.userId !== 'admin-super-user-id') {
        setCachedSession(null);
        callback(null);
      }
    } else {
      // Événements d'initialisation / rafraîchissement de page
      const cached = getCachedSession();
      if (cached) {
        callback(cached);
      } else {
        callback(null);
      }
    }
  });
}
