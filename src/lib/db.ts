import { supabase } from './supabase';
import { normalizeDateToInput } from './dateUtils';
import { Student, SchoolInfo, DEFAULT_SCHOOL_INFO, DEFAULT_CARD_COLORS, LicenseKey, ChatMessage, PlatformSettings, DEFAULT_PLATFORM_SETTINGS, LandingPricingPlan, computeDefaultTrialExpiresAt } from '../types';
import type { DbStudent, DbSchoolInfo } from './supabase';
import {
  getStoredStudents,
  setStoredStudents,
  getStoredSchoolInfo,
  setStoredSchoolInfo,
  getCachedSession,
  enqueueSyncAction,
  getSyncQueue,
  removeSyncAction,
  isAppOnline,
  isValidUuid
} from './offlineStorage';

export { isValidUuid };

// ─── Helpers de conversion ────────────────────────────────────────────────────

function dbToStudent(row: DbStudent): Student {
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    gender: (row as any).gender ?? '',
    matricule: row.matricule ?? '',
    className: row.class_name ?? '',
    schoolYear: row.school_year ?? '',
    birthDate: normalizeDateToInput(row.birth_date) || (row.birth_date ?? ''),
    birthPlace: row.birth_place ?? '',
    examCenter: row.exam_center ?? '',
    photoUrl: row.photo_url ?? '',
    expirationDate: normalizeDateToInput(row.expiration_date) || (row.expiration_date ?? ''),
  };
}

function studentToDb(student: Student, userId: string): Omit<DbStudent, 'created_at' | 'updated_at'> {
  return {
    id: student.id,
    user_id: userId,
    first_name: student.firstName || '',
    last_name: student.lastName || '',
    gender: student.gender || null,
    matricule: student.matricule || '',
    class_name: student.className || '',
    school_year: student.schoolYear || '',
    birth_date: normalizeDateToInput(student.birthDate) || student.birthDate || null,
    birth_place: student.birthPlace || null,
    exam_center: student.examCenter || null,
    photo_url: student.photoUrl || null,
    expiration_date: normalizeDateToInput(student.expirationDate) || student.expirationDate || null,
  };
}

function dbToSchoolInfo(row: DbSchoolInfo): SchoolInfo {
  const cardColors = row.card_colors ?? DEFAULT_CARD_COLORS;
  const fallbackBaseMs = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
  return {
    name: row.name,
    logoUrl: row.logo_url,
    signatureUrl: row.signature_url,
    stampUrl: row.stamp_url,
    cardColors: cardColors,
    schoolType: (row.card_colors as any)?.schoolType ?? 'Lycée',
    location: (row.card_colors as any)?.location ?? '',
    phone: (row.card_colors as any)?.phone ?? '',
    subscriptionPlan: (row.card_colors as any)?.subscriptionPlan ?? 'free',
    subscriptionExpiresAt: (row.card_colors as any)?.subscriptionExpiresAt ?? '',
    trialExpiresAt: (row.card_colors as any)?.trialExpiresAt || computeDefaultTrialExpiresAt(isNaN(fallbackBaseMs) ? Date.now() : fallbackBaseMs),
    region: (row.card_colors as any)?.region ?? 'Grand Lomé',
    customQuota: (row.card_colors as any)?.customQuota ?? 15,
  };
}

// ─── Students (Offline-First) ─────────────────────────────────────────────────

export async function fetchStudents(userId: string): Promise<Student[]> {
  const localStudents = getStoredStudents(userId).map(s => ({
    ...s,
    birthDate: normalizeDateToInput(s.birthDate) || s.birthDate,
    expirationDate: normalizeDateToInput(s.expirationDate) || s.expirationDate,
  }));

  // Si l'utilisateur est hors-ligne ou que l'ID n'est pas un UUID valide (ex: admin, invité démo),
  // renvoyer immédiatement les données du cache local sans requêter Supabase
  if (!isAppOnline() || !isValidUuid(userId)) {
    return localStudents;
  }

  try {
    const startTime = performance.now();

    // Timeout de 5 secondes pour basculer rapidement sur le cache local en cas de réseau lent/coupé
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout fetchStudents')), 5000)
    );

    const fetchPromise = supabase
      .from('students')
      .select('id, first_name, last_name, gender, matricule, class_name, school_year, birth_date, birth_place, exam_center, photo_url, expiration_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.warn('fetchStudents error (fallback local):', error.message);
      return localStudents;
    }

    const endTime = performance.now();
    console.log(`✅ Supabase: ${data?.length || 0} élèves chargés en ${(endTime - startTime).toFixed(0)}ms`);

    const serverStudents = (data as DbStudent[]).map(dbToStudent);

    // Sauvegarder dans le cache local pour consultation hors-ligne
    setStoredStudents(userId, serverStudents);
    return serverStudents;
  } catch (e: any) {
    console.log('⚡ Utilisation du cache local des élèves suite à une erreur réseau:', e.message);
    return localStudents;
  }
}

