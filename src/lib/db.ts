import { supabase } from './supabase';
import { Student, SchoolInfo, DEFAULT_SCHOOL_INFO, DEFAULT_CARD_COLORS, LicenseKey, ChatMessage, PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '../types';
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
  isAppOnline 
} from './offlineStorage';

// ─── Helpers de conversion ────────────────────────────────────────────────────

function dbToStudent(row: DbStudent): Student {
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    matricule: row.matricule ?? '',
    className: row.class_name ?? '',
    schoolYear: row.school_year ?? '',
    birthDate: row.birth_date ?? '',
    birthPlace: row.birth_place ?? '',
    examCenter: row.exam_center ?? '',
    photoUrl: row.photo_url ?? '',
    expirationDate: row.expiration_date ?? '',
  };
}

function studentToDb(student: Student, userId: string): Omit<DbStudent, 'created_at' | 'updated_at'> {
  return {
    id: student.id,
    user_id: userId,
    first_name: student.firstName || '',
    last_name: student.lastName || '',
    matricule: student.matricule || '',
    class_name: student.className || '',
    schoolYear: student.schoolYear || '',
    birth_date: student.birthDate || null,
    birth_place: student.birthPlace || null,
    exam_center: student.examCenter || null,
    photo_url: student.photoUrl || null,
    expiration_date: student.expirationDate || null,
  };
}

function dbToSchoolInfo(row: DbSchoolInfo): SchoolInfo {
  const cardColors = row.card_colors ?? DEFAULT_CARD_COLORS;
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
    region: (row.card_colors as any)?.region ?? 'Grand Lomé',
    customQuota: (row.card_colors as any)?.customQuota ?? 15,
  };
}

// ─── Students (Offline-First) ─────────────────────────────────────────────────

export async function fetchStudents(userId: string): Promise<Student[]> {
  const localStudents = getStoredStudents(userId);

  // Si l'utilisateur est hors-ligne, renvoyer immédiatement les données du cache local
  if (!isAppOnline()) {
    console.log(`⚡ [Hors-ligne] ${localStudents.length} élèves chargés depuis le stockage local`);
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
      .select('id, first_name, last_name, matricule, class_name, school_year, birth_date, birth_place, exam_center, photo_url, expiration_date')
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
    id: s.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  }));

  // Sauvegarde locale immédiate
  const combined = [...preparedStudents, ...localList];
  setStoredStudents(userId, combined);

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

  if (!isAppOnline()) {
    if (userId) {
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
    if (userId) {
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

  if (!isAppOnline()) {
    console.log('⚡ [Hors-ligne] Infos école chargées depuis le stockage local');
    return localSchool;
  }

  try {
    const startTime = performance.now();
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetchSchoolInfo')), 4000)
    );
    
    const fetchPromise = supabase
      .from('school_info')
      .select('name, logo_url, signature_url, stamp_url, card_colors')
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
    setStoredSchoolInfo(userId, schoolInfo);
    return schoolInfo;
  } catch (e: any) {
    console.log('⚡ Utilisation du cache local des infos école suite à timeout/erreur:', e.message);
    return localSchool;
  }
}

export async function saveSchoolInfo(info: SchoolInfo, userId: string): Promise<void> {
  // 1. Sauvegarde locale immédiate
  setStoredSchoolInfo(userId, info);

  if (!isAppOnline()) {
    enqueueSyncAction(userId, {
      type: 'save_school_info',
      payload: info
    });
    return;
  }

  try {
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
        region: info.region ?? 'Grand Lomé',
        customQuota: info.customQuota ?? 15,
      } as any,
      updated_at: new Date().toISOString(),
    };

    const { error } = await Promise.race([
      supabase
        .from('school_info')
        .upsert(row, { onConflict: 'user_id' }),
      new Promise<{ error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 6000)
      )
    ]);

    if (error) {
      console.warn('saveSchoolInfo error (queued for sync):', error.message);
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
  if (!isAppOnline() || !userId) {
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
    } catch {}
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
  } catch {}
  return new Set();
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
          s.managerEmail?.toLowerCase().trim() !== 'admin@cardschool.tg' &&
          !s.name?.toUpperCase().includes('ADMINISTRATION CENTRALE') &&
          !s.name?.toUpperCase().includes('CONFIGURATION SYSTEME')
        );
      }
    }
  } catch {}
  return [];
}

