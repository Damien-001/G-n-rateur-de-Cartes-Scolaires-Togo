import { supabase } from './supabase';
import type { User, Session as SupabaseSession } from '@supabase/supabase-js';

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

    // Supabase renvoie session === null quand la confirmation par email est activée
    if (!data.session) {
      return { success: true, session: null, needsConfirmation: true, email: data.user.email ?? email };
    }

    return { success: true, session: toSession(data.user), needsConfirmation: false };
  } catch (e: any) {
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet et les variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY dans le fichier .env, puis redémarrez le serveur de développement.' };
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

    return { success: true, session: toSession(data.user) };
  } catch (e: any) {
    if (e?.message?.includes('fetch') || e?.name === 'TypeError') {
      return { success: false, error: 'Impossible de contacter le serveur. Vérifiez votre connexion internet et les variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY dans le fichier .env, puis redémarrez le serveur de développement.' };
    }
    return { success: false, error: e?.message ?? 'Erreur inconnue.' };
  }
}

/** Déconnexion */
export async function logout(): Promise<void> {
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