export async function upsertStudent(student: Student, userId: string): Promise<Student> {
  const localList = getStoredStudents(userId);
  let studentToSave = { ...student };

  // Générer un identifiant local si nouvel élève
  if (!studentToSave.id) {
    studentToSave.id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  // 1. Sauvegarde locale immédiate (Optimistic UI)
  const existingIdx = localList.findIndex(s => s.id === studentToSave.id);
  let updatedList: Student[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = studentToSave;
  } else {
    updatedList = [studentToSave, ...localList];
  }
  setStoredStudents(userId, updatedList);

  // Si userId n'est pas un UUID valide (ex: admin, invité démo), persister uniquement en local
  if (!isValidUuid(userId)) {
    return studentToSave;
  }

  // 2. Si hors-ligne, empiler dans la file de synchronisation
  if (!isAppOnline()) {
    enqueueSyncAction(userId, {
      type: 'upsert_student',
      payload: studentToSave
    });
    return studentToSave;
  }

  // 3. Envoi au serveur Supabase si en ligne
  try {
    const isNew = studentToSave.id.startsWith('local_');

    if (isNew) {
      const { data, error } = await supabase
        .from('students')
        .insert({
          user_id: userId,
          first_name: studentToSave.firstName,
          last_name: studentToSave.lastName,
          gender: studentToSave.gender || null,
          matricule: studentToSave.matricule,
          class_name: studentToSave.className,
          school_year: studentToSave.schoolYear,
          birth_date: studentToSave.birthDate || null,
          birth_place: studentToSave.birthPlace || null,
          exam_center: studentToSave.examCenter || null,
          photo_url: studentToSave.photoUrl || null,
          expiration_date: studentToSave.expirationDate || null,
        })
        .select()
        .single();

      if (error) throw error;
      const saved = dbToStudent(data as DbStudent);

      // Mettre à jour l'ID généré par Supabase en local
      const refreshedList = getStoredStudents(userId).map(s => s.id === studentToSave.id ? saved : s);
      setStoredStudents(userId, refreshedList);
      return saved;
    } else {
      const row = studentToDb(studentToSave, userId);
      const { data, error } = await supabase
        .from('students')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return dbToStudent(data as DbStudent);
    }
  } catch (error: any) {
    console.warn('⚠️ Échec sauvegarde en ligne (ajouté à la file de synchronisation):', error.message);
    enqueueSyncAction(userId, {
      type: 'upsert_student',
      payload: studentToSave
    });
    return studentToSave;
  }
}

/** Import en masse depuis CSV (avec support hors-ligne) */
export async function insertStudents(students: Student[], userId: string): Promise<Student[]> {
  const localList = getStoredStudents(userId);
  const preparedStudents = students.map(s => ({
    ...s,
    id: s.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    birthDate: normalizeDateToInput(s.birthDate) || s.birthDate,
    expirationDate: normalizeDateToInput(s.expirationDate) || s.expirationDate,
  }));

  // Sauvegarde locale immédiate
  const combined = [...preparedStudents, ...localList];
  setStoredStudents(userId, combined);

  // Si userId n'est pas un UUID valide, ne pas synchroniser avec Supabase
  if (!isValidUuid(userId)) {
    return preparedStudents;
  }

  if (!isAppOnline()) {
    enqueueSyncAction(userId, {
      type: 'insert_students_bulk',
      payload: preparedStudents
    });
    return preparedStudents;
  }

  try {
    const rows = preparedStudents.map(s => ({
      user_id: userId,
      first_name: s.firstName,
      last_name: s.lastName,
      gender: s.gender || null,
      matricule: s.matricule,
      class_name: s.className,
      school_year: s.schoolYear,
      birth_date: s.birthDate || null,
      birth_place: s.birthPlace || null,
      exam_center: s.examCenter || null,
      photo_url: s.photoUrl || null,
      expiration_date: s.expirationDate || null,
    }));

    const { data, error } = await supabase
      .from('students')
      .insert(rows)
      .select();

    if (error) throw error;
    const serverResult = (data as DbStudent[]).map(dbToStudent);

    // Rafraîchir le stockage local
    setStoredStudents(userId, [...serverResult, ...localList]);
    return serverResult;
  } catch (err: any) {
    console.warn('⚠️ Importation distante échouée, conservation en local & file de sync:', err.message);
    enqueueSyncAction(userId, {
      type: 'insert_students_bulk',
      payload: preparedStudents
    });
    return preparedStudents;
  }
}

export async function deleteStudent(id: string, userId?: string): Promise<void> {
  if (userId) {
    const local = getStoredStudents(userId).filter(s => s.id !== id);
    setStoredStudents(userId, local);
  }

  // Ne pas tenter d'appeler Supabase si pas d'ID, UUID invalide ou hors-ligne
  if (!userId || !isValidUuid(userId) || !isAppOnline()) {
    if (userId && isValidUuid(userId) && !isAppOnline()) {
      enqueueSyncAction(userId, {
        type: 'delete_student',
        payload: { id }
      });
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.warn('⚠️ Suppression distante échouée, mise en file:', error.message);
    if (userId && isValidUuid(userId)) {
      enqueueSyncAction(userId, {
        type: 'delete_student',
        payload: { id }
      });
    }
  }
}

export async function deleteStudents(ids: string[], userId?: string): Promise<void> {
  if (ids.length === 0) return;

  if (userId) {
    const local = getStoredStudents(userId).filter(s => !ids.includes(s.id));
    setStoredStudents(userId, local);
  }

  if (!userId || !isValidUuid(userId) || !isAppOnline()) {
    return;
  }

  if (!isAppOnline()) {
    if (userId) {
      for (const id of ids) {
        enqueueSyncAction(userId, {
          type: 'delete_student',
          payload: { id }
        });
      }
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .in('id', ids);

    if (error) throw error;
  } catch (err) {
    if (userId) {
      for (const id of ids) {
        enqueueSyncAction(userId, {
          type: 'delete_student',
          payload: { id }
        });
      }
    }
  }
}

// ─── School Info (Offline-First) ──────────────────────────────────────────────

export async function fetchSchoolInfo(userId: string): Promise<SchoolInfo | null> {
  const localSchool = getStoredSchoolInfo(userId);

  // Si l'utilisateur est hors-ligne ou que l'identifiant n'est pas un UUID valide (ex: admin, invité démo),
  // renvoyer immédiatement les données du cache local sans appeler Supabase
  if (!isAppOnline() || !isValidUuid(userId)) {
    return localSchool;
  }

  try {
    const startTime = performance.now();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout fetchSchoolInfo')), 4000)
    );

    const fetchPromise = supabase
      .from('school_info')
      .select('name, logo_url, signature_url, stamp_url, card_colors, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.warn('fetchSchoolInfo error (fallback local):', error.message);
      return localSchool;
    }

    const endTime = performance.now();
    console.log(`✅ Supabase: Infos école chargées en ${(endTime - startTime).toFixed(0)}ms`);

    if (!data) return localSchool;
    const schoolInfo = dbToSchoolInfo(data as DbSchoolInfo);
    if (!(data as any)?.card_colors?.trialExpiresAt && localSchool?.trialExpiresAt) {
      schoolInfo.trialExpiresAt = localSchool.trialExpiresAt;
    }
    setStoredSchoolInfo(userId, schoolInfo);
    return schoolInfo;
  } catch (e: any) {
    console.log('⚡ Utilisation du cache local des infos école suite à timeout/erreur:', e.message);
    return localSchool;
  }
}

export async function saveSchoolInfo(info: SchoolInfo, userId: string): Promise<void> {
  // Préserver le statut d'abonnement/quota le plus récent en cache local (évite qu'un debounce écrase une activation Admin)
  const latestLocal = getStoredSchoolInfo(userId);
  const mergedInfo: SchoolInfo = {
    ...info,
    subscriptionPlan: (latestLocal?.subscriptionPlan && latestLocal.subscriptionPlan !== info.subscriptionPlan && info.subscriptionPlan === 'free')
      ? latestLocal.subscriptionPlan
      : (info.subscriptionPlan ?? latestLocal?.subscriptionPlan ?? 'free'),
    subscriptionExpiresAt: info.subscriptionExpiresAt || latestLocal?.subscriptionExpiresAt || '',
    trialExpiresAt: info.trialExpiresAt || latestLocal?.trialExpiresAt || computeDefaultTrialExpiresAt(),
    customQuota: (latestLocal?.customQuota && latestLocal.customQuota !== 15 && (!info.customQuota || info.customQuota === 15))
      ? latestLocal.customQuota
      : (info.customQuota ?? latestLocal?.customQuota ?? 15),
  };

  // 1. Sauvegarde locale immédiate
  setStoredSchoolInfo(userId, mergedInfo);

  // Ne jamais tenter d'écrire dans Supabase si userId n'est pas un UUID valide (ex: admin, invité démo)
  if (!isValidUuid(userId)) {
    return;
  }

  if (!isAppOnline()) {
    enqueueSyncAction(userId, {
      type: 'save_school_info',
      payload: mergedInfo
    });
    return;
  }

  try {
    const row: DbSchoolInfo = {
      user_id: userId,
      name: mergedInfo.name,
      logo_url: mergedInfo.logoUrl || null,
      signature_url: mergedInfo.signatureUrl || null,
      stamp_url: mergedInfo.stampUrl || null,
      card_colors: {
        ...(mergedInfo.cardColors ?? DEFAULT_CARD_COLORS),
        schoolType: mergedInfo.schoolType,
        location: mergedInfo.location,
        phone: mergedInfo.phone,
        subscriptionPlan: mergedInfo.subscriptionPlan ?? 'free',
        subscriptionExpiresAt: mergedInfo.subscriptionExpiresAt ?? '',
        trialExpiresAt: mergedInfo.trialExpiresAt || computeDefaultTrialExpiresAt(),
        region: mergedInfo.region ?? 'Grand Lomé',
        customQuota: mergedInfo.customQuota ?? 15,
      } as any,
      updated_at: new Date().toISOString(),
    };

    // Sauvegarde résiliente : vérifie l'existence avant d'insérer ou mettre à jour
    let saveError: any = null;
    try {
      const { data: existing } = await supabase
        .from('school_info')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing?.id) {
        const { error: updErr } = await supabase
          .from('school_info')
          .update(row)
          .eq('user_id', userId);
        saveError = updErr;
      } else {
        const { error: insErr } = await supabase
          .from('school_info')
          .insert(row);
        if (insErr) {
          const { error: upErr } = await supabase
            .from('school_info')
            .upsert(row, { onConflict: 'user_id' });
          saveError = upErr;
        }
      }
    } catch (dbErr: any) {
      saveError = dbErr;
    }

    if (saveError) {
      console.warn('saveSchoolInfo error (queued for sync):', saveError.message || saveError);
      enqueueSyncAction(userId, {
        type: 'save_school_info',
        payload: info
      });
    }
  } catch (e: any) {
    console.warn('saveSchoolInfo fallback local sync:', e.message);
    enqueueSyncAction(userId, {
      type: 'save_school_info',
      payload: info
    });
  }
}

// ─── Storage (Photos, Logos, Signatures avec Support Hors-Ligne Base64) ────────

const BUCKET = 'school-assets';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(
  file: File,
  userId: string,
  folder: 'logos' | 'signatures' | 'photos'
): Promise<string> {
  // Si hors-ligne, conversion directe en DataURL base64 pour affichage et export PDF immédiat
  if (!isAppOnline()) {
    console.log('⚡ [Hors-ligne] Image stockée en Base64 locale');
    return await fileToDataUrl(file);
  }

  try {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      console.warn('Upload image échoué, fallback Base64 local:', error.message);
      return await fileToDataUrl(file);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn('Exception upload image, fallback Base64:', err);
    return await fileToDataUrl(file);
  }
}

export async function uploadPlatformAsset(
  file: File,
  folder: 'videos' | 'posters'
): Promise<string> {
  const rawExt = (file.name.split('.').pop() ?? (folder === 'videos' ? 'mp4' : 'jpg')).toLowerCase();
  const safeExt = rawExt.replace(/[^a-z0-9]/g, '') || (folder === 'videos' ? 'mp4' : 'jpg');
  const path = `platform/${folder}/demo-${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || (folder === 'videos' ? 'video/mp4' : 'image/jpeg')
    });

  if (error) {
    throw new Error(error.message || "Échec du téléversement sur le stockage cloud.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new File([array], filename, { type: mime });
}

// ─── Synchronisation Automatique de la file d'attente ──────────────────────────

export async function syncOfflineQueue(userId: string): Promise<{ synced: number; failed: number }> {
  if (!isAppOnline() || !userId || !isValidUuid(userId)) {
    return { synced: 0, failed: 0 };
  }

  const queue = getSyncQueue(userId);
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`🔄 Démarrage de la synchronisation de ${queue.length} action(s) hors-ligne...`);
  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      if (action.type === 'upsert_student') {
        const student: Student = action.payload;
        const isNew = student.id.startsWith('local_');

        if (isNew) {
          const { data, error } = await supabase
            .from('students')
            .insert({
              user_id: userId,
              first_name: student.firstName,
              last_name: student.lastName,
              gender: student.gender || null,
              matricule: student.matricule,
              class_name: student.className,
              school_year: student.schoolYear,
              birth_date: student.birthDate || null,
              birth_place: student.birthPlace || null,
              exam_center: student.examCenter || null,
              photo_url: student.photoUrl || null,
              expiration_date: student.expirationDate || null,
            })
            .select()
            .single();

          if (error) throw error;
          const serverSaved = dbToStudent(data as DbStudent);
          const current = getStoredStudents(userId).map(s => s.id === student.id ? serverSaved : s);
          setStoredStudents(userId, current);
        } else {
          const row = studentToDb(student, userId);
          const { error } = await supabase.from('students').upsert(row, { onConflict: 'id' });
          if (error) throw error;
        }
      } else if (action.type === 'delete_student') {
        if (!action.payload.id.startsWith('local_')) {
          const { error } = await supabase.from('students').delete().eq('id', action.payload.id);
          if (error) throw error;
        }
      } else if (action.type === 'save_school_info') {
        const info: SchoolInfo = action.payload;
        const row: DbSchoolInfo = {
          user_id: userId,
          name: info.name,
          logo_url: info.logoUrl || null,
          signature_url: info.signatureUrl || null,
          stamp_url: info.stampUrl || null,
          card_colors: {
            ...(info.cardColors ?? DEFAULT_CARD_COLORS),
            schoolType: info.schoolType,
            location: info.location,
            phone: info.phone,
            subscriptionPlan: info.subscriptionPlan ?? 'free',
            subscriptionExpiresAt: info.subscriptionExpiresAt ?? '',
            trialExpiresAt: info.trialExpiresAt || computeDefaultTrialExpiresAt(),
            region: info.region ?? 'Grand Lomé',
            customQuota: info.customQuota ?? 15,
          } as any,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('school_info').upsert(row, { onConflict: 'user_id' });
        if (error) throw error;
      } else if (action.type === 'insert_students_bulk') {
        const students: Student[] = action.payload;
        const rows = students.map(s => ({
          user_id: userId,
          first_name: s.firstName,
          last_name: s.lastName,
          gender: s.gender || null,
          matricule: s.matricule,
          class_name: s.className,
          school_year: s.schoolYear,
          birth_date: s.birthDate || null,
          birth_place: s.birthPlace || null,
          exam_center: s.examCenter || null,
          photo_url: s.photoUrl || null,
          expiration_date: s.expirationDate || null,
        }));
        const { error } = await supabase.from('students').insert(rows);
        if (error) throw error;
      }

      removeSyncAction(userId, action.id);
      synced++;
    } catch (err: any) {
      console.error(`❌ Échec synchro action ${action.id}:`, err);
      // Supprimer l'action si l'erreur est syntaxique/irrécupérable (ex: UUID invalide) pour stopper les boucles
      if (err?.message?.includes('invalid input syntax for type uuid') || err?.code === '22P02') {
        removeSyncAction(userId, action.id);
      }
      failed++;
    }
  }

  console.log(`✅ Synchronisation terminée : ${synced} réussi(s), ${failed} échec(s)`);
  return { synced, failed };
}

// ─── Admin SaaS Helpers ────────────────────────────────────────────────────────

export interface AdminSchoolDetail extends SchoolInfo {
  userId: string;
  updatedAt?: string;
  studentCount?: number;
  managerName?: string;
  managerEmail?: string;
}

// ─── Registre et Blacklist des Établissements ─────────────────────────────────

const DELETED_SCHOOLS_KEY = 'cardschool_deleted_schools';
const REGISTERED_SCHOOLS_KEY = 'cardschool_registered_schools';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch { }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeletedSchoolsBlacklist(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_SCHOOLS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch { }
  return new Set();
}

export function clearDeletedSchoolsBlacklist(): void {
  try {
    localStorage.removeItem(DELETED_SCHOOLS_KEY);
  } catch { }
}

export function removeDeletedSchoolBlacklist(userId: string): void {
  try {
    const list = getDeletedSchoolsBlacklist();
    if (list.has(userId)) {
      list.delete(userId);
      localStorage.setItem(DELETED_SCHOOLS_KEY, JSON.stringify(Array.from(list)));
    }
  } catch { }
}

export function addDeletedSchoolBlacklist(userId: string) {
  const list = getDeletedSchoolsBlacklist();
  list.add(userId);
  localStorage.setItem(DELETED_SCHOOLS_KEY, JSON.stringify(Array.from(list)));
}

export function getRegisteredSchoolsRegistry(): AdminSchoolDetail[] {
  try {
    const raw = localStorage.getItem(REGISTERED_SCHOOLS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.filter(s =>
          s && s.userId &&
          s.userId !== 'admin-super-user-id' &&
          s.userId !== PLATFORM_SETTINGS_SYSTEM_USER_ID &&
          s.managerEmail?.toLowerCase().trim() !== 'admin@cardschool.tg' && s.managerEmail?.toLowerCase().trim() !== 'admin@sukupass.tg' &&
          !s.name?.toUpperCase().includes('ADMINISTRATION CENTRALE') &&
          !s.name?.toUpperCase().includes('CONFIGURATION SYSTEME')
        );
      }
    }
  } catch { }
  return [];
}

export function saveRegisteredSchoolRegistry(school: AdminSchoolDetail) {
  if (
    !school ||
    !school.userId ||
    school.userId === 'admin-super-user-id' ||
    school.userId === 'local-offline-user' ||
    !isValidUuid(school.userId) ||
    school.userId === PLATFORM_SETTINGS_SYSTEM_USER_ID ||
    school.managerEmail?.toLowerCase().trim() === 'admin@cardschool.tg' || school.managerEmail?.toLowerCase().trim() === 'admin@sukupass.tg' ||
    school.name?.toUpperCase().includes('ADMINISTRATION CENTRALE') ||
    school.name?.toUpperCase().includes('CONFIGURATION SYSTEME')
  ) {
    return;
  }
  const list = getRegisteredSchoolsRegistry().filter(s => s.userId !== school.userId);
  list.unshift(school);
  localStorage.setItem(REGISTERED_SCHOOLS_KEY, JSON.stringify(list.slice(0, 200)));
}

/** Enregistre un établissement dans tous les canaux de persistance */
export async function registerSchoolRecord(school: AdminSchoolDetail): Promise<void> {
  if (
    !school ||
    !school.userId ||
    school.userId === 'admin-super-user-id' ||
    school.userId === 'local-offline-user' ||
    !isValidUuid(school.userId) ||
    school.userId === PLATFORM_SETTINGS_SYSTEM_USER_ID ||
    school.managerEmail?.toLowerCase().trim() === 'admin@cardschool.tg' || school.managerEmail?.toLowerCase().trim() === 'admin@sukupass.tg' ||
    school.name?.toUpperCase().includes('ADMINISTRATION CENTRALE') ||
    school.name?.toUpperCase().includes('CONFIGURATION SYSTEME')
  ) {
    if (school && school.userId) {
      setStoredSchoolInfo(school.userId, school);
    }
    return;
  }

  // 1. Enregistrer dans le stockage local individuel et le registre global
  setStoredSchoolInfo(school.userId, school);
  saveRegisteredSchoolRegistry(school);

  // 2. Synchroniser vers Supabase school_info
  try {
    const row: DbSchoolInfo = {
      user_id: school.userId,
      name: school.name,
      logo_url: school.logoUrl || null,
      signature_url: school.signatureUrl || null,
      stamp_url: school.stampUrl || null,
      card_colors: {
        ...(school.cardColors ?? DEFAULT_CARD_COLORS),
        schoolType: school.schoolType,
        location: school.location,
        phone: school.phone,
        subscriptionPlan: school.subscriptionPlan ?? 'free',
        subscriptionExpiresAt: school.subscriptionExpiresAt ?? '',
        trialExpiresAt: school.trialExpiresAt || computeDefaultTrialExpiresAt(),
        region: school.region ?? 'Grand Lomé',
        customQuota: school.customQuota ?? 15,
      } as any,
      updated_at: school.updatedAt || new Date().toISOString(),
    };

    // Sauvegarde ultra-robuste : vérifie d'abord si la ligne existe déjà
    const { data: existingRow } = await supabase
      .from('school_info')
      .select('id')
      .eq('user_id', school.userId)
      .maybeSingle();

    if (existingRow?.id) {
      const { error: updateErr } = await supabase
        .from('school_info')
        .update(row)
        .eq('user_id', school.userId);
      if (updateErr) {
        console.warn('registerSchoolRecord Supabase update error:', updateErr);
      }
    } else {
      const { error: insertErr } = await supabase
        .from('school_info')
        .insert(row);
      if (insertErr) {
        console.warn('registerSchoolRecord Supabase insert error, trying upsert:', insertErr);
        await supabase.from('school_info').upsert(row, { onConflict: 'user_id' });
      }
    }
  } catch (err) {
    console.warn('registerSchoolRecord Supabase persistence error:', err);
  }

  // 3. Émettre l'événement pour mise à jour immédiate des composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_school_registered', { detail: school }));
  }
}

/** Fetches all school info entries for SaaS administration (Live Supabase + Registre + LocalStorage sans réapparition des supprimés) */
export async function fetchAllSchools(): Promise<AdminSchoolDetail[]> {
  const schoolsMap = new Map<string, AdminSchoolDetail>();
  const deletedBlacklist = getDeletedSchoolsBlacklist();

  const isSystemId = (id?: string) =>
    !id ||
    id === 'admin-super-user-id' ||
    id === 'local-offline-user' ||
    !isValidUuid(id) ||
    id === PLATFORM_SETTINGS_SYSTEM_USER_ID ||
    id === LICENSE_KEYS_SYSTEM_USER_ID ||
    id.startsWith('00000000-0000-0000-0000-') ||
    id.toLowerCase().includes('system') ||
    id.toLowerCase().includes('admin_sys');

  // Pre-fetch all student counts in ONE query instead of N+1 queries
  const studentCountMap = new Map<string, number>();
  try {
    const { data: studentRows } = await supabase
      .from('students')
      .select('user_id');
    if (studentRows) {
      for (const row of studentRows) {
        if (row.user_id && !isSystemId(row.user_id)) {
          studentCountMap.set(row.user_id, (studentCountMap.get(row.user_id) || 0) + 1);
        }
      }
    }
  } catch { }

  // 1. Charger depuis Supabase school_info (Vrais comptes réels de la base active)
  try {
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('school_info')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!schoolsError && schoolsData) {
      for (const row of (schoolsData as DbSchoolInfo[])) {
        if (isSystemId(row.user_id)) continue;
        if (row.name && (row.name.startsWith('SYSTEM_') || row.name === 'SYSTEM_PLATFORM_SETTINGS' || row.name === 'SYSTEM_LICENSE_KEYS_REGISTRY')) continue;

        // Si l'école est bien vivante et présente dans la base active, la dé-blacklister au cas où elle y figurait
        if (deletedBlacklist.has(row.user_id)) {
          removeDeletedSchoolBlacklist(row.user_id);
          deletedBlacklist.delete(row.user_id);
        }

        const baseInfo = dbToSchoolInfo(row);
        const dbCount = studentCountMap.get(row.user_id) || 0;
        const localStudents = getStoredStudents(row.user_id);
        const studentCount = Math.max(dbCount, localStudents.length);

        schoolsMap.set(row.user_id, {
          ...baseInfo,
          userId: row.user_id,
          updatedAt: row.updated_at,
          studentCount
        });
      }
    }
  } catch (e: any) {
    console.warn('fetchAllSchools Supabase school_info error:', e.message);
  }

  // 2. Scanner le Registre persistant de l'application
  const registeredList = getRegisteredSchoolsRegistry();
  for (const reg of registeredList) {
    if (reg.userId && !isSystemId(reg.userId) && !deletedBlacklist.has(reg.userId)) {
      if (reg.name && reg.name.startsWith('SYSTEM_')) continue;

      if (!schoolsMap.has(reg.userId)) {
        schoolsMap.set(reg.userId, reg);
      } else {
        const existing = schoolsMap.get(reg.userId)!;
        if (reg.managerName && !existing.managerName) existing.managerName = reg.managerName;
        if (reg.managerEmail && !existing.managerEmail) existing.managerEmail = reg.managerEmail;
        if (reg.phone && !existing.phone) existing.phone = reg.phone;
        if (reg.location && !existing.location) existing.location = reg.location;
        if (reg.name && existing.name === DEFAULT_SCHOOL_INFO.name) existing.name = reg.name;
      }
    }
  }

  // 3. Scanner LocalStorage pour retrouver toutes les écoles enregistrées
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Clés cartes_togo_school_*
      if (key.startsWith('cartes_togo_school_')) {
        const userId = key.replace('cartes_togo_school_', '');
        if (userId && !isSystemId(userId) && !deletedBlacklist.has(userId)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const localSchoolInfo = JSON.parse(raw);
              if (localSchoolInfo.name && localSchoolInfo.name.startsWith('SYSTEM_')) continue;

              const localStudents = getStoredStudents(userId);
              if (!schoolsMap.has(userId)) {
                schoolsMap.set(userId, {
                  ...DEFAULT_SCHOOL_INFO,
                  ...localSchoolInfo,
                  userId,
                  updatedAt: new Date().toISOString(),
                  studentCount: localStudents.length
                });
              } else {
                const existing = schoolsMap.get(userId)!;
                if (localStudents.length > (existing.studentCount || 0)) {
                  existing.studentCount = localStudents.length;
                }
                if (localSchoolInfo.name && existing.name === DEFAULT_SCHOOL_INFO.name) {
                  existing.name = localSchoolInfo.name;
                }
              }
            } catch { }
          }
        }
      }

      // Clés Supabase Auth Tokens (sb-*-auth-token)
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const user = parsed?.user || parsed?.currentSession?.user;
            if (user && user.id && !isSystemId(user.id) && !deletedBlacklist.has(user.id)) {
              const userId = user.id;
              const userEmail = user.email || '';
              const userFullName = user.user_metadata?.full_name || '';
              const rawSchoolName = user.user_metadata?.school_name || '';
              const schoolName = rawSchoolName || (userFullName ? userFullName.toUpperCase() : userEmail);
              const schoolType = user.user_metadata?.school_type || 'Lycée';
              const location = user.user_metadata?.location || user.user_metadata?.ville || '';
              const phone = user.user_metadata?.phone || '';
              const localStudents = getStoredStudents(userId);

              if (!schoolsMap.has(userId)) {
                schoolsMap.set(userId, {
                  ...DEFAULT_SCHOOL_INFO,
                  name: schoolName,
                  schoolType,
                  location,
                  phone,
                  subscriptionPlan: 'free',
                  userId,
                  managerName: userFullName,
                  managerEmail: userEmail,
                  updatedAt: user.updated_at || user.created_at || new Date().toISOString(),
                  studentCount: localStudents.length
                });
              } else {
                const existing = schoolsMap.get(userId)!;
                existing.managerName = userFullName || existing.managerName;
                existing.managerEmail = userEmail || existing.managerEmail;
                if (!existing.phone && phone) existing.phone = phone;
                if (!existing.location && location) existing.location = location;
                if (existing.name === DEFAULT_SCHOOL_INFO.name && schoolName) {
                  existing.name = schoolName;
                }
              }
            }
          }
        } catch { }
      }
    }
  } catch (err) {
    console.warn('fetchAllSchools localStorage scan error:', err);
  }

  // 4. Synchroniser le statut d'abonnement avec l'état réel des clés de licence
  try {
    const localKeys = getLocalLicenseKeys();
    for (const school of schoolsMap.values()) {
      const matchKey = localKeys.find(k =>
        (k.targetSchoolId && k.targetSchoolId === school.userId) ||
        (k.usedBySchoolId && k.usedBySchoolId === school.userId) ||
        (k.targetSchoolName && k.targetSchoolName.toUpperCase() === (school.name || '').toUpperCase())
      );
      if (matchKey) {
        if (matchKey.isSuspended) {
          school.subscriptionPlan = 'suspended';
        } else if (matchKey.isUsed && school.subscriptionPlan !== 'suspended') {
          school.subscriptionPlan = 'pro';
        } else if (!matchKey.isUsed && school.subscriptionPlan !== 'pro' && school.subscriptionPlan !== 'suspended') {
          school.subscriptionPlan = 'free';
        }
      }
    }
  } catch { }

  const validSchools = Array.from(schoolsMap.values()).filter(school => {
    if (!school || !school.userId) return false;
    if (school.userId === PLATFORM_SETTINGS_SYSTEM_USER_ID) return false;
    if (school.userId === 'admin-super-user-id') return false;
    if (school.managerEmail?.toLowerCase().trim() === 'admin@cardschool.tg' || school.managerEmail?.toLowerCase().trim() === 'admin@sukupass.tg') return false;
    if (school.name?.toUpperCase().includes('ADMINISTRATION CENTRALE')) return false;
    if (school.name?.toUpperCase().includes('CONFIGURATION SYSTEME')) return false;
    if (deletedBlacklist.has(school.userId)) return false;
    return true;
  });

  return validSchools;
}

/** Fetches total count of all student cards in the system */
export async function fetchAllStudentsCount(): Promise<number> {
  let totalDb = 0;
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      totalDb = count;
    }
  } catch (e: any) {
    console.error('fetchAllStudentsCount error:', e.message);
  }

  // Count local storage students as offline fallback
  let localTotal = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cartes_togo_students_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) localTotal += list.length;
          } catch { }
        }
      }
    }
  } catch { }

  return Math.max(totalDb, localTotal);
}

/** Delete an entire school, its students, chats, logs and license keys by super-admin */
export async function deleteSchoolByAdmin(userId: string, schoolName?: string): Promise<boolean> {
  // 1. Ajouter à la liste noire pour interdire toute réapparition
  addDeletedSchoolBlacklist(userId);

  // 2. Retirer du registre persistant
  try {
    const remaining = getRegisteredSchoolsRegistry().filter(s => s.userId !== userId);
    localStorage.setItem(REGISTERED_SCHOOLS_KEY, JSON.stringify(remaining));
  } catch { }

  // 3. Supprimer de Supabase (school_info, students, admin_logs, chat_messages, license_keys) SI UUID valide
  if (isValidUuid(userId)) {
    try {
      await supabase.from('school_info').delete().eq('user_id', userId);
      await supabase.from('students').delete().eq('user_id', userId);
      await supabase.from('admin_logs').delete().eq('school_id', userId);
      await supabase.from('chat_messages').delete().eq('school_id', userId);
      await supabase.from('license_keys').delete().or(`target_school_id.eq.${userId},used_by_school_id.eq.${userId}`);
    } catch (err) {
      console.warn('deleteSchoolByAdmin Supabase error:', err);
    }
  }

  // 4. Supprimer les clés de licence associées dans le registre persistant
  try {
    const allKeys = await fetchAllLicenseKeys();
    const filteredKeys = allKeys.filter(k =>
      k.targetSchoolId !== userId &&
      k.usedBySchoolId !== userId &&
      (!schoolName || (k.targetSchoolName && k.targetSchoolName.toUpperCase() !== schoolName.toUpperCase()))
    );
    await saveAllLicenseKeys(filteredKeys);
  } catch (err) {
    console.warn('deleteSchoolByAdmin license cleanup error:', err);
  }

  // 5. Nettoyer le stockage local
  try {
    localStorage.removeItem('cartes_togo_school_' + userId);
    localStorage.removeItem('cartes_togo_students_' + userId);
    localStorage.removeItem('cartes_togo_sync_queue_' + userId);
  } catch { }

  // 6. Journaliser la suppression
  await saveAdminLog(
    PLATFORM_SETTINGS_SYSTEM_USER_ID,
    'SUPPRESSION_ETABLISSEMENT',
    `Établissement "${schoolName || userId}" supprimé (ID: ${userId}) par le super-administrateur`,
    'Administration Système'
  ).catch(() => { });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_school_deleted', { detail: userId }));
  }

  return true;
}

/** Nettoie complètement le cache local des anciennes écoles (pour repartir à neuf lors d'un changement de base Supabase) */
export async function clearAllLocalSchoolsCache(): Promise<number> {
  let count = 0;
  try {
    // Vider également la blacklist pour éviter de bloquer une école légitime
    clearDeletedSchoolsBlacklist();

    const registered = getRegisteredSchoolsRegistry();
    count = registered.length;
    for (const s of registered) {
      if (s.userId) {
        localStorage.removeItem('cartes_togo_school_' + s.userId);
        localStorage.removeItem('cartes_togo_students_' + s.userId);
        localStorage.removeItem('cartes_togo_sync_queue_' + s.userId);
      }
    }
    // Vider le registre
    localStorage.removeItem(REGISTERED_SCHOOLS_KEY);

    // Scanner et supprimer tout ce qui commence par cartes_togo_school_, cartes_togo_students_, ou anciens jetons auth
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (
        k.startsWith('cartes_togo_school_') ||
        k.startsWith('cartes_togo_students_') ||
        k.startsWith('cartes_togo_sync_queue_') ||
        (k.startsWith('sb-') && k.endsWith('-auth-token'))
      )) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }

    // Vider les anciens messages de chat locaux
    localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY);
    localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY_ALT);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cardschool_school_deleted', { detail: 'all' }));
      window.dispatchEvent(new CustomEvent('cardschool_chat_message_received', { detail: null }));
    }
  } catch (err) {
    console.warn('clearAllLocalSchoolsCache error:', err);
  }
  return count;
}

/**
 * Synchronise et vérifie la liste avec la base de données Supabase réelle :
 * Seuls les établissements présents dans la base Supabase actuelle sont conservés.
 * Tout établissement absent de la base Supabase est automatiquement purgé du cache local.
 */
export async function syncAndCleanOrphanSchoolsWithDatabase(): Promise<{
  activeInDbCount: number;
  purgedLocalCount: number;
}> {
  let activeInDbCount = 0;
  let purgedLocalCount = 0;

  try {
    // 1. Récupérer les identifiants d'écoles réellement présents dans la nouvelle base Supabase
    const { data: dbSchools, error } = await supabase
      .from('school_info')
      .select('user_id');

    if (error) {
      console.warn('syncAndCleanOrphanSchoolsWithDatabase Supabase query error:', error.message);
      return { activeInDbCount: 0, purgedLocalCount: 0 };
    }

    const validDbUserIds = new Set<string>();
    if (dbSchools) {
      for (const row of dbSchools) {
        if (row.user_id && isValidUuid(row.user_id)) {
          validDbUserIds.add(row.user_id);
        }
      }
    }
    activeInDbCount = validDbUserIds.size;

    // 2. Vérifier le registre local
    const registered = getRegisteredSchoolsRegistry();
    const remainingRegistry: AdminSchoolDetail[] = [];
    for (const school of registered) {
      if (school.userId && validDbUserIds.has(school.userId)) {
        remainingRegistry.push(school);
      } else if (school.userId) {
        purgedLocalCount++;
        addDeletedSchoolBlacklist(school.userId);
        localStorage.removeItem('cartes_togo_school_' + school.userId);
        localStorage.removeItem('cartes_togo_students_' + school.userId);
        localStorage.removeItem('cartes_togo_sync_queue_' + school.userId);
      }
    }
    localStorage.setItem(REGISTERED_SCHOOLS_KEY, JSON.stringify(remainingRegistry));

    // 3. Nettoyer les clés de localStorage orphelines
    const orphanKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith('cartes_togo_school_')) {
        const uid = key.replace('cartes_togo_school_', '');
        if (!validDbUserIds.has(uid)) {
          orphanKeys.push(key);
          orphanKeys.push('cartes_togo_students_' + uid);
          orphanKeys.push('cartes_togo_sync_queue_' + uid);
        }
      } else if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '{}');
          const uid = parsed?.user?.id || parsed?.currentSession?.user?.id;
          if (uid && !validDbUserIds.has(uid) && uid !== 'admin-super-user-id') {
            orphanKeys.push(key);
          }
        } catch { }
      }
    }

    for (const k of orphanKeys) {
      localStorage.removeItem(k);
    }

    // Nettoyer également les messages de chat orphelins
    try {
      const purgeChatStorage = (storageKey: string) => {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(m => m && m.schoolId && validDbUserIds.has(m.schoolId));
            localStorage.setItem(storageKey, JSON.stringify(cleaned));
          }
        }
      };
      purgeChatStorage(CHAT_MESSAGES_STORAGE_KEY);
      purgeChatStorage(CHAT_MESSAGES_STORAGE_KEY_ALT);
    } catch { }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cardschool_school_deleted', { detail: 'sync' }));
    }
  } catch (err) {
    console.warn('syncAndCleanOrphanSchoolsWithDatabase error:', err);
  }

  return { activeInDbCount, purgedLocalCount };
}

/** Create or provision a school directly by super-admin */
export async function createSchoolByAdmin(data: {
  name: string;
  schoolType?: string;
  location?: string;
  phone?: string;
  region?: string;
  customQuota?: number;
  plan?: 'free' | 'pro';
}): Promise<{ success: boolean; school?: AdminSchoolDetail; error?: string }> {
  const pseudoUserId = generateUUID();
  const now = new Date().toISOString();

  const newSchoolDetail: AdminSchoolDetail = {
    ...DEFAULT_SCHOOL_INFO,
    name: data.name.trim().toUpperCase(),
    schoolType: data.schoolType || 'Lycée',
    location: data.location || '',
    phone: data.phone || '',
    region: data.region || 'Grand Lomé',
    customQuota: data.customQuota || 15,
    subscriptionPlan: data.plan || 'free',
    trialExpiresAt: computeDefaultTrialExpiresAt(),
    userId: pseudoUserId,
    updatedAt: now,
    studentCount: 0
  };

  // Enregistrer via le pipeline universel
  await registerSchoolRecord(newSchoolDetail);

  // Générer automatiquement la clé pré-assignée si plan gratuit
  if (newSchoolDetail.subscriptionPlan !== 'pro') {
    await createPreassignedLicenseForSchool(
      pseudoUserId,
      newSchoolDetail.name,
      undefined,
      data.phone
    ).catch(() => { });
  }

  // Journaliser dans le registre d'audit
  await saveAdminLog(
    pseudoUserId,
    'Création Établissement (Admin)',
    `Établissement "${newSchoolDetail.name}" (${newSchoolDetail.schoolType}) ajouté manuellement par l'administrateur à ${newSchoolDetail.location || 'Togo'}.`,
    newSchoolDetail.name
  );

  return {
    success: true,
    school: newSchoolDetail
  };
}