export function saveRegisteredSchoolRegistry(school: AdminSchoolDetail) {
  if (
    !school ||
    !school.userId ||
    school.userId === 'admin-super-user-id' ||
    school.userId === PLATFORM_SETTINGS_SYSTEM_USER_ID ||
    school.managerEmail?.toLowerCase().trim() === 'admin@cardschool.tg' ||
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
    school.userId === PLATFORM_SETTINGS_SYSTEM_USER_ID ||
    school.managerEmail?.toLowerCase().trim() === 'admin@cardschool.tg' ||
    school.name?.toUpperCase().includes('ADMINISTRATION CENTRALE') ||
    school.name?.toUpperCase().includes('CONFIGURATION SYSTEME')
  ) {
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
        region: school.region ?? 'Grand Lomé',
        customQuota: school.customQuota ?? 15,
      } as any,
      updated_at: school.updatedAt || new Date().toISOString(),
    };

    await supabase.from('school_info').upsert(row, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('registerSchoolRecord Supabase upsert error:', err);
  }

  // 3. Émettre l'événement pour mise à jour immédiate de tous les composants ouverts
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_school_registered', { detail: school }));
    window.dispatchEvent(new Event('storage'));
  }
}

/** Fetches all school info entries for SaaS administration (Live Supabase + Registre + LocalStorage sans réapparition des supprimés) */
export async function fetchAllSchools(): Promise<AdminSchoolDetail[]> {
  const schoolsMap = new Map<string, AdminSchoolDetail>();
  const deletedBlacklist = getDeletedSchoolsBlacklist();

  // Pre-fetch all student counts in ONE query instead of N+1 queries
  const studentCountMap = new Map<string, number>();
  try {
    const { data: studentRows } = await supabase
      .from('students')
      .select('user_id');
    if (studentRows) {
      for (const row of studentRows) {
        if (row.user_id) {
          studentCountMap.set(row.user_id, (studentCountMap.get(row.user_id) || 0) + 1);
        }
      }
    }
  } catch {}

  // 1. Charger depuis Supabase school_info
  try {
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('school_info')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!schoolsError && schoolsData) {
      for (const row of (schoolsData as DbSchoolInfo[])) {
        if (row.user_id === PLATFORM_SETTINGS_SYSTEM_USER_ID) continue;
        if (deletedBlacklist.has(row.user_id)) continue;

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

  // 2. Récupérer depuis Supabase admin_logs & audit_logs pour les comptes inscrits
  try {
    const { data: logsData } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsData) {
      for (const log of logsData) {
        if (log.school_id && log.school_id !== PLATFORM_SETTINGS_SYSTEM_USER_ID && !deletedBlacklist.has(log.school_id)) {
          if (!schoolsMap.has(log.school_id)) {
            let schoolType = 'Lycée';
            let location = '';
            const match = log.details?.match(/enregistré \((.*?)\) à (.*)/);
            if (match) {
              schoolType = match[1] || 'Lycée';
              location = match[2] || '';
            }
            const localStudents = getStoredStudents(log.school_id);
            schoolsMap.set(log.school_id, {
              ...DEFAULT_SCHOOL_INFO,
              name: log.school_name || 'Établissement Enregistré',
              schoolType,
              location,
              subscriptionPlan: 'free',
              userId: log.school_id,
              updatedAt: log.created_at,
              studentCount: localStudents.length
            });
          }
        }
      }
    }
  } catch {}

  // 3. Scanner le Registre persistant de l'application
  const registeredList = getRegisteredSchoolsRegistry();
  for (const reg of registeredList) {
    if (reg.userId && !deletedBlacklist.has(reg.userId)) {
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

  // 4. Scanner LocalStorage pour retrouver toutes les écoles et jetons enregistrés
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // 4.1 Clés cartes_togo_school_*
      if (key.startsWith('cartes_togo_school_')) {
        const userId = key.replace('cartes_togo_school_', '');
        if (userId && userId !== PLATFORM_SETTINGS_SYSTEM_USER_ID && !deletedBlacklist.has(userId)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const localSchoolInfo = JSON.parse(raw);
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
            } catch {}
          }
        }
      }

      // 4.2 Clés Supabase Auth Tokens (sb-*-auth-token)
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const user = parsed?.user || parsed?.currentSession?.user;
            if (user && user.id && user.id !== PLATFORM_SETTINGS_SYSTEM_USER_ID && !deletedBlacklist.has(user.id)) {
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
        } catch {}
      }
    }
  } catch (err) {
    console.warn('fetchAllSchools localStorage scan error:', err);
  }

  const validSchools = Array.from(schoolsMap.values()).filter(school => {
    if (!school || !school.userId) return false;
    if (school.userId === PLATFORM_SETTINGS_SYSTEM_USER_ID) return false;
    if (school.userId === 'admin-super-user-id') return false;
    if (school.managerEmail?.toLowerCase().trim() === 'admin@cardschool.tg') return false;
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
          } catch {}
        }
      }
    }
  } catch {}

  return Math.max(totalDb, localTotal);
}

