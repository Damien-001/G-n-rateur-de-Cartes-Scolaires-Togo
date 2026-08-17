import { Student, SchoolInfo } from '../types';
import { Session } from './auth';

export interface SyncAction {
  id: string;
  type: 'upsert_student' | 'delete_student' | 'save_school_info' | 'insert_students_bulk';
  payload: any;
  timestamp: number;
}

const STORAGE_KEYS = {
  STUDENTS_PREFIX: 'cartes_togo_students_',
  SCHOOL_PREFIX: 'cartes_togo_school_',
  SYNC_QUEUE_PREFIX: 'cartes_togo_sync_queue_',
  CACHED_SESSION: 'cartes_togo_cached_session',
  OFFLINE_MODE_FLAG: 'cartes_togo_offline_guest_mode',
};

// ─── Statut Réseau ──────────────────────────────────────────────────────────

export function isAppOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function subscribeToNetworkStatus(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ─── Session Locale ──────────────────────────────────────────────────────────

export function getCachedSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedSession(session: Session | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CACHED_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CACHED_SESSION);
    }
  } catch (e) {
    console.warn('Erreur setCachedSession:', e);
  }
}

// ─── Stockage Local Élèves ───────────────────────────────────────────────────

export function getStoredStudents(userId: string): Student[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.STUDENTS_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erreur lecture étudiants en local:', e);
    return [];
  }
}

export function setStoredStudents(userId: string, students: Student[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.STUDENTS_PREFIX}${userId}`, JSON.stringify(students));
  } catch (e) {
    console.error('Erreur sauvegarde étudiants en local:', e);
  }
}

// ─── Stockage Local Infos École ──────────────────────────────────────────────

export function getStoredSchoolInfo(userId: string): SchoolInfo | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SCHOOL_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erreur lecture infos école en local:', e);
    return null;
  }
}

export function setStoredSchoolInfo(userId: string, info: SchoolInfo): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.SCHOOL_PREFIX}${userId}`, JSON.stringify(info));
  } catch (e) {
    console.error('Erreur sauvegarde infos école en local:', e);
  }
}

// ─── File de Synchronisation Hors-Ligne ──────────────────────────────────────

export function getSyncQueue(userId: string): SyncAction[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SYNC_QUEUE_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function enqueueSyncAction(userId: string, action: Omit<SyncAction, 'id' | 'timestamp'>): void {
  try {
    const queue = getSyncQueue(userId);
    const item: SyncAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(item);
    localStorage.setItem(`${STORAGE_KEYS.SYNC_QUEUE_PREFIX}${userId}`, JSON.stringify(queue));
    console.log(`📥 Action mise en file d'attente hors-ligne: ${action.type}`);
  } catch (e) {
    console.error('Erreur ajout action dans file de sync:', e);
  }
}

export function clearSyncQueue(userId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.SYNC_QUEUE_PREFIX}${userId}`);
  } catch (e) {
    console.error('Erreur suppression file de sync:', e);
  }
}

export function removeSyncAction(userId: string, actionId: string): void {
  try {
    const queue = getSyncQueue(userId).filter(a => a.id !== actionId);
    localStorage.setItem(`${STORAGE_KEYS.SYNC_QUEUE_PREFIX}${userId}`, JSON.stringify(queue));
  } catch (e) {
    console.error('Erreur retrait action sync:', e);
  }
}