/** Upgrade, suspend or modify a school's subscription plan */
export async function updateSchoolSubscription(
  schoolUserId: string,
  plan: 'free' | 'pro' | 'suspended',
  expiresAt: string = '',
  schoolName?: string
): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const cleanName = (schoolName || 'Établissement').trim();
  const trialExpiresAt = plan === 'free' ? computeDefaultTrialExpiresAt() : undefined;

  // 1. Mettre à jour le registre persistant local immédiatement (0ms)
  try {
    const registered = getRegisteredSchoolsRegistry();
    const existing = registered.find(s => s.userId === schoolUserId);
    if (existing) {
      existing.subscriptionPlan = plan;
      existing.subscriptionExpiresAt = expiresAt;
      if (trialExpiresAt) existing.trialExpiresAt = trialExpiresAt;
      existing.updatedAt = timestamp;
      saveRegisteredSchoolRegistry(existing);
    }
  } catch { }

  // 2. Mettre à jour la clé cartes_togo_school_* immédiatement (0ms)
  try {
    const localKey = 'cartes_togo_school_' + schoolUserId;
    const localRaw = localStorage.getItem(localKey);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      parsed.subscriptionPlan = plan;
      parsed.subscriptionExpiresAt = expiresAt;
      if (trialExpiresAt) parsed.trialExpiresAt = trialExpiresAt;
      parsed.updatedAt = timestamp;
      localStorage.setItem(localKey, JSON.stringify(parsed));
    }
  } catch { }

  // 3. Émettre les événements globaux immédiatement (0ms) + Broadcast WebSocket (<50ms) vers l'école
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_school_registered', { detail: { userId: schoolUserId, subscriptionPlan: plan, subscriptionExpiresAt: expiresAt, trialExpiresAt } }));
    window.dispatchEvent(new CustomEvent('cardschool_subscription_updated', { detail: { userId: schoolUserId, plan, expiresAt, trialExpiresAt, schoolName: cleanName } }));
  }
  broadcastSchoolStatusLive({ userId: schoolUserId, plan, expiresAt, trialExpiresAt, schoolName: cleanName, timestamp });

  // 4. Synchronisation Supabase et journal en arrière-plan sans bloquer l'UI
  const backgroundSync = async () => {
    try {
      const { data: currentData } = await supabase
        .from('school_info')
        .select('*')
        .eq('user_id', schoolUserId)
        .maybeSingle();

      const currentColors = currentData?.card_colors ? currentData.card_colors : DEFAULT_CARD_COLORS;
      const updatedRow = {
        user_id: schoolUserId,
        name: currentData?.name || cleanName.toUpperCase(),
        logo_url: currentData?.logo_url || null,
        signature_url: currentData?.signature_url || null,
        stamp_url: currentData?.stamp_url || null,
        card_colors: {
          ...(typeof currentColors === 'object' ? currentColors : {}),
          subscriptionPlan: plan,
          subscriptionExpiresAt: expiresAt,
          ...(trialExpiresAt ? { trialExpiresAt } : {})
        },
        updated_at: timestamp
      };

      await supabase.from('school_info').upsert(updatedRow, { onConflict: 'user_id' });
      // Re-broadcast after DB commit so any newly connected peer receives the update
      broadcastSchoolStatusLive({ userId: schoolUserId, plan, expiresAt, trialExpiresAt, schoolName: cleanName, timestamp });
    } catch (err) {
      console.warn('updateSchoolSubscription Supabase error:', err);
    }

    // Synchroniser avec les clés de licence (si le compte est suspendu ou réactivé)
    try {
      const keys = await fetchAllLicenseKeys();
      let hasKeyChanges = false;
      for (const k of keys) {
        if (
          (k.targetSchoolId && k.targetSchoolId === schoolUserId) ||
          (k.usedBySchoolId && k.usedBySchoolId === schoolUserId) ||
          (k.targetSchoolName && k.targetSchoolName.toUpperCase() === cleanName.toUpperCase())
        ) {
          if (plan === 'suspended') {
            if (!k.isSuspended) {
              k.isSuspended = true;
              hasKeyChanges = true;
            }
          } else if (plan === 'pro') {
            if (k.isSuspended) {
              k.isSuspended = false;
              hasKeyChanges = true;
            }
            if (!k.isUsed) {
              k.isUsed = true;
              k.usedAt = timestamp;
              k.usedBySchoolId = schoolUserId;
              k.usedBySchoolName = cleanName;
              hasKeyChanges = true;
            }
          } else if (plan === 'free') {
            if (k.isUsed) {
              k.isUsed = false;
              hasKeyChanges = true;
            }
          }
        }
      }
      if (hasKeyChanges) {
        await saveAllLicenseKeys(keys);
      }
    } catch { }

    // Journaliser l'action
    const actionLabel = plan === 'pro'
      ? 'Abonnement PRO Activé'
      : (plan === 'suspended' ? 'Compte Suspendu' : 'Abonnement Réinitialisé Gratuit');
    const details = plan === 'pro'
      ? `Plan PRO 1 An validé (Expire le: ${expiresAt || 'Non défini'})`
      : (plan === 'suspended' ? 'Accès et impression suspendus par l\'administrateur' : 'Retour au Plan Découverte Gratuit');

    await saveAdminLog(
      schoolUserId,
      actionLabel,
      details,
      cleanName
    ).catch(() => { });
  };

  backgroundSync().catch(err => console.warn('Background sync error in updateSchoolSubscription:', err));

  return true;
}