/** Delete an entire school, its students, chats and logs by super-admin */
export async function deleteSchoolByAdmin(userId: string): Promise<boolean> {
  // 1. Ajouter à la liste noire pour interdire toute réapparition
  addDeletedSchoolBlacklist(userId);

  // 2. Retirer du registre persistant
  try {
    const remaining = getRegisteredSchoolsRegistry().filter(s => s.userId !== userId);
    localStorage.setItem(REGISTERED_SCHOOLS_KEY, JSON.stringify(remaining));
  } catch {}

  // 3. Supprimer de Supabase
  try {
    await supabase.from('school_info').delete().eq('user_id', userId);
    await supabase.from('students').delete().eq('user_id', userId);
    await supabase.from('admin_logs').delete().eq('school_id', userId);
    await supabase.from('chat_messages').delete().eq('school_id', userId);
  } catch (err) {
    console.warn('deleteSchoolByAdmin Supabase error:', err);
  }

  // 4. Nettoyer le stockage local
  try {
    localStorage.removeItem('cartes_togo_school_' + userId);
    localStorage.removeItem('cartes_togo_students_' + userId);
  } catch {}

  // 5. Journaliser la suppression
  await saveAdminLog(
    PLATFORM_SETTINGS_SYSTEM_USER_ID,
    'SUPPRESSION_ETABLISSEMENT',
    `Établissement supprimé (ID: ${userId}) par le super-administrateur`,
    'Administration Système'
  ).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_school_deleted', { detail: userId }));
    window.dispatchEvent(new Event('storage'));
  }

  return true;
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
    userId: pseudoUserId,
    updatedAt: now,
    studentCount: 0
  };

  // Enregistrer via le pipeline universel
  await registerSchoolRecord(newSchoolDetail);

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
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('school_info')
      .select('*')
      .eq('user_id', schoolUserId)
      .single();

    if (fetchError || !currentData) return false;

    const currentColors = currentData.card_colors ?? DEFAULT_CARD_COLORS;
    const updatedRow = {
      ...currentData,
      card_colors: {
        ...currentColors,
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt
      },
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('school_info')
      .upsert(updatedRow, { onConflict: 'user_id' });

    if (updateError) throw updateError;
    
    const actionLabel = plan === 'pro' 
      ? 'Abonnement PRO Activé' 
      : (plan === 'suspended' ? 'Compte Suspendu' : 'Abonnement Réinitialisé');
    const details = plan === 'pro'
      ? `Plan PRO 1 An validé (Expire le: ${expiresAt})`
      : (plan === 'suspended' ? 'Accès suspendu pour impayé ou litige' : 'Retour au Plan Découverte Gratuit');

    await saveAdminLog(
      schoolUserId,
      actionLabel,
      details,
      schoolName || currentData.name
    );

    return true;
  } catch (e: any) {
    console.error('updateSchoolSubscription error:', e.message);
    return false;
  }
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
    schoolName: schoolName || (schoolUserId ? 'Établissement' : 'Système CardSchool'),
    action,
    details,
    createdAt: timestamp
  };

  // 1. Sauvegarde locale immédiate
  try {
    const localLogsStr = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    const localLogs: AdminLogItem[] = localLogsStr ? JSON.parse(localLogsStr) : [];
    const updated = [newLogItem, ...localLogs].slice(0, 100);
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('saveAdminLog local error:', err);
  }

  // 2. Sauvegarde Supabase admin_logs
  try {
    await supabase.from('admin_logs').insert({
      school_id: schoolUserId,
      school_name: schoolName,
      action: action,
      details: details,
      created_at: timestamp
    });
  } catch {}

  // (audit_logs table removed — admin_logs is the single source of truth)

  // 4. Émettre un événement pour rafraîchissement temps-réel de l'interface admin
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_audit_log_added', { detail: newLogItem }));
  }
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
        if (log.action === 'SYNC_PLATFORM_SETTINGS') continue;
        const id = log.id?.toString() || `${log.created_at}-${log.school_id}`;
        logsMap.set(id, {
          id,
          schoolName: log.school_name || (log.school_id ? 'Établissement' : 'Système CardSchool'),
          action: log.action || 'Action',
          details: log.details || '',
          createdAt: log.created_at || new Date().toISOString(),
        });
      }
    }
  } catch {}

  // (audit_logs table removed — data consolidated in admin_logs only)

  // 3. Fallback / Fusion avec LocalStorage
  try {
    const stored = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (stored) {
      const localList: AdminLogItem[] = JSON.parse(stored);
      for (const item of localList) {
        if (item.action === 'SYNC_PLATFORM_SETTINGS') continue;
        if (!logsMap.has(item.id)) {
          logsMap.set(item.id, item);
        }
      }
    }
  } catch {}

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
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('school_info')
      .select('*')
      .eq('user_id', schoolUserId)
      .single();

    if (fetchError || !currentData) return false;

    const currentColors = currentData.card_colors ?? DEFAULT_CARD_COLORS;
    const updatedRow = {
      ...currentData,
      card_colors: {
        ...currentColors,
        customQuota: newQuota
      },
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('school_info')
      .upsert(updatedRow, { onConflict: 'user_id' });

    if (updateError) throw updateError;
    await saveAdminLog(schoolUserId, 'Quota Mis à Jour', `Nouveau quota attribué : ${newQuota} cartes`, schoolName || currentData.name);
    return true;
  } catch (e: any) {
    console.error('updateSchoolCustomQuota error:', e.message);
    return false;
  }
}

