import { supabase } from './supabase';
import type { User, Session as SupabaseSession } from '@supabase/supabase-js';
import { logger, logAuditTrail } from './logger';

// On réexporte Session avec la même interface qu'avant
// pour ne pas casser les composants existants
export interface Session {
  userId: string;
  email: string;
  fullName: string;
}

function toSession(user: User): Session {
  return {
    userId: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string) ?? user.email ?? '',
  };
}

/** Vérifie la session Supabase active (appelé au démarrage) */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  
  // ✅ SÉCURITÉ : Vérifier l'expiration de la session (30 minutes d'inactivité)
  const lastActivity = localStorage.getItem('last_activity');
  if (lastActivity) {
    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes en millisecondes
    
    if (now - lastActivityTime > THIRTY_MINUTES) {
      // Session expirée après 30 minutes d'inactivité
      logger.info('Session expired after 30 minutes of inactivity');
      await supabase.auth.signOut();
      localStorage.removeItem('last_activity');
      return null;
    }
  }
  
  // Mettre à jour le timestamp de dernière activité
  localStorage.setItem('last_activity', Date.now().toString());
  
  return toSession(data.session.user);
}

/** Inscription */
export async function register(
  fullName: string,
  email: string,
  password: string
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
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      // ✅ LOGGING SÉCURISÉ - Ne pas logger les détails sensibles
      logger.warn('Registration failed', { code: error.code });
      
      // ✅ MESSAGES D'ERREUR UNIFORMES - Anti-énumération
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return { success: false, error: 'Identifiants incorrects ou compte déjà existant.' };
      }
      if (error.message.includes('Password should be')) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };
      }
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('too many')) {
        return { success: false, error: 'Trop de tentatives. Attendez quelques minutes avant de réessayer.' };
      }
      return { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' };
    }

    if (!data.user) {
      return { success: false, error: 'Une erreur est survenue lors de la création du compte.' };
    }

    // Supabase renvoie session === null quand la confirmation par email est activée
    if (!data.session) {
      logger.info('Registration successful - confirmation required', { email: data.user.email });
      return { success: true, session: null, needsConfirmation: true, email: data.user.email ?? email };
    }

    // ✅ AUDIT TRAIL
    await logAuditTrail({
      userId: data.user.id,
      action: 'USER_REGISTERED',
      resourceType: 'user',
      resourceId: data.user.id,
    });

    logger.info('Registration successful', { userId: data.user.id });
    return { success: true, session: toSession(data.user), needsConfirmation: false };
  } catch (e: any) {
    logger.error('Registration exception', { error: e?.message });
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.' };
    }
    return { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' };
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

/** Demander la réinitialisation du mot de passe */
export async function resetPassword(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/`,
      }
    );
    
    if (error) {
      logger.warn('Password reset request failed', { code: error.code });
      
      // ✅ MESSAGE UNIFORME - Anti-énumération (ne pas révéler si l'email existe)
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('too many')) {
        return { success: false, error: 'Trop de tentatives. Attendez quelques minutes avant de réessayer.' };
      }
      // On retourne succès même si l'email n'existe pas (sécurité)
      return { success: true };
    }
    
    // ✅ AUDIT TRAIL
    await logAuditTrail({
      userId: 'anonymous',
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'auth',
      details: { email: email.trim().toLowerCase() },
    });
    
    logger.info('Password reset email sent', { email: email.trim().toLowerCase() });
    return { success: true };
  } catch (e: any) {
    logger.error('Password reset exception', { error: e?.message });
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.' };
    }
    // En cas d'erreur, on retourne succès pour ne pas révéler si l'email existe
    return { success: true };
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
      // ✅ LOGGING SÉCURISÉ - Journaliser les tentatives échouées
      logger.warn('Login failed', { 
        email: email.trim().toLowerCase(),
        code: error.code,
      });
      
      // ✅ AUDIT TRAIL - Tentative de connexion échouée
      await logAuditTrail({
        userId: 'anonymous',
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        details: { email: email.trim().toLowerCase() },
      });
      
      // ✅ MESSAGES D'ERREUR UNIFORMES - Anti-énumération
      if (
        error.message.includes('Invalid login') ||
        error.message.includes('invalid_credentials') ||
        error.message.includes('Email not confirmed')
      ) {
        return { success: false, error: 'Identifiants incorrects ou compte inexistant.' };
      }
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('too many')) {
        return { success: false, error: 'Trop de tentatives. Attendez quelques minutes avant de réessayer.' };
      }
      return { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' };
    }

    if (!data.user) {
      return { success: false, error: 'Une erreur est survenue lors de la connexion.' };
    }

    // ✅ AUDIT TRAIL - Connexion réussie
    await logAuditTrail({
      userId: data.user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'auth',
      resourceId: data.user.id,
    });

    logger.info('Login successful', { userId: data.user.id });
    return { success: true, session: toSession(data.user) };
  } catch (e: any) {
    logger.error('Login exception', { error: e?.message });
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.' };
    }
    return { success: false, error: 'Une erreur est survenue. Veuillez réessayer.' };
  }
}

/** Déconnexion */
export async function logout(): Promise<void> {
  // ✅ Nettoyer le timestamp d'activité
  localStorage.removeItem('last_activity');
  await supabase.auth.signOut();
}

/** Écoute les changements de session (utile pour le refresh automatique) */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, supabaseSession) => {
    if (supabaseSession?.user) {
      callback(toSession(supabaseSession.user));
    } else {
      callback(null);
    }
  });
}