export interface AdminLogItem {
  id: string;
  schoolName: string;
  action: string;
  details: string;
  createdAt: string;
}

const AUDIT_LOGS_STORAGE_KEY = 'cardschool_audit_logs';

/** Save log entry to Supabase admin_logs, audit_logs & local audit log store */
export async function saveAdminLog(
  schoolUserId: string | null,
  action: string,
  details: string,
  schoolName?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const newLogItem: AdminLogItem = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6),
    schoolName: schoolName || (schoolUserId ? 'Établissement' : 'Système SukuPass'),
    action,
    details,
    createdAt: timestamp
  };

  // 1. Sauvegarde locale immédiate (0ms)
  try {
    const localLogsStr = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    const localLogs: AdminLogItem[] = localLogsStr ? JSON.parse(localLogsStr) : [];
    const updated = [newLogItem, ...localLogs].slice(0, 100);
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('saveAdminLog local error:', err);
  }

  // 2. Émettre un événement pour rafraîchissement temps-réel instantané (0ms)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_audit_log_added', { detail: newLogItem }));
  }

  // 3. Sauvegarde Supabase admin_logs en arrière-plan sans bloquer
  Promise.resolve(
    supabase.from('admin_logs').insert({
      school_id: schoolUserId,
      school_name: schoolName,
      action: action,
      details: details,
      created_at: timestamp
    })
  ).catch(err => console.warn('saveAdminLog Supabase background error:', err));
}

/** Helper pour ignorer les logs techniques internes ou JSON bruts */
function isInternalOrCorruptedLog(item: { action?: string; details?: string; schoolName?: string; school_name?: string }): boolean {
  const action = (item.action || '').trim();
  const details = (item.details || '').trim();
  const schoolName = (item.schoolName || item.school_name || '').trim();
  if (
    action === 'SYNC_PLATFORM_SETTINGS' ||
    action === 'SYNC_LICENSE_KEYS' ||
    action === 'PAGE_VISIT' ||
    details === 'SYNC_PLATFORM_SETTINGS' ||
    details === 'SYNC_LICENSE_KEYS' ||
    action.startsWith('{') ||
    details.startsWith('{') ||
    schoolName.startsWith('{')
  ) {
    return true;
  }
  return false;
}

/** Fetches real admin logs from Supabase with fallback to real local activity logs */
export async function fetchAdminLogs(): Promise<AdminLogItem[]> {
  const logsMap = new Map<string, AdminLogItem>();

  // 1. Charger depuis Supabase admin_logs
  try {
    const { data: adminData } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (adminData) {
      for (const log of adminData) {
        if (isInternalOrCorruptedLog(log)) continue;
        const id = log.id?.toString() || `${log.created_at}-${log.school_id}`;
        logsMap.set(id, {
          id,
          schoolName: log.school_name || (log.school_id ? 'Établissement' : 'Système SukuPass'),
          action: log.action || 'Action',
          details: log.details || '',
          createdAt: log.created_at || new Date().toISOString(),
        });
      }
    }
  } catch { }

  // (audit_logs table removed — data consolidated in admin_logs only)

  // 3. Fallback / Fusion avec LocalStorage (et nettoyage automatique des entrées JSON corrompues)
  try {
    const stored = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (stored) {
      const localList: AdminLogItem[] = JSON.parse(stored);
      const cleanedLocalList: AdminLogItem[] = [];
      for (const item of localList) {
        if (isInternalOrCorruptedLog(item)) continue;
        cleanedLocalList.push(item);
        if (!logsMap.has(item.id)) {
          logsMap.set(item.id, item);
        }
      }
      if (cleanedLocalList.length !== localList.length) {
        localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(cleanedLocalList));
      }
    }
  } catch { }

  return Array.from(logsMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

/** Update custom quota for a school */
export async function updateSchoolCustomQuota(
  schoolUserId: string,
  newQuota: number,
  schoolName?: string
): Promise<boolean> {
  const cleanName = schoolName || 'Établissement';
  const timestamp = new Date().toISOString();

  // 1. Mettre à jour le registre local immédiatement (0ms)
  try {
    const registered = getRegisteredSchoolsRegistry();
    const existing = registered.find(s => s.userId === schoolUserId);
    if (existing) {
      existing.customQuota = newQuota;
      existing.updatedAt = timestamp;
      saveRegisteredSchoolRegistry(existing);
    }
  } catch { }

  // 2. Mettre à jour la clé cartes_togo_school_* immédiatement (0ms)
  try {
    const localKey = 'cartes_togo_school_' + schoolUserId;
    const localRaw = localStorage.getItem(localKey);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      parsed.customQuota = newQuota;
      parsed.updatedAt = timestamp;
      localStorage.setItem(localKey, JSON.stringify(parsed));
    }
  } catch { }

  // 3. Émettre l'événement temps-réel immédiatement (0ms) + Broadcast WebSocket (<50ms) vers l'école
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_school_registered', {
      detail: { userId: schoolUserId, customQuota: newQuota }
    }));
    window.dispatchEvent(new CustomEvent('cardschool_subscription_updated', {
      detail: { userId: schoolUserId, customQuota: newQuota, schoolName: cleanName }
    }));
  }
  broadcastSchoolStatusLive({ userId: schoolUserId, customQuota: newQuota, schoolName: cleanName, timestamp });

  // 4. Synchronisation Supabase en arrière-plan sans bloquer
  const syncRemote = async () => {
    try {
      const { data: currentData } = await supabase
        .from('school_info')
        .select('*')
        .eq('user_id', schoolUserId)
        .maybeSingle();

      const currentColors = currentData?.card_colors ?? DEFAULT_CARD_COLORS;
      const updatedRow = {
        user_id: schoolUserId,
        name: currentData?.name || cleanName.toUpperCase(),
        logo_url: currentData?.logo_url || null,
        signature_url: currentData?.signature_url || null,
        stamp_url: currentData?.stamp_url || null,
        card_colors: {
          ...(typeof currentColors === 'object' ? currentColors : {}),
          customQuota: newQuota
        },
        updated_at: timestamp
      };

      await supabase.from('school_info').upsert(updatedRow, { onConflict: 'user_id' });
      broadcastSchoolStatusLive({ userId: schoolUserId, customQuota: newQuota, schoolName: cleanName, timestamp });
      await saveAdminLog(schoolUserId, 'Quota Mis à Jour', `Nouveau quota attribué : ${newQuota} cartes`, cleanName);
    } catch (e: any) {
      console.warn('updateSchoolCustomQuota background sync error:', e);
    }
  };

  syncRemote().catch(err => console.warn('Background sync error in updateSchoolCustomQuota:', err));

  return true;
}

// ─── License Keys & CSV Export Helpers ─────────────────────────────────────────

export const LICENSE_KEYS_STORAGE_KEY = 'cardschool_admin_license_keys';
export const LICENSE_KEYS_STORAGE_KEY_ALT = 'cartes_togo_license_keys';
export const LICENSE_KEYS_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000002';