// ─── License Keys & CSV Export Helpers ─────────────────────────────────────────

const LICENSE_KEYS_STORAGE_KEY = 'cardschool_admin_license_keys';

export function fetchAllLicenseKeys(): LicenseKey[] {
  try {
    const stored = localStorage.getItem(LICENSE_KEYS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function generateLicenseKey(
  durationMonths: number = 12, 
  note?: string, 
  targetSchoolName?: string
): LicenseKey {
  const randomSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomSegment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `TOGO-PRO-2026-${randomSegment}${randomSegment2}`;

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

  const currentKeys = fetchAllLicenseKeys();
  const updatedKeys = [newKey, ...currentKeys];
  localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(updatedKeys));
  
  const destInfo = targetSchoolName ? ` pour "${targetSchoolName}"` : '';
  saveAdminLog(null, 'Clé Licence Créée', `Clé de licence PRO 1 An générée : ${code}${destInfo}`);
  return newKey;
}

/** Toggle suspension status of a license key (Activer / Désactiver) */
export async function toggleLicenseKeyStatus(keyId: string): Promise<boolean> {
  try {
    const keys = fetchAllLicenseKeys();
    const key = keys.find(k => k.id === keyId);
    if (!key) return false;

    key.isSuspended = !key.isSuspended;
    localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(keys));

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
    const keys = fetchAllLicenseKeys();
    const keyToDelete = keys.find(k => k.id === keyId);
    if (!keyToDelete) return false;

    const remainingKeys = keys.filter(k => k.id !== keyId);
    localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(remainingKeys));

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

export async function redeemLicenseKey(code: string, schoolUserId: string, schoolName: string): Promise<{ success: boolean; message: string }> {
  const keys = fetchAllLicenseKeys();
  const foundKey = keys.find(k => k.code.trim().toUpperCase() === code.trim().toUpperCase());

  if (!foundKey) {
    return { success: false, message: 'Clé de licence invalide ou inexistante.' };
  }
  if (foundKey.isSuspended) {
    return { success: false, message: 'Cette clé de licence est temporairement suspendue / désactivée. Veuillez contacter le support technique.' };
  }
  if (foundKey.isUsed) {
    return { success: false, message: `Cette clé a déjà été activée le ${foundKey.usedAt ? new Date(foundKey.usedAt).toLocaleDateString() : ''} par ${foundKey.usedBySchoolName || 'un autre établissement'}.` };
  }

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiresAtStr = nextYear.toISOString().split('T')[0];

  const updated = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr, schoolName);
  if (!updated) {
    return { success: false, message: "Erreur lors de l'activation de la licence sur votre compte." };
  }

  foundKey.isUsed = true;
  foundKey.usedBySchoolId = schoolUserId;
  foundKey.usedBySchoolName = schoolName;
  foundKey.usedAt = new Date().toISOString();

  localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(keys));
  return { success: true, message: `Félicitations ! Votre abonnement PRO est actif jusqu'au ${expiresAtStr}.` };
}