/** Normalize a license key for reliable comparisons across uppercase, dashes and whitespace */
export function normalizeLicenseCode(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/** Helper to read cached license keys from localStorage immediately */
export function getLocalLicenseKeys(): LicenseKey[] {
  try {
    const stored = localStorage.getItem(LICENSE_KEYS_STORAGE_KEY) || localStorage.getItem(LICENSE_KEYS_STORAGE_KEY_ALT);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { }
  return [];
}

/** Save license keys across Supabase (dedicated license_keys table + system row) and LocalStorage */
export async function saveAllLicenseKeys(keys: LicenseKey[]): Promise<boolean> {
  const timestamp = new Date().toISOString();

  // 1. LocalStorage immédiat (0ms) (both keys for absolute persistence)
  try {
    const jsonStr = JSON.stringify(keys);
    localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, jsonStr);
    localStorage.setItem(LICENSE_KEYS_STORAGE_KEY_ALT, jsonStr);
  } catch (err) {
    console.warn('saveAllLicenseKeys localStorage error:', err);
  }

  // 2. Dispatch global window event immédiatement (0ms) pour réactivité instantanée
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_licenses_updated', {
      detail: keys
    }));
  }

  // 3. Persistance distante Supabase en arrière-plan sans bloquer
  const persistRemote = async () => {
    // Primary: Dedicated Supabase `license_keys` table
    const p1 = (async () => {
      try {
        const rows = keys.map(k => ({
          code: k.code,
          duration_days: (k.durationMonths || 12) * 30,
          is_used: Boolean(k.isUsed),
          used_by_school_id: k.usedBySchoolId || null,
          used_by_school_name: k.usedBySchoolName || null,
          used_at: k.usedAt || null,
          created_at: k.createdAt || timestamp,
          note: k.note || null,
          target_school_name: k.targetSchoolName || null,
          is_suspended: Boolean(k.isSuspended)
        }));
        await supabase.from('license_keys').upsert(rows, { onConflict: 'code' });
      } catch (err) {
        console.warn('saveAllLicenseKeys Supabase license_keys table error:', err);
      }
    })();

    // Fallback: Supabase school_info system entry
    const p2 = (async () => {
      try {
        await supabase.from('school_info').upsert({
          user_id: LICENSE_KEYS_SYSTEM_USER_ID,
          name: 'SYSTEM_LICENSE_KEYS_REGISTRY',
          logo_url: null,
          signature_url: null,
          stamp_url: null,
          card_colors: { licenseKeys: keys } as any,
          updated_at: timestamp
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn('saveAllLicenseKeys Supabase school_info system row error:', err);
      }
    })();

    // Fallback: Supabase admin_logs with raw JSON payload
    const p3 = saveAdminLog(
      LICENSE_KEYS_SYSTEM_USER_ID,
      'SYNC_LICENSE_KEYS',
      JSON.stringify(keys),
      'Registre de Licences'
    ).catch(() => {});

    await Promise.allSettled([p1, p2, p3]);
  };

  persistRemote().catch(err => console.warn('Background sync error in saveAllLicenseKeys:', err));

  return true;
}

/** Fetch all license keys from Supabase with LocalStorage fallback and intelligent deduplication */
export async function fetchAllLicenseKeys(): Promise<LicenseKey[]> {
  const keysMap = new Map<string, LicenseKey>();

  // 1. Primary: Dedicated Supabase `license_keys` table
  try {
    const { data: dbKeys, error: dbError } = await supabase
      .from('license_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (!dbError && dbKeys && dbKeys.length > 0) {
      for (const row of dbKeys) {
        if (row && row.code) {
          const norm = normalizeLicenseCode(row.code);
          keysMap.set(norm, {
            id: row.id?.toString() || `key-${norm}`,
            code: row.code,
            plan: 'pro',
            durationMonths: row.duration_days ? Math.round(row.duration_days / 30) : 12,
            targetSchoolName: row.target_school_name || undefined,
            targetSchoolId: row.target_school_id || undefined,
            targetSchoolEmail: row.target_school_email || undefined,
            targetSchoolPhone: row.target_school_phone || undefined,
            autoAssigned: row.auto_assigned !== undefined ? Boolean(row.auto_assigned) : undefined,
            isUsed: Boolean(row.is_used),
            isSuspended: Boolean(row.is_suspended),
            createdAt: row.created_at || new Date().toISOString(),
            usedAt: row.used_at || undefined,
            usedBySchoolId: row.used_by_school_id || undefined,
            usedBySchoolName: row.used_by_school_name || undefined,
            note: row.note || undefined
          });
        }
      }
    }
  } catch (err) {
    // Continue to next tier
  }

  // 2. Secondary: Supabase school_info system entry
  try {
    const { data: systemRow, error: sysError } = await supabase
      .from('school_info')
      .select('*')
      .eq('user_id', LICENSE_KEYS_SYSTEM_USER_ID)
      .maybeSingle();

    if (!sysError && systemRow && systemRow.card_colors) {
      let rawList: any[] = [];
      if (Array.isArray(systemRow.card_colors)) {
        rawList = systemRow.card_colors;
      } else if (typeof systemRow.card_colors === 'object' && Array.isArray((systemRow.card_colors as any).licenseKeys)) {
        rawList = (systemRow.card_colors as any).licenseKeys;
      } else if (typeof systemRow.card_colors === 'string') {
        try {
          const parsed = JSON.parse(systemRow.card_colors);
          if (Array.isArray(parsed)) rawList = parsed;
          else if (Array.isArray(parsed?.licenseKeys)) rawList = parsed.licenseKeys;
        } catch { }
      }

      for (const k of rawList) {
        if (k && k.code) {
          const norm = normalizeLicenseCode(k.code);
          const existing = keysMap.get(norm);
          if (!existing) {
            keysMap.set(norm, {
              id: k.id || `key-${norm}`,
              code: k.code,
              plan: k.plan || 'pro',
              durationMonths: k.durationMonths || 12,
              targetSchoolName: k.targetSchoolName,
              targetSchoolId: k.targetSchoolId,
              targetSchoolEmail: k.targetSchoolEmail,
              targetSchoolPhone: k.targetSchoolPhone,
              autoAssigned: k.autoAssigned,
              isUsed: Boolean(k.isUsed),
              isSuspended: Boolean(k.isSuspended),
              createdAt: k.createdAt || new Date().toISOString(),
              usedAt: k.usedAt,
              usedBySchoolId: k.usedBySchoolId,
              usedBySchoolName: k.usedBySchoolName,
              note: k.note
            });
          } else {
            if (k.isUsed && !existing.isUsed) {
              existing.isUsed = true;
              existing.usedAt = k.usedAt;
              existing.usedBySchoolId = k.usedBySchoolId;
              existing.usedBySchoolName = k.usedBySchoolName;
            }
            if (k.isSuspended && !existing.isSuspended) {
              existing.isSuspended = true;
            }
            if (k.targetSchoolId && !existing.targetSchoolId) {
              existing.targetSchoolId = k.targetSchoolId;
            }
            if (k.targetSchoolName && !existing.targetSchoolName) {
              existing.targetSchoolName = k.targetSchoolName;
            }
            if (k.autoAssigned !== undefined && existing.autoAssigned === undefined) {
              existing.autoAssigned = k.autoAssigned;
            }
          }
        }
      }
    }
  } catch (err) {
    // Continue to next tier
  }

  // 3. Tertiary: Supabase admin_logs SYNC_LICENSE_KEYS entry
  try {
    const { data: logs, error: logError } = await supabase
      .from('admin_logs')
      .select('*')
      .eq('action', 'SYNC_LICENSE_KEYS')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!logError && logs && logs.length > 0 && logs[0].details) {
      try {
        const parsed = JSON.parse(logs[0].details);
        if (Array.isArray(parsed)) {
          for (const k of parsed) {
            if (k && k.code) {
              const norm = normalizeLicenseCode(k.code);
              const existing = keysMap.get(norm);
              if (!existing) {
                keysMap.set(norm, {
                  id: k.id || `key-${norm}`,
                  code: k.code,
                  plan: k.plan || 'pro',
                  durationMonths: k.durationMonths || 12,
                  targetSchoolName: k.targetSchoolName,
                  isUsed: Boolean(k.isUsed),
                  isSuspended: Boolean(k.isSuspended),
                  createdAt: k.createdAt || new Date().toISOString(),
                  usedAt: k.usedAt,
                  usedBySchoolId: k.usedBySchoolId,
                  usedBySchoolName: k.usedBySchoolName,
                  note: k.note
                });
              } else {
                if (k.isUsed && !existing.isUsed) {
                  existing.isUsed = true;
                  existing.usedAt = k.usedAt;
                  existing.usedBySchoolId = k.usedBySchoolId;
                  existing.usedBySchoolName = k.usedBySchoolName;
                }
                if (k.isSuspended && !existing.isSuspended) {
                  existing.isSuspended = true;
                }
              }
            }
          }
        }
      } catch { }
    }
  } catch (err) {
    // Continue to local storage
  }

  // 4. Fallback / Merge with LocalStorage
  const localKeys = getLocalLicenseKeys();
  for (const k of localKeys) {
    if (k && k.code) {
      const norm = normalizeLicenseCode(k.code);
      const existing = keysMap.get(norm);
      if (!existing) {
        keysMap.set(norm, k);
      } else {
        if (k.isUsed && !existing.isUsed) {
          existing.isUsed = true;
          existing.usedAt = k.usedAt;
          existing.usedBySchoolId = k.usedBySchoolId;
          existing.usedBySchoolName = k.usedBySchoolName;
        }
        if (k.isSuspended && !existing.isSuspended) {
          existing.isSuspended = true;
        }
      }
    }
  }

  const resultList = Array.from(keysMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Cache back to LocalStorage
  try {
    const jsonStr = JSON.stringify(resultList);
    localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, jsonStr);
    localStorage.setItem(LICENSE_KEYS_STORAGE_KEY_ALT, jsonStr);
  } catch { }

  return resultList;
}

export async function generateLicenseKey(
  durationMonths: number = 12,
  note?: string,
  targetSchoolName?: string
): Promise<LicenseKey> {
  const randomSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomSegment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `TOGO-PRO-2026-${randomSegment}-${randomSegment2}`;

  const newKey: LicenseKey = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 5),
    code,
    plan: 'pro',
    durationMonths,
    targetSchoolName: targetSchoolName ? targetSchoolName.trim() : undefined,
    isUsed: false,
    isSuspended: false,
    createdAt: new Date().toISOString(),
    note: note || 'Généré depuis la Console Admin'
  };

  // Direct insert to dedicated license_keys table
  try {
    await supabase.from('license_keys').insert({
      code: newKey.code,
      duration_days: durationMonths * 30,
      is_used: false,
      note: newKey.note || null,
      target_school_name: newKey.targetSchoolName || null,
      is_suspended: false,
      created_at: newKey.createdAt
    });
  } catch (err) {
    console.warn('generateLicenseKey Supabase license_keys insert error:', err);
  }

  const currentKeys = await fetchAllLicenseKeys();
  const updatedKeys = [newKey, ...currentKeys.filter(k => normalizeLicenseCode(k.code) !== normalizeLicenseCode(code))];
  await saveAllLicenseKeys(updatedKeys);

  const destInfo = targetSchoolName ? ` pour "${targetSchoolName}"` : '';
  await saveAdminLog(null, 'Clé Licence Créée', `Clé de licence PRO 1 An générée : ${code}${destInfo}`);
  return newKey;
}

/** Crée automatiquement une clé de licence PRO 1 An pré-assignée à un établissement à la création de son compte */
export async function createPreassignedLicenseForSchool(
  schoolUserId: string,
  schoolName: string,
  managerEmail?: string,
  managerPhone?: string
): Promise<LicenseKey> {
  const cleanName = (schoolName || 'Établissement').trim().toUpperCase();
  const keys = await fetchAllLicenseKeys();

  // Vérifier si une clé pré-assignée ou utilisée existe déjà pour cet établissement
  const existingKey = keys.find(k =>
    (k.targetSchoolId && k.targetSchoolId === schoolUserId) ||
    (k.targetSchoolName && k.targetSchoolName.toUpperCase() === cleanName) ||
    (k.usedBySchoolId && k.usedBySchoolId === schoolUserId)
  );

  if (existingKey) {
    return existingKey;
  }

  // Générer un code lisible et unique avec préfixe TOGO-PRO
  const randomSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomSegment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `TOGO-PRO-2026-${randomSegment}-${randomSegment2}`;

  const contactStr = [managerEmail, managerPhone].filter(Boolean).join(' • ');
  const note = `Licence pré-assignée à l'inscription (${cleanName}${contactStr ? ` - ${contactStr}` : ''})`;

  const newKey: LicenseKey = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6),
    code,
    plan: 'pro',
    durationMonths: 12,
    targetSchoolName: cleanName,
    targetSchoolId: schoolUserId,
    targetSchoolEmail: managerEmail,
    targetSchoolPhone: managerPhone,
    autoAssigned: true,
    isUsed: false,
    isSuspended: false,
    createdAt: new Date().toISOString(),
    note
  };

  // Sauvegarde Supabase directe
  try {
    await supabase.from('license_keys').insert({
      code: newKey.code,
      duration_days: 12 * 30,
      is_used: false,
      note: newKey.note,
      target_school_name: cleanName,
      is_suspended: false,
      created_at: newKey.createdAt
    });
  } catch (err) {
    console.warn('createPreassignedLicenseForSchool insert error:', err);
  }

  const updatedKeys = [newKey, ...keys.filter(k => normalizeLicenseCode(k.code) !== normalizeLicenseCode(code))];
  await saveAllLicenseKeys(updatedKeys);

  await saveAdminLog(
    schoolUserId,
    'Licence Pré-Assignée Créée',
    `Clé ${code} pré-attribuée automatiquement à "${cleanName}" en attente de validation/règlement.`,
    cleanName
  );

  return newKey;
}

/** Active directement un établissement en PRO (1 clic administrateur après réception du paiement) */
export async function activateSchoolDirectly(
  schoolUserId: string,
  schoolName: string,
  durationMonths: number = 12
): Promise<{ success: boolean; expiresAt: string; licenseCode?: string; message: string }> {
  try {
    const cleanName = (schoolName || 'Établissement').trim();
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + durationMonths);
    const expiresAtStr = nextDate.toISOString().split('T')[0];

    // 1. Mettre à jour l'abonnement de l'établissement en PRO
    const subSuccess = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr, cleanName);
    if (!subSuccess) {
      // Si la ligne school_info n'existe pas encore pour cet ID, s'assurer de la créer
      const defaultSchoolData: AdminSchoolDetail = {
        ...DEFAULT_SCHOOL_INFO,
        name: cleanName.toUpperCase(),
        userId: schoolUserId,
        subscriptionPlan: 'pro',
        subscriptionExpiresAt: expiresAtStr,
        updatedAt: new Date().toISOString()
      };
      await registerSchoolRecord(defaultSchoolData);
    }

    // 2. Mettre à jour la licence pré-assignée pour marquer son utilisation
    const keys = await fetchAllLicenseKeys();
    let targetKey = keys.find(k =>
      !k.isUsed && (
        (k.targetSchoolId && k.targetSchoolId === schoolUserId) ||
        (k.targetSchoolName && k.targetSchoolName.toUpperCase() === cleanName.toUpperCase())
      )
    );

    const nowIso = new Date().toISOString();

    if (!targetKey) {
      // Générer une clé pour l'archive et la traçabilité
      const randomSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomSegment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `TOGO-PRO-2026-${randomSegment}-${randomSegment2}`;
      targetKey = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6),
        code,
        plan: 'pro',
        durationMonths,
        targetSchoolName: cleanName,
        targetSchoolId: schoolUserId,
        autoAssigned: true,
        isUsed: true,
        isSuspended: false,
        usedBySchoolId: schoolUserId,
        usedBySchoolName: cleanName,
        usedAt: nowIso,
        createdAt: nowIso,
        note: `Activation directe par l'administrateur (${durationMonths} mois)`
      };
      keys.unshift(targetKey);
    } else {
      targetKey.isUsed = true;
      targetKey.durationMonths = durationMonths;
      targetKey.usedBySchoolId = schoolUserId;
      targetKey.usedBySchoolName = cleanName;
      targetKey.usedAt = nowIso;
      targetKey.note = (targetKey.note ? targetKey.note + ' • ' : '') + `Activée directement par Admin le ${new Date().toLocaleDateString('fr-FR')}`;
    }

    // Sauvegarder dans la table license_keys
    try {
      await supabase.from('license_keys').upsert({
        code: targetKey.code,
        duration_days: durationMonths * 30,
        is_used: true,
        used_by_school_id: schoolUserId,
        used_by_school_name: cleanName,
        used_at: nowIso,
        note: targetKey.note,
        target_school_name: cleanName,
        is_suspended: false,
        created_at: targetKey.createdAt || nowIso
      }, { onConflict: 'code' });
    } catch { }

    await saveAllLicenseKeys(keys);

    // 3. Mettre à jour le registre local des écoles
    const registered = getRegisteredSchoolsRegistry();
    const existing = registered.find(s => s.userId === schoolUserId);
    if (existing) {
      existing.subscriptionPlan = 'pro';
      existing.subscriptionExpiresAt = expiresAtStr;
      existing.updatedAt = nowIso;
      saveRegisteredSchoolRegistry(existing);
    }

    // 4. Journaliser dans les logs d'administration
    await saveAdminLog(
      schoolUserId,
      'Paiement Validé & PRO Activé',
      `Activation directe par l'administrateur (${durationMonths} mois, valide jusqu'au ${expiresAtStr}). Clé associée : ${targetKey.code}`,
      cleanName
    );

    // 5. Envoyer un message de félicitations automatique dans le chat
    try {
      await sendChatMessage(
        schoolUserId,
        cleanName,
        'admin',
        `🎉 Félicitations ! Votre règlement a été validé par l'administrateur. Votre compte est désormais activé en formule PRO Illimitée jusqu'au ${expiresAtStr}. Vous pouvez créer et exporter vos cartes sans aucune restriction.`
      );
    } catch { }

    // 6. Émettre les événements globaux + Broadcast WebSocket (<50ms) pour rafraîchissement temps réel sans rechargement
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cardschool_school_registered', { detail: { userId: schoolUserId, subscriptionPlan: 'pro', subscriptionExpiresAt: expiresAtStr } }));
      window.dispatchEvent(new CustomEvent('cardschool_subscription_updated', { detail: { userId: schoolUserId, plan: 'pro', expiresAt: expiresAtStr, schoolName: cleanName } }));
      window.dispatchEvent(new CustomEvent('cardschool_licenses_updated', { detail: keys }));
    }
    broadcastSchoolStatusLive({ userId: schoolUserId, plan: 'pro', expiresAt: expiresAtStr, schoolName: cleanName, timestamp: nowIso });

    return {
      success: true,
      expiresAt: expiresAtStr,
      licenseCode: targetKey.code,
      message: `Compte PRO activé avec succès pour "${cleanName}" jusqu'au ${expiresAtStr} (Clé : ${targetKey.code}) !`
    };
  } catch (err: any) {
    console.error('activateSchoolDirectly error:', err);
    return {
      success: false,
      expiresAt: '',
      message: err?.message || "Une erreur est survenue lors de l'activation directe."
    };
  }
}

/** Toggle suspension status of a license key (Activer / Désactiver) */
export async function toggleLicenseKeyStatus(keyId: string): Promise<boolean> {
  try {
    const keys = await fetchAllLicenseKeys();
    const key = keys.find(k => k.id === keyId || k.code === keyId);
    if (!key) return false;

    key.isSuspended = !key.isSuspended;

    // Direct update to dedicated table
    try {
      await supabase
        .from('license_keys')
        .update({ is_suspended: key.isSuspended })
        .eq('code', key.code);
    } catch { }

    await saveAllLicenseKeys(keys);

    // Synchroniser le statut d'abonnement de l'école associée
    const targetUserId = key.usedBySchoolId || key.targetSchoolId;
    const allSchools = await fetchAllSchools();
    const matchedSchool = allSchools.find(s =>
      (targetUserId && s.userId === targetUserId) ||
      (key.targetSchoolName && s.name.toUpperCase() === key.targetSchoolName.toUpperCase())
    );

    if (matchedSchool) {
      const newPlan = key.isSuspended ? 'suspended' : 'pro';
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + (key.durationMonths || 12));
      const expiresAtStr = nextDate.toISOString().split('T')[0];
      await updateSchoolSubscription(matchedSchool.userId, newPlan, expiresAtStr, matchedSchool.name);
    }

    const statusStr = key.isSuspended ? 'Désactivée / Suspendue' : 'Réactivée / Active';
    await saveAdminLog(
      null,
      key.isSuspended ? 'Clé Licence Suspendue' : 'Clé Licence Réactivée',
      `La clé ${key.code} (${key.targetSchoolName || 'Non assignée'}) est désormais ${statusStr}`
    );
    return true;
  } catch (err) {
    console.error('toggleLicenseKeyStatus error:', err);
    return false;
  }
}

/** Delete a license key permanently */
export async function deleteLicenseKey(keyId: string): Promise<boolean> {
  try {
    const keys = await fetchAllLicenseKeys();
    const keyToDelete = keys.find(k => k.id === keyId || k.code === keyId);
    if (!keyToDelete) return false;

    // Direct delete from dedicated table
    try {
      await supabase
        .from('license_keys')
        .delete()
        .eq('code', keyToDelete.code);
    } catch { }

    const remainingKeys = keys.filter(k => k.id !== keyId && k.code !== keyId);
    await saveAllLicenseKeys(remainingKeys);

    await saveAdminLog(
      null,
      'Clé Licence Supprimée',
      `Suppression définitive de la clé ${keyToDelete.code} (${keyToDelete.targetSchoolName || 'Non assignée'})`
    );
    return true;
  } catch (err) {
    console.error('deleteLicenseKey error:', err);
    return false;
  }
}

/** Purge all orphan or unattached license keys from previous test sessions */
export async function purgeOrphanLicenseKeys(): Promise<{ removedCount: number }> {
  try {
    const [allSchools, allKeys] = await Promise.all([
      fetchAllSchools(),
      fetchAllLicenseKeys()
    ]);

    const activeSchoolIds = new Set(allSchools.map(s => s.userId));
    const activeSchoolNames = new Set(allSchools.map(s => (s.name || '').toUpperCase().trim()));

    // Keep keys that are assigned to an active school or have been used by an active school, or were manually created
    const keysToKeep = allKeys.filter(k => {
      // If it has a target school ID, that school must exist
      if (k.targetSchoolId) {
        return activeSchoolIds.has(k.targetSchoolId);
      }
      // If it has a target school name, that school must exist
      if (k.targetSchoolName) {
        return activeSchoolNames.has(k.targetSchoolName.toUpperCase().trim());
      }
      // Unassigned manual keys: keep if created intentionally
      return true;
    });

    const removedCount = allKeys.length - keysToKeep.length;
    if (removedCount > 0) {
      await saveAllLicenseKeys(keysToKeep);
      await saveAdminLog(
        null,
        'Nettoyage Licences Orphelines',
        `Suppression de ${removedCount} clé(s) de licence orphelines sans école associée`
      ).catch(() => { });
    }
    return { removedCount };
  } catch (err) {
    console.error('purgeOrphanLicenseKeys error:', err);
    return { removedCount: 0 };
  }
}

/** Redeem a license key with cloud verification and subscription update */
export async function redeemLicenseKey(code: string, schoolUserId: string, schoolName: string): Promise<{ success: boolean; message: string }> {
  if (!code || !code.trim()) {
    return { success: false, message: 'Veuillez saisir un code de clé de licence valide.' };
  }

  const normalizedInput = normalizeLicenseCode(code);
  const keys = await fetchAllLicenseKeys();
  const foundKey = keys.find(k => normalizeLicenseCode(k.code) === normalizedInput);

  if (!foundKey) {
    return { success: false, message: 'Clé de licence invalide ou inexistante. Veuillez vérifier les caractères saisis.' };
  }
  if (foundKey.isSuspended) {
    return { success: false, message: 'Cette clé de licence a été suspendue ou désactivée par l\'administration. Veuillez contacter le support technique.' };
  }
  if (foundKey.isUsed) {
    const usedDate = foundKey.usedAt ? new Date(foundKey.usedAt).toLocaleDateString('fr-FR') : '';
    return { success: false, message: `Cette clé a déjà été activée${usedDate ? ` le ${usedDate}` : ''} par ${foundKey.usedBySchoolName || 'un autre établissement'}.` };
  }

  const duration = foundKey.durationMonths || 12;
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + duration);
  const expiresAtStr = nextDate.toISOString().split('T')[0];

  const updated = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr, schoolName);
  if (!updated) {
    return { success: false, message: "Erreur lors de l'activation de la licence sur votre compte dans la base de données. Veuillez réessayer." };
  }

  foundKey.isUsed = true;
  foundKey.usedBySchoolId = schoolUserId;
  foundKey.usedBySchoolName = schoolName;
  foundKey.usedAt = new Date().toISOString();

  // Direct update to dedicated table
  try {
    await supabase
      .from('license_keys')
      .update({
        is_used: true,
        used_by_school_id: schoolUserId,
        used_by_school_name: schoolName,
        used_at: foundKey.usedAt
      })
      .eq('code', foundKey.code);
  } catch { }

  await saveAllLicenseKeys(keys);

  await saveAdminLog(
    schoolUserId,
    'Licence PRO Activée',
    `Clé ${foundKey.code} activée avec succès pour l'établissement "${schoolName}" (Expire le ${expiresAtStr})`,
    schoolName
  );

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_school_registered', { detail: { userId: schoolUserId, subscriptionPlan: 'pro', subscriptionExpiresAt: expiresAtStr } }));
    window.dispatchEvent(new CustomEvent('cardschool_subscription_updated', { detail: { userId: schoolUserId, plan: 'pro', expiresAt: expiresAtStr, schoolName } }));
  }
  broadcastSchoolStatusLive({ userId: schoolUserId, plan: 'pro', expiresAt: expiresAtStr, schoolName, timestamp: foundKey.usedAt });

  return {
    success: true,
    message: `Félicitations ! Votre abonnement PRO (${duration} mois) a été activé avec succès jusqu'au ${expiresAtStr}.`
  };
}

// ─── Chat & Payment Proofs Helpers ───────────────────────────────────────────

export const CHAT_MESSAGES_STORAGE_KEY = 'cardschool_chat_messages';
export const CHAT_MESSAGES_STORAGE_KEY_ALT = 'cartes_togo_chat_messages';

let liveChatChannel: any = null;
let liveChatChannelReady = false;
let localBroadcastBus: BroadcastChannel | null = null;

function appendMessageToLocalCache(msg: ChatMessage) {
  try {
    const stored = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    const messages: ChatMessage[] = stored ? JSON.parse(stored) : [];
    const timeMs = new Date(msg.createdAt).getTime();

    const filtered = messages.filter(m =>
      m.id !== msg.id &&
      !(m.schoolId === msg.schoolId && m.senderRole === msg.senderRole && m.message === msg.message && Math.abs(new Date(m.createdAt).getTime() - timeMs) < 4000)
    );
    const updated = [...filtered, msg].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const serialized = JSON.stringify(updated);
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, serialized);
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY_ALT, serialized);
  } catch {
    // Ignore storage quota errors
  }
}

function emitIncomingChatMessage(incomingMsg: ChatMessage) {
  if (!incomingMsg || (!incomingMsg.message && !incomingMsg.attachmentUrl)) return;
  appendMessageToLocalCache(incomingMsg);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_chat_message_received', {
      detail: incomingMsg
    }));
  }
}

export interface LiveSchoolStatusPayload {
  userId: string;
  plan?: 'free' | 'pro' | 'suspended';
  expiresAt?: string;
  trialExpiresAt?: string;
  customQuota?: number;
  schoolName?: string;
  timestamp?: string;
}

function applyIncomingSchoolStatusUpdate(payload: LiveSchoolStatusPayload) {
  if (!payload || !payload.userId) return;
  const nowIso = payload.timestamp || new Date().toISOString();

  // 1. Update local school cache
  try {
    const localKey = 'cartes_togo_school_' + payload.userId;
    const localRaw = localStorage.getItem(localKey);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (payload.plan !== undefined) parsed.subscriptionPlan = payload.plan;
      if (payload.expiresAt !== undefined) parsed.subscriptionExpiresAt = payload.expiresAt;
      if (payload.trialExpiresAt !== undefined) parsed.trialExpiresAt = payload.trialExpiresAt;
      if (payload.customQuota !== undefined) parsed.customQuota = payload.customQuota;
      parsed.updatedAt = nowIso;
      localStorage.setItem(localKey, JSON.stringify(parsed));
    }
  } catch { }

  // 2. Update registered schools registry
  try {
    const registered = getRegisteredSchoolsRegistry();
    const existing = registered.find(s => s.userId === payload.userId);
    if (existing) {
      if (payload.plan !== undefined) existing.subscriptionPlan = payload.plan;
      if (payload.expiresAt !== undefined) existing.subscriptionExpiresAt = payload.expiresAt;
      if (payload.trialExpiresAt !== undefined) existing.trialExpiresAt = payload.trialExpiresAt;
      if (payload.customQuota !== undefined) existing.customQuota = payload.customQuota;
      existing.updatedAt = nowIso;
      saveRegisteredSchoolRegistry(existing);
    }
  } catch { }

  // 3. Emit instant DOM events for both School App and Admin Dashboard
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_subscription_updated', {
      detail: payload
    }));
    window.dispatchEvent(new CustomEvent('cardschool_school_registered', {
      detail: {
        userId: payload.userId,
        subscriptionPlan: payload.plan,
        subscriptionExpiresAt: payload.expiresAt,
        trialExpiresAt: payload.trialExpiresAt,
        customQuota: payload.customQuota
      }
    }));
  }
}

export function broadcastSchoolStatusLive(payload: LiveSchoolStatusPayload) {
  try {
    if (localBroadcastBus) {
      localBroadcastBus.postMessage({ __event: 'school_status_updated', payload });
    }
  } catch { }

  try {
    ensureLiveChatBus();
    if (liveChatChannel && liveChatChannelReady) {
      liveChatChannel.send({
        type: 'broadcast',
        event: 'school_status_updated',
        payload
      }).catch(() => { });
    }
  } catch { }
}

export function broadcastPlatformSettingsLive(settings: PlatformSettings) {
  try {
    if (localBroadcastBus) {
      localBroadcastBus.postMessage({ __event: 'platform_settings_updated', payload: settings });
    }
  } catch { }

  try {
    ensureLiveChatBus();
    if (liveChatChannel && liveChatChannelReady) {
      liveChatChannel.send({
        type: 'broadcast',
        event: 'platform_settings_updated',
        payload: settings
      }).catch(() => { });
    }
  } catch { }
}