// ─── Chat & Payment Proofs Helpers ───────────────────────────────────────────

export const CHAT_MESSAGES_STORAGE_KEY = 'cardschool_chat_messages';
export const CHAT_MESSAGES_STORAGE_KEY_ALT = 'cartes_togo_chat_messages';

/** Fetch chat messages for a specific school or all messages for admin */
export async function fetchChatMessages(schoolId?: string): Promise<ChatMessage[]> {
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

  // 1. Try Supabase chat_messages (Primary)
  try {
    let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    const { data, error } = await query;
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
  } catch (err) {
    // Continue to next tier
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

  // Clean and sync localStorage so duplicates don't persist on disk
  try {
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(sorted));
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY_ALT, JSON.stringify(sorted));
  } catch {}

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
      processedAttachment = await compressImageForChat(processedAttachment, 1024, 1024, 0.72);
    } catch {}
  }

  let finalMsg: ChatMessage = {
    id: msgId,
    schoolId,
    schoolName: cleanSchoolName,
    senderRole,
    message: cleanMessage,
    attachmentUrl: processedAttachment,
    createdAt: timestamp,
    status: 'sent'
  };

  // 1. Supabase chat_messages table persistence
  try {
    const { data, error } = await supabase.from('chat_messages').insert({
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
    }).select().single();

    if (!error && data && data.id) {
      finalMsg.id = data.id.toString();
    }
  } catch (supabaseErr) {
    console.warn('sendChatMessage Supabase chat_messages error:', supabaseErr);
  }

  // 2. Local storage persistence (deduplicated)
  try {
    const stored = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    const messages: ChatMessage[] = stored ? JSON.parse(stored) : [];
    const timeMs = new Date(finalMsg.createdAt).getTime();
    
    // Filter out any previous identical message (same content within 4 seconds)
    const filtered = messages.filter(m => 
      m.id !== finalMsg.id && 
      !(m.schoolId === finalMsg.schoolId && m.senderRole === finalMsg.senderRole && m.message === finalMsg.message && Math.abs(new Date(m.createdAt).getTime() - timeMs) < 4000)
    );
    const updated = [...filtered, finalMsg];
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY_ALT, JSON.stringify(updated));
  } catch (err) {
    console.warn('sendChatMessage local error:', err);
  }

  // 3. Supabase audit log for visibility
  try {
    const actionLabel = senderRole === 'school' 
      ? (attachmentUrl ? 'Preuve Paiement Reçue' : 'Message Établissement Reçu')
      : 'Réponse Administrateur Chat';

    const logDetails = `${cleanSchoolName} : ${cleanMessage.substring(0, 100)}${attachmentUrl ? ' [Capture jointe]' : ''}`;
    await saveAdminLog(schoolId, actionLabel, logDetails, cleanSchoolName);
  } catch {}

  // 4. Live dispatch for cross-component & cross-tab real-time sync
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_chat_message_received', {
      detail: finalMsg
    }));
    window.dispatchEvent(new Event('storage'));
  }

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
  link.setAttribute('download', `CardSchool_Ecoles_Togo_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Platform & Admin Settings Helpers ─────────────────────────────────────────

export const PLATFORM_SETTINGS_STORAGE_KEY = 'cardschool_platform_settings';
export const PLATFORM_SETTINGS_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

function sanitizeKey(k?: string): string {
  if (!k || k === 'pk_sandbox_M77UqfN9m23w36vPqC46E2Yp') return '';
  return k.trim();
}

/** Helper to read fedapayPublicKey from localStorage without discarding it */
function getLocalFedaKey(): string {
  try {
    const raw = localStorage.getItem(PLATFORM_SETTINGS_STORAGE_KEY) || localStorage.getItem('cartes_togo_platform_settings');
    if (raw) {
      const p = JSON.parse(raw);
      return sanitizeKey(p.fedapayPublicKey);
    }
  } catch {}
  return '';
}

/** Fetch platform settings configured by super-admin (Aggregating Supabase & LocalStorage) */
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  // 1. Try Supabase custom table platform_settings
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'global_config')
      .single();

    if (!error && data) {
      // Prefer DB key if valid, otherwise fallback to localStorage key
      const dbKey = sanitizeKey(data.fedapay_public_key);
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
        fedapayEnabled: data.fedapay_enabled !== undefined ? Boolean(data.fedapay_enabled) : DEFAULT_PLATFORM_SETTINGS.fedapayEnabled,
        fedapayPublicKey: dbKey || getLocalFedaKey(),
        fedapayEnvironment: data.fedapay_environment || DEFAULT_PLATFORM_SETTINGS.fedapayEnvironment,
        paymentInstructions: data.payment_instructions || DEFAULT_PLATFORM_SETTINGS.paymentInstructions,
        supportNotice: data.support_notice || DEFAULT_PLATFORM_SETTINGS.supportNotice,
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
      if (parsed && (parsed.tmoneyNumber || parsed.floozNumber || parsed.supportEmail)) {
        const dbKey = sanitizeKey(parsed.fedapayPublicKey);
        const merged: PlatformSettings = {
          ...DEFAULT_PLATFORM_SETTINGS,
          ...parsed,
          // Always prefer a real key: use DB key if valid, else fallback to localStorage key
          fedapayPublicKey: dbKey || getLocalFedaKey(),
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
        if (parsed && (parsed.tmoneyNumber || parsed.floozNumber || parsed.supportEmail)) {
          const dbKey = sanitizeKey(parsed.fedapayPublicKey);
          const merged: PlatformSettings = {
            ...DEFAULT_PLATFORM_SETTINGS,
            ...parsed,
            fedapayPublicKey: dbKey || getLocalFedaKey(),
            updatedAt: logs[0].created_at
          };
          localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          localStorage.setItem('cartes_togo_platform_settings', JSON.stringify(merged));
          return merged;
        }
      } catch {}
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
  const settingsToSave: PlatformSettings = {
    ...newSettings,
    updatedAt: timestamp
  };

  // 1. Save to Local Storage (both keys for maximum safety)
  try {
    const jsonStr = JSON.stringify(settingsToSave);
    localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, jsonStr);
    localStorage.setItem('cartes_togo_platform_settings', jsonStr);
  } catch (err) {
    console.warn('savePlatformSettings localStorage error:', err);
  }

  // 2. Try Supabase platform_settings table
  try {
    await supabase.from('platform_settings').upsert({
      id: 'global_config',
      tmoney_number: settingsToSave.tmoneyNumber,
      tmoney_holder: settingsToSave.tmoneyHolder,
      flooz_number: settingsToSave.floozNumber,
      flooz_holder: settingsToSave.floozHolder,
      annual_price_cfa: settingsToSave.annualPriceCFA,
      support_email: settingsToSave.supportEmail,
      support_phone: settingsToSave.supportPhone,
      whatsapp_number: settingsToSave.whatsappNumber,
      office_address: settingsToSave.officeAddress,
      fedapay_enabled: settingsToSave.fedapayEnabled,
      fedapay_public_key: settingsToSave.fedapayPublicKey,
      fedapay_environment: settingsToSave.fedapayEnvironment,
      payment_instructions: settingsToSave.paymentInstructions,
      support_notice: settingsToSave.supportNotice,
      updated_at: timestamp
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('savePlatformSettings Supabase platform_settings table error:', err);
  }

  // 3. Save to Supabase school_info system entry (Guaranteed to exist in DB)
  try {
    await supabase.from('school_info').upsert({
      user_id: PLATFORM_SETTINGS_SYSTEM_USER_ID,
      name: 'CONFIGURATION SYSTEME CARDSCHOOL',
      logo_url: null,
      signature_url: null,
      stamp_url: null,
      card_colors: settingsToSave as any,
      updated_at: timestamp
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('savePlatformSettings Supabase school_info system row error:', err);
  }

  // 4. Save to Supabase admin_logs with raw JSON payload
  try {
    await saveAdminLog(
      PLATFORM_SETTINGS_SYSTEM_USER_ID,
      'SYNC_PLATFORM_SETTINGS',
      JSON.stringify(settingsToSave),
      'Configuration Plateforme'
    );
  } catch (err) {
    console.warn('savePlatformSettings Supabase admin_logs error:', err);
  }

  // 5. Dispatch global window event for live refresh across open components & tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cardschool_platform_settings_updated', {
      detail: settingsToSave
    }));
    window.dispatchEvent(new Event('storage'));
  }

  return true;
}