/** Initialize the shared WebSocket Broadcast + Postgres Changes + BroadcastChannel bus for <50ms chat & account status delivery */
export function ensureLiveChatBus(): void {
  if (typeof window === 'undefined') return;

  if (!localBroadcastBus && typeof BroadcastChannel !== 'undefined') {
    try {
      localBroadcastBus = new BroadcastChannel('sukupass_live_chat_bus');
      localBroadcastBus.onmessage = (ev) => {
        if (!ev?.data) return;
        if (ev.data.__event === 'school_status_updated' && ev.data.payload) {
          applyIncomingSchoolStatusUpdate(ev.data.payload as LiveSchoolStatusPayload);
        } else if (ev.data.__event === 'platform_settings_updated' && ev.data.payload) {
          window.dispatchEvent(new CustomEvent('cardschool_platform_settings_updated', { detail: ev.data.payload }));
        } else if (ev.data.id && ev.data.schoolId) {
          emitIncomingChatMessage(ev.data as ChatMessage);
        }
      };
    } catch { }
  }

  if (liveChatChannel) return;

  try {
    liveChatChannel = supabase
      .channel('sukupass_live_chat_bus', {
        config: {
          broadcast: { self: false, ack: false }
        }
      })
      .on('broadcast', { event: 'new_chat_message' }, (payload: any) => {
        const msg = (payload?.payload || payload) as ChatMessage;
        if (msg && msg.id && msg.schoolId) {
          emitIncomingChatMessage(msg);
        }
      })
      .on('broadcast', { event: 'school_status_updated' }, (payload: any) => {
        const data = (payload?.payload || payload) as LiveSchoolStatusPayload;
        if (data && data.userId) {
          applyIncomingSchoolStatusUpdate(data);
        }
      })
      .on('broadcast', { event: 'platform_settings_updated' }, (payload: any) => {
        const settings = (payload?.payload || payload) as PlatformSettings;
        if (settings && typeof settings === 'object') {
          try {
            const jsonStr = JSON.stringify(settings);
            localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, jsonStr);
            localStorage.setItem('cartes_togo_platform_settings', jsonStr);
          } catch { }
          window.dispatchEvent(new CustomEvent('cardschool_platform_settings_updated', { detail: settings }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
        const row = payload?.new as any;
        if (row && row.school_id) {
          const incomingMsg: ChatMessage = {
            id: row.id?.toString() || `${row.school_id}_${row.created_at}`,
            schoolId: row.school_id,
            schoolName: row.school_name || 'Établissement',
            senderRole: (row.sender_role || row.sender) === 'admin' ? 'admin' : 'school',
            message: row.message || '',
            attachmentUrl: row.attachment_url || undefined,
            createdAt: row.created_at || new Date().toISOString(),
            status: row.status || 'sent',
          };
          emitIncomingChatMessage(incomingMsg);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_info' }, (payload: any) => {
        const row = payload?.new as any;
        if (row && row.user_id) {
          if (row.user_id === PLATFORM_SETTINGS_SYSTEM_USER_ID && row.card_colors) {
            window.dispatchEvent(new CustomEvent('cardschool_platform_settings_updated'));
            return;
          }
          if (row.user_id === LICENSE_KEYS_SYSTEM_USER_ID) {
            window.dispatchEvent(new CustomEvent('cardschool_licenses_updated'));
            return;
          }
          const colors = typeof row.card_colors === 'string'
            ? (() => { try { return JSON.parse(row.card_colors); } catch { return {}; } })()
            : (row.card_colors || {});
          applyIncomingSchoolStatusUpdate({
            userId: row.user_id,
            plan: colors.subscriptionPlan,
            expiresAt: colors.subscriptionExpiresAt,
            trialExpiresAt: colors.trialExpiresAt,
            customQuota: colors.customQuota,
            schoolName: row.name,
            timestamp: row.updated_at
          });
        }
      })
      .subscribe((status: string) => {
        liveChatChannelReady = status === 'SUBSCRIBED';
      });
  } catch { }
}

function broadcastChatMessageLive(msg: ChatMessage) {
  try {
    if (localBroadcastBus) {
      localBroadcastBus.postMessage(msg);
    }
  } catch { }

  try {
    ensureLiveChatBus();
    if (liveChatChannel && liveChatChannelReady) {
      // Avoid sending huge base64 strings over WebSocket broadcast if storage upload fell back to base64
      if (!msg.attachmentUrl || !msg.attachmentUrl.startsWith('data:') || msg.attachmentUrl.length < 180000) {
        liveChatChannel.send({
          type: 'broadcast',
          event: 'new_chat_message',
          payload: msg
        }).catch(() => { });
      }
    }
  } catch { }
}

/** Upload a compressed base64 chat image to Supabase Storage so chat_messages stays < 5KB */
async function uploadChatAttachmentToStorage(msgId: string, dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || !isAppOnline()) {
    return dataUrl;
  }
  try {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return dataUrl;
    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: mimeType });
    const filePath = `chat-attachments/${msgId}.${ext}`;

    const { error } = await supabase.storage
      .from('school-assets')
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: true
      });

    if (!error) {
      const { data } = supabase.storage.from('school-assets').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch {
    // Fallback to compressed base64 if storage upload fails
  }
  return dataUrl;
}

/** Fetch chat messages for a specific school or all messages for admin */
export async function fetchChatMessages(schoolId?: string): Promise<ChatMessage[]> {
  ensureLiveChatBus();
  const messagesList: ChatMessage[] = [];
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();

  const addUnique = (msg: ChatMessage) => {
    if (!msg || (!msg.message && !msg.attachmentUrl)) return;

    const id = msg.id?.toString();
    const timeMs = new Date(msg.createdAt || Date.now()).getTime();
    // 4-second time bucket prevents duplicates when timestamp differs by a few ms between client & server
    const timeBucket = Math.round(timeMs / 4000);
    const fingerprint = `${msg.schoolId}_${msg.senderRole}_${(msg.message || '').trim()}_${msg.attachmentUrl ? 'img' : 'noimg'}_${timeBucket}`;

    if ((id && seenIds.has(id)) || seenFingerprints.has(fingerprint)) {
      return;
    }

    if (id) seenIds.add(id);
    seenFingerprints.add(fingerprint);
    messagesList.push(msg);
  };

  // 1. Try Supabase chat_messages (Primary, uniquement si en ligne)
  if (isAppOnline()) {
    try {
      let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout chat messages')), 8000)
      );

      const res = await Promise.race([query, timeoutPromise]).catch(() => ({ data: null, error: null }));
      const { data, error } = res || {};
      if (!error && data && data.length > 0) {
        data.forEach((d: any) => {
          addUnique({
            id: d.id?.toString() || `${d.school_id}_${d.created_at}`,
            schoolId: d.school_id,
            schoolName: d.school_name || 'Établissement',
            senderRole: (d.sender_role || d.sender) === 'admin' ? 'admin' : 'school',
            message: d.message || '',
            attachmentUrl: d.attachment_url || undefined,
            createdAt: d.created_at || new Date().toISOString(),
            status: d.status || 'sent',
          });
        });
      }
    } catch {
      // Échec réseau ou timeout : fallback automatique sur le cache local
    }
  }

  // 2. Local storage fallback (Both keys)
  try {
    const rawA = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    const rawB = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY_ALT);
    const parsedA: ChatMessage[] = rawA ? JSON.parse(rawA) : [];
    const parsedB: ChatMessage[] = rawB ? JSON.parse(rawB) : [];
    const combinedLocal = [...parsedA, ...parsedB];

    combinedLocal.forEach(m => {
      if (m && m.schoolId) {
        if (!schoolId || m.schoolId === schoolId) {
          addUnique(m);
        }
      }
    });
  } catch {
    // ignore
  }

  // Sort by time
  const sorted = messagesList.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Clean and sync localStorage only when fetching global messages (or merge without wiping other schools)
  try {
    if (!schoolId) {
      const serialized = JSON.stringify(sorted);
      const existing = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
      if (existing !== serialized) {
        localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, serialized);
        localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY_ALT, serialized);
      }
    } else {
      sorted.forEach(m => appendMessageToLocalCache(m));
    }
  } catch { }

  return sorted;
}

/** Compress and optimize an image or screenshot for chat & payment receipt transmission */
export async function compressImageForChat(
  source: File | string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(typeof source === 'string' ? source : '');
      return;
    }

    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down proportionally if larger than maximum bounds
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof source === 'string' ? source : '');
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      if (typeof source === 'string') {
        resolve(source);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
        reader.readAsDataURL(source);
      }
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Erreur de lecture du fichier image.'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier image.'));
      reader.readAsDataURL(source);
    }
  });
}

/** Send a chat message with optional payment screenshot attachment */
export async function sendChatMessage(
  schoolId: string,
  schoolName: string,
  senderRole: 'school' | 'admin',
  message: string,
  attachmentUrl?: string
): Promise<ChatMessage> {
  ensureLiveChatBus();
  const timestamp = new Date().toISOString();
  // Valid UUID generation so Supabase and LocalStorage have identical primary keys
  let msgId: string;
  try {
    msgId = crypto.randomUUID();
  } catch {
    msgId = '10000000-1000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
  }

  const cleanSchoolName = schoolName || 'Établissement';
  const cleanMessage = message.trim();

  // Compress image if provided as data URL to prevent payload overflow
  let processedAttachment = attachmentUrl;
  if (processedAttachment && processedAttachment.startsWith('data:image/')) {
    try {
      processedAttachment = await compressImageForChat(processedAttachment, 960, 960, 0.7);
      // Upload to Supabase Storage so chat_messages table remains ultra-lightweight (< 5KB)
      processedAttachment = await uploadChatAttachmentToStorage(msgId, processedAttachment);
    } catch { }
  }

  const finalMsg: ChatMessage = {
    id: msgId,
    schoolId,
    schoolName: cleanSchoolName,
    senderRole,
    message: cleanMessage,
    attachmentUrl: processedAttachment,
    createdAt: timestamp,
    status: 'sent'
  };

  // 1. Sauvegarde locale immédiate (0ms) avec déduplication
  appendMessageToLocalCache(finalMsg);

  // 2. Émission live instantanée (0ms) localement + Broadcast WebSocket (<50ms) vers l'autre partie
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_chat_message_received', {
      detail: finalMsg
    }));
  }
  broadcastChatMessageLive(finalMsg);

  // 3. Persistance Supabase distante en arrière-plan sans bloquer
  const persistRemote = async () => {
    try {
      await supabase.from('chat_messages').insert({
        id: msgId,
        school_id: schoolId,
        school_name: cleanSchoolName,
        sender: senderRole,
        sender_role: senderRole,
        sender_name: senderRole === 'admin' ? 'Administration Centrale SAS' : cleanSchoolName,
        message: cleanMessage,
        attachment_url: processedAttachment || null,
        created_at: timestamp,
        status: 'sent'
      });
      // Re-broadcast after DB commit in case a peer just connected
      broadcastChatMessageLive(finalMsg);
    } catch (supabaseErr) {
      console.warn('sendChatMessage Supabase chat_messages error:', supabaseErr);
    }

    try {
      const actionLabel = senderRole === 'school'
        ? (attachmentUrl ? 'Preuve Paiement Reçue' : 'Message Établissement Reçu')
        : 'Réponse Administrateur Chat';

      const logDetails = `${cleanSchoolName} : ${cleanMessage.substring(0, 100)}${attachmentUrl ? ' [Capture jointe]' : ''}`;
      await saveAdminLog(schoolId, actionLabel, logDetails, cleanSchoolName);
    } catch { }
  };

  persistRemote().catch(err => console.warn('Background sync error in sendChatMessage:', err));

  return finalMsg;
}

/** Validate payment from chat and activate 1-Year PRO plan */
export async function validatePaymentFromChat(schoolId: string, schoolName: string): Promise<boolean> {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiresAtStr = nextYear.toISOString().split('T')[0];

  const upgraded = await updateSchoolSubscription(schoolId, 'pro', expiresAtStr, schoolName);
  if (!upgraded) return false;

  // Send automatic confirmation message in chat
  await sendChatMessage(
    schoolId,
    schoolName,
    'admin',
    `✅ Votre paiement a été validé avec succès par l'administration ! Votre abonnement PRO (cartes illimitées) est désormais actif jusqu'au ${expiresAtStr}. Merci pour votre confiance !`
  );

  // Update message status in local storage
  try {
    const stored = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    if (stored) {
      const messages: ChatMessage[] = JSON.parse(stored);
      const updated = messages.map(m => m.schoolId === schoolId ? { ...m, status: 'validated' as const } : m);
      localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    // ignore
  }

  return true;
}

/** Process automated instant payment via FedaPay (T-Money, Flooz, Card) and activate 1-Year PRO plan */
export async function processFedaPaySuccessfulPayment(
  schoolUserId: string,
  schoolName: string,
  transactionId: string | number,
  amount: number
): Promise<{ success: boolean; expiresAt: string }> {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiresAtStr = nextYear.toISOString().split('T')[0];

  const upgraded = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr, schoolName);
  if (!upgraded) {
    return { success: false, expiresAt: '' };
  }

  // Save audit log specifically for FedaPay instant transaction
  await saveAdminLog(
    schoolUserId,
    'PAIEMENT_AUTOMATIQUE_FEDAPAY',
    `Paiement instantané de ${amount.toLocaleString()} FCFA validé via FedaPay (#${transactionId}). Abonnement PRO activé pour 365 jours jusqu'au ${expiresAtStr}.`,
    schoolName
  );

  // Send automatic confirmation message in chat
  try {
    await sendChatMessage(
      schoolUserId,
      schoolName,
      'admin',
      `⚡ Paiement FedaPay Validé (#${transactionId}) ! Votre paiement de ${amount.toLocaleString()} FCFA a été reçu et validé automatiquement par Mobile Money. Votre abonnement PRO (cartes illimitées) est actif jusqu'au ${expiresAtStr}.`
    );
  } catch (err) {
    console.warn('FedaPay chat notification error:', err);
  }

  return { success: true, expiresAt: expiresAtStr };
}

export function exportSchoolsToCSV(schools: AdminSchoolDetail[]) {
  const headers = ['Nom Établissement', 'Type', 'Région', 'Localisation', 'Téléphone', 'Cartes Édités', 'Plan', 'Quota Custom', 'Date Inscription'];
  const rows = schools.map(s => [
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.schoolType || 'Lycée').replace(/"/g, '""')}"`,
    `"${(s.region || 'Grand Lomé').replace(/"/g, '""')}"`,
    `"${(s.location || '').replace(/"/g, '""')}"`,
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    s.studentCount || 0,
    `"${(s.subscriptionPlan || 'free').toUpperCase()}"`,
    s.customQuota || 15,
    `"${s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `SukuPass_Ecoles_Togo_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Platform & Admin Settings Helpers ─────────────────────────────────────────

export const PLATFORM_SETTINGS_STORAGE_KEY = 'cardschool_platform_settings';
export const PLATFORM_SETTINGS_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export function sanitizeKey(k?: string): string {
  if (!k) return '';
  return k.trim();
}

/** Helper to validate and normalize pricing plans */
export function sanitizePricingPlans(plans: any): LandingPricingPlan[] {
  if (!plans) return DEFAULT_PLATFORM_SETTINGS.pricingPlans;
  let arr: any = plans;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch { return DEFAULT_PLATFORM_SETTINGS.pricingPlans; }
  }
  if (!Array.isArray(arr) || arr.length === 0) return DEFAULT_PLATFORM_SETTINGS.pricingPlans;
  return arr.map((p, idx) => ({
    id: p.id || `plan_${idx}`,
    badge: p.badge || '',
    name: p.name || 'Formule',
    description: p.description || '',
    price: p.price || '0 F CFA',
    period: p.period !== undefined ? p.period : '',
    features: Array.isArray(p.features) ? p.features : [],
    buttonText: p.buttonText || "S'abonner",
    buttonAction: p.buttonAction || 'signup',
    buttonUrl: p.buttonUrl || '',
    paymentUrl: p.paymentUrl || '',
    durationDays: p.durationDays ? Number(p.durationDays) : 365,
    isPopular: Boolean(p.isPopular),
    enabled: p.enabled === false || (p.enabled as any) === 'false' || (p.enabled as any) === 0 || (p.enabled as any) === '0' ? false : true
  }));
}

/** Helper to read fedapayPublicKey from localStorage without discarding it */
export function getLocalFedaKey(): string {
  try {
    const raw = localStorage.getItem(PLATFORM_SETTINGS_STORAGE_KEY) || localStorage.getItem('cartes_togo_platform_settings');
    if (raw) {
      const p = JSON.parse(raw);
      return sanitizeKey(p.fedapayPublicKey);
    }
  } catch { }
  return '';
}

/** Fetch platform settings configured by super-admin (Aggregating Supabase & LocalStorage) */
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  // Read local cache first for video & Fedapay settings fallback
  let localVideoUrl = '';
  let localVideoTitle = '';
  let localVideoPoster = '';
  let localFedaKey = '';
  let localPricingPlans: any[] | undefined = undefined;
  let localPricingTitle = '';
  let localPricingSubtitle = '';
  let localPricingEnabled: boolean | undefined = undefined;
  let localUpdatedAt: string | undefined = undefined;
  try {
    const raw = localStorage.getItem(PLATFORM_SETTINGS_STORAGE_KEY) || localStorage.getItem('cartes_togo_platform_settings');
    if (raw) {
      const p = JSON.parse(raw);
      localVideoUrl = p.demoVideoUrl || '';
      localVideoTitle = p.demoVideoTitle || '';
      localVideoPoster = p.demoVideoPoster || '';
      localFedaKey = sanitizeKey(p.fedapayPublicKey);
      if (Array.isArray(p.pricingPlans)) {
        localPricingPlans = p.pricingPlans;
      } else if (typeof p.pricingPlans === 'string') {
        try { localPricingPlans = JSON.parse(p.pricingPlans); } catch { }
      }
      localPricingTitle = p.pricingTitle || '';
      localPricingSubtitle = p.pricingSubtitle || '';
      if (p.pricingEnabled !== undefined) localPricingEnabled = Boolean(p.pricingEnabled);
      localUpdatedAt = p.updatedAt;
    }
  } catch { }

  // 1. Try Supabase custom table platform_settings
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'global_config')
      .maybeSingle();

    if (!error && data) {
      // Prefer DB key if valid, otherwise fallback to localStorage key
      const dbKey = sanitizeKey(data.fedapay_public_key);
      let dbPricingPlans: any[] | undefined;
      if (data.pricing_plans) {
        try {
          dbPricingPlans = typeof data.pricing_plans === 'string' ? JSON.parse(data.pricing_plans) : data.pricing_plans;
        } catch { }
      }

      let resolvedPricingPlans = sanitizePricingPlans(dbPricingPlans);
      if (localPricingPlans && localUpdatedAt && data.updated_at) {
        if (new Date(localUpdatedAt).getTime() > new Date(data.updated_at).getTime()) {
          resolvedPricingPlans = sanitizePricingPlans(localPricingPlans);
        }
      } else if (!dbPricingPlans || dbPricingPlans.length === 0) {
        resolvedPricingPlans = sanitizePricingPlans(localPricingPlans || DEFAULT_PLATFORM_SETTINGS.pricingPlans);
      }

      const merged: PlatformSettings = {
        ...DEFAULT_PLATFORM_SETTINGS,
        tmoneyNumber: data.tmoney_number || DEFAULT_PLATFORM_SETTINGS.tmoneyNumber,
        tmoneyHolder: data.tmoney_holder || DEFAULT_PLATFORM_SETTINGS.tmoneyHolder,
        floozNumber: data.flooz_number || DEFAULT_PLATFORM_SETTINGS.floozNumber,
        floozHolder: data.flooz_holder || DEFAULT_PLATFORM_SETTINGS.floozHolder,
        annualPriceCFA: data.annual_price_cfa || DEFAULT_PLATFORM_SETTINGS.annualPriceCFA,
        supportEmail: data.support_email || DEFAULT_PLATFORM_SETTINGS.supportEmail,
        supportPhone: data.support_phone || DEFAULT_PLATFORM_SETTINGS.supportPhone,
        whatsappNumber: data.whatsapp_number || DEFAULT_PLATFORM_SETTINGS.whatsappNumber,
        officeAddress: data.office_address || DEFAULT_PLATFORM_SETTINGS.officeAddress,
        paymentGatewayEnabled: data.payment_gateway_enabled !== undefined ? Boolean(data.payment_gateway_enabled) : DEFAULT_PLATFORM_SETTINGS.paymentGatewayEnabled,
        paymentGatewayName: data.payment_gateway_name || DEFAULT_PLATFORM_SETTINGS.paymentGatewayName,
        paymentGatewayUrl: data.payment_gateway_url || DEFAULT_PLATFORM_SETTINGS.paymentGatewayUrl,
        paymentWebhookSecret: data.payment_webhook_secret || DEFAULT_PLATFORM_SETTINGS.paymentWebhookSecret,
        fedapayEnabled: data.fedapay_enabled !== undefined ? Boolean(data.fedapay_enabled) : DEFAULT_PLATFORM_SETTINGS.fedapayEnabled,
        fedapayPublicKey: dbKey || localFedaKey,
        fedapayEnvironment: data.fedapay_environment || DEFAULT_PLATFORM_SETTINGS.fedapayEnvironment,
        paymentInstructions: data.payment_instructions || DEFAULT_PLATFORM_SETTINGS.paymentInstructions,
        supportNotice: data.support_notice || DEFAULT_PLATFORM_SETTINGS.supportNotice,
        // If data.demo_video_url is undefined/null in DB (e.g. column not yet in remote schema), preserve local cache
        demoVideoUrl: (data.demo_video_url !== undefined && data.demo_video_url !== null)
          ? data.demo_video_url
          : (localVideoUrl || DEFAULT_PLATFORM_SETTINGS.demoVideoUrl),
        demoVideoTitle: data.demo_video_title || localVideoTitle || DEFAULT_PLATFORM_SETTINGS.demoVideoTitle,
        demoVideoPoster: data.demo_video_poster || localVideoPoster || DEFAULT_PLATFORM_SETTINGS.demoVideoPoster,
        pricingEnabled: data.pricing_enabled !== undefined ? Boolean(data.pricing_enabled) : (localPricingEnabled !== undefined ? localPricingEnabled : DEFAULT_PLATFORM_SETTINGS.pricingEnabled),
        pricingTitle: data.pricing_title || localPricingTitle || DEFAULT_PLATFORM_SETTINGS.pricingTitle,
        pricingSubtitle: data.pricing_subtitle || localPricingSubtitle || DEFAULT_PLATFORM_SETTINGS.pricingSubtitle,
        pricingPlans: resolvedPricingPlans,
        updatedAt: data.updated_at
      };
      localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem('cartes_togo_platform_settings', JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    // Ignore and proceed to next tier
  }

  // 2. Try Supabase school_info system entry
  try {
    const { data: systemRow, error: sysError } = await supabase
      .from('school_info')
      .select('*')
      .eq('user_id', PLATFORM_SETTINGS_SYSTEM_USER_ID)
      .maybeSingle();

    if (!sysError && systemRow && systemRow.card_colors) {
      const parsed = typeof systemRow.card_colors === 'string' ? JSON.parse(systemRow.card_colors) : systemRow.card_colors;
      if (parsed && (parsed.tmoneyNumber || parsed.floozNumber || parsed.supportEmail || parsed.demoVideoUrl || parsed.pricingPlans)) {
        const dbKey = sanitizeKey(parsed.fedapayPublicKey);
        const merged: PlatformSettings = {
          ...DEFAULT_PLATFORM_SETTINGS,
          ...parsed,
          demoVideoUrl: parsed.demoVideoUrl || localVideoUrl || DEFAULT_PLATFORM_SETTINGS.demoVideoUrl,
          demoVideoTitle: parsed.demoVideoTitle || localVideoTitle || DEFAULT_PLATFORM_SETTINGS.demoVideoTitle,
          demoVideoPoster: parsed.demoVideoPoster || localVideoPoster || DEFAULT_PLATFORM_SETTINGS.demoVideoPoster,
          pricingTitle: parsed.pricingTitle || localPricingTitle || DEFAULT_PLATFORM_SETTINGS.pricingTitle,
          pricingSubtitle: parsed.pricingSubtitle || localPricingSubtitle || DEFAULT_PLATFORM_SETTINGS.pricingSubtitle,
          pricingPlans: sanitizePricingPlans(parsed.pricingPlans || localPricingPlans),
          fedapayPublicKey: dbKey || localFedaKey,
          updatedAt: systemRow.updated_at
        };
        localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem('cartes_togo_platform_settings', JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    // Ignore and proceed to next tier
  }

  // 3. Try Supabase admin_logs SYNC_PLATFORM_SETTINGS entry
  try {
    const { data: logs, error: logError } = await supabase
      .from('admin_logs')
      .select('*')
      .eq('action', 'SYNC_PLATFORM_SETTINGS')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!logError && logs && logs.length > 0 && logs[0].details) {
      try {
        const parsed = JSON.parse(logs[0].details);
        if (parsed && (parsed.tmoneyNumber || parsed.floozNumber || parsed.supportEmail || parsed.demoVideoUrl || parsed.pricingPlans)) {
          const dbKey = sanitizeKey(parsed.fedapayPublicKey);
          const merged: PlatformSettings = {
            ...DEFAULT_PLATFORM_SETTINGS,
            ...parsed,
            demoVideoUrl: parsed.demoVideoUrl || localVideoUrl || DEFAULT_PLATFORM_SETTINGS.demoVideoUrl,
            demoVideoTitle: parsed.demoVideoTitle || localVideoTitle || DEFAULT_PLATFORM_SETTINGS.demoVideoTitle,
            demoVideoPoster: parsed.demoVideoPoster || localVideoPoster || DEFAULT_PLATFORM_SETTINGS.demoVideoPoster,
            pricingTitle: parsed.pricingTitle || localPricingTitle || DEFAULT_PLATFORM_SETTINGS.pricingTitle,
            pricingSubtitle: parsed.pricingSubtitle || localPricingSubtitle || DEFAULT_PLATFORM_SETTINGS.pricingSubtitle,
            pricingPlans: sanitizePricingPlans(parsed.pricingPlans || localPricingPlans),
            fedapayPublicKey: dbKey || localFedaKey,
            updatedAt: logs[0].created_at
          };
          localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          localStorage.setItem('cartes_togo_platform_settings', JSON.stringify(merged));
          return merged;
        }
      } catch { }
    }
  } catch (err) {
    // Ignore and proceed to local storage
  }

  // 4. Local storage fallback
  try {
    const stored = localStorage.getItem(PLATFORM_SETTINGS_STORAGE_KEY) || localStorage.getItem('cartes_togo_platform_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_PLATFORM_SETTINGS,
        ...parsed,
        pricingPlans: sanitizePricingPlans(parsed.pricingPlans),
        fedapayPublicKey: sanitizeKey(parsed.fedapayPublicKey)
      };
    }
  } catch {
    // ignore
  }

  return DEFAULT_PLATFORM_SETTINGS;
}

/** Save platform settings updated by super-admin (Writes to LocalStorage & all Supabase tiers) */
export async function savePlatformSettings(newSettings: PlatformSettings): Promise<boolean> {
  const timestamp = new Date().toISOString();
  const sanitizedPlans = sanitizePricingPlans(newSettings.pricingPlans);
  const settingsToSave: PlatformSettings = {
    ...newSettings,
    pricingPlans: sanitizedPlans,
    updatedAt: timestamp
  };

  // 1. Sauvegarde locale immédiate (0ms)
  try {
    const jsonStr = JSON.stringify(settingsToSave);
    localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, jsonStr);
    localStorage.setItem('cartes_togo_platform_settings', jsonStr);
  } catch (err) {
    console.warn('savePlatformSettings localStorage error:', err);
  }

  // 2. Émission live instantanée (0ms) + Broadcast WebSocket (<50ms) pour actualisation immédiate de la Landing Page et des Écoles
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_platform_settings_updated', {
      detail: settingsToSave
    }));
  }
  broadcastPlatformSettingsLive(settingsToSave);

  // 3. Synchronisation distante
  try {
    const { error } = await supabase.from('platform_settings').upsert({
      id: 'global_config',
      tmoney_number: settingsToSave.tmoneyNumber || '',
      tmoney_holder: settingsToSave.tmoneyHolder || '',
      flooz_number: settingsToSave.floozNumber || '',
      flooz_holder: settingsToSave.floozHolder || '',
      annual_price_cfa: settingsToSave.annualPriceCFA || 30000,
      support_email: settingsToSave.supportEmail || '',
      support_phone: settingsToSave.supportPhone || '',
      whatsapp_number: settingsToSave.whatsappNumber || '',
      office_address: settingsToSave.officeAddress || '',
      payment_gateway_enabled: settingsToSave.paymentGatewayEnabled ?? false,
      payment_gateway_name: settingsToSave.paymentGatewayName || '',
      payment_gateway_url: settingsToSave.paymentGatewayUrl || '',
      payment_webhook_secret: settingsToSave.paymentWebhookSecret || '',
      payment_instructions: settingsToSave.paymentInstructions || '',
      support_notice: settingsToSave.supportNotice || '',
      demo_video_url: settingsToSave.demoVideoUrl || '',
      demo_video_title: settingsToSave.demoVideoTitle || '',
      demo_video_poster: settingsToSave.demoVideoPoster || '',
      pricing_enabled: settingsToSave.pricingEnabled !== undefined ? settingsToSave.pricingEnabled : true,
      pricing_title: settingsToSave.pricingTitle || '',
      pricing_subtitle: settingsToSave.pricingSubtitle || '',
      pricing_plans: sanitizedPlans,
      updated_at: timestamp
    }, { onConflict: 'id' });

    if (error) {
      console.error('savePlatformSettings Supabase platform_settings error:', error);
    }

    return !error;
  } catch (err) {
    console.warn('savePlatformSettings Supabase unexpected error:', err);
    return false;
  }
}
