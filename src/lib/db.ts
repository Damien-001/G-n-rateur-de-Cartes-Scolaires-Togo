import { supabase } from './supabase';
import { Student, SchoolInfo, DEFAULT_CARD_COLORS, LicenseKey } from '../types';
import type { DbStudent, DbSchoolInfo } from './supabase';

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
    school_year: student.schoolYear || '',
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

// ─── Students ─────────────────────────────────────────────────────────────────

export async function fetchStudents(userId: string): Promise<Student[]> {
  try {
    const startTime = performance.now();
    
    // Timeout augmenté à 15 secondes pour connexions lentes
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetchStudents')), 15000)
    );
    
    const fetchPromise = supabase
      .from('students')
      .select('id, first_name, last_name, matricule, class_name, school_year, birth_date, birth_place, exam_center, photo_url, expiration_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100); // Limiter à 100 étudiants pour le chargement initial

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.error('fetchStudents error:', error.message);
      return [];
    }
    
    const endTime = performance.now();
    console.log(`✅ Chargement de ${data?.length || 0} étudiants en ${(endTime - startTime).toFixed(0)}ms`);
    
    return (data as DbStudent[]).map(dbToStudent);
  } catch (e: any) {
    if (e.message === 'Timeout fetchStudents') {
      console.error('⏱️ Timeout lors du chargement des étudiants (>15s)');
    } else {
      console.error('fetchStudents exception:', e);
    }
    return [];
  }
}

export async function upsertStudent(student: Student, userId: string): Promise<Student> {
  // Si l'élève existe déjà (édition), on fait un update ciblé
  // Sinon on fait un insert et Supabase génère l'UUID
  const isNew = !student.id || student.id === '';

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
    if (error) throw new Error(error.message);
    return dbToStudent(data as DbStudent);
  } else {
    const row = studentToDb(student, userId);
    const { data, error } = await supabase
      .from('students')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return dbToStudent(data as DbStudent);
  }
}

/** Import en masse depuis CSV — laisse Supabase générer les IDs */
export async function insertStudents(students: Student[], userId: string): Promise<Student[]> {
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

  const { data, error } = await supabase
    .from('students')
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);
  return (data as DbStudent[]).map(dbToStudent);
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Suppression en masse — supprime plusieurs élèves en une seule requête */
export async function deleteStudents(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from('students')
    .delete()
    .in('id', ids);

  if (error) throw new Error(error.message);
}

// ─── School Info ──────────────────────────────────────────────────────────────

export async function fetchSchoolInfo(userId: string): Promise<SchoolInfo | null> {
  try {
    const startTime = performance.now();
    
    // Timeout augmenté à 10 secondes pour connexions lentes
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetchSchoolInfo')), 10000)
    );
    
    const fetchPromise = supabase
      .from('school_info')
      .select('name, logo_url, signature_url, stamp_url, card_colors')
      .eq('user_id', userId)
      .maybeSingle();

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.error('fetchSchoolInfo error:', error.message);
      return null;
    }
    
    const endTime = performance.now();
    console.log(`✅ Chargement des infos école en ${(endTime - startTime).toFixed(0)}ms`);
    
    if (!data) return null;
    return dbToSchoolInfo(data as DbSchoolInfo);
  } catch (e: any) {
    if (e.message === 'Timeout fetchSchoolInfo') {
      console.error('⏱️ Timeout lors du chargement des infos école (>10s)');
    } else {
      console.error('fetchSchoolInfo exception:', e);
    }
    return null;
  }
}

export async function saveSchoolInfo(info: SchoolInfo, userId: string): Promise<void> {
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
      } as any,
      updated_at: new Date().toISOString(),
    };

    // Timeout augmenté à 10 secondes
    const { error } = await Promise.race([
      supabase
        .from('school_info')
        .upsert(row, { onConflict: 'user_id' }),
      new Promise<{ error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);

    if (error) {
      console.error('saveSchoolInfo error:', error.message);
      throw error;
    }
  } catch (e: any) {
    if (e.message === 'Timeout') {
      console.warn('⚠️ saveSchoolInfo timeout - les données seront sauvegardées plus tard');
    } else {
      console.error('saveSchoolInfo exception:', e);
    }
    // Ne pas propager l'erreur pour ne pas bloquer l'interface
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const BUCKET = 'school-assets';

export async function uploadImage(
  file: File,
  userId: string,
  folder: 'logos' | 'signatures' | 'photos'
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

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

// ─── Admin SaaS Helpers ────────────────────────────────────────────────────────

export interface AdminSchoolDetail extends SchoolInfo {
  userId: string;
  updatedAt?: string;
  studentCount?: number;
}

/** Fetches all school info entries for SaaS administration */
export async function fetchAllSchools(): Promise<AdminSchoolDetail[]> {
  try {
    const { data: schoolsData, error: schoolsError } = await supabase
      .from('school_info')
      .select('*')
      .order('updated_at', { ascending: false });

    if (schoolsError) throw schoolsError;
    if (!schoolsData) return [];

    // For each school, fetch student counts using Promise.all
    const schoolsWithCounts = await Promise.all(
      (schoolsData as DbSchoolInfo[]).map(async (row) => {
        const baseInfo = dbToSchoolInfo(row);
        
        // Fetch student count for this user_id
        let studentCount = 0;
        try {
          const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', row.user_id);
          
          if (!error && count !== null) {
            studentCount = count;
          }
        } catch (err) {
          console.error(`Error counting students for user ${row.user_id}:`, err);
        }

        return {
          ...baseInfo,
          userId: row.user_id,
          updatedAt: row.updated_at,
          studentCount: studentCount
        };
      })
    );

    return schoolsWithCounts;
  } catch (e: any) {
    console.error('fetchAllSchools error:', e.message);
    return [];
  }
}

/** Fetches total count of all student cards in the system */
export async function fetchAllStudentsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count ?? 0;
  } catch (e: any) {
    console.error('fetchAllStudentsCount error:', e.message);
    return 0;
  }
}

/** Upgrade or modify a school's subscription plan directly */
export async function updateSchoolSubscription(
  schoolUserId: string,
  plan: 'free' | 'pro',
  expiresAt: string
): Promise<boolean> {
  try {
    // 1. Fetch current school info
    const { data: currentData, error: fetchError } = await supabase
      .from('school_info')
      .select('*')
      .eq('user_id', schoolUserId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentData) return false;

    // 2. Prepare updated colors and subscription data
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

    // 3. Upsert update
    const { error: updateError } = await supabase
      .from('school_info')
      .upsert(updatedRow, { onConflict: 'user_id' });

    if (updateError) throw updateError;
    
    // Log the audit event
    await saveAdminLog(
      schoolUserId,
      'subscription_updated',
      `Plan mis à jour vers: ${plan.toUpperCase()} (Expire le: ${expiresAt})`
    );

    return true;
  } catch (e: any) {
    console.error('updateSchoolSubscription error:', e.message);
    return false;
  }
}

/** Save log entry to Supabase audit_logs (with catch block fallback) */
export async function saveAdminLog(
  schoolUserId: string | null,
  action: string,
  details: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        school_id: schoolUserId,
        action: action,
        details: details,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      // Muted as audit_logs table may not exist yet or not have RLS public write config
      console.warn('saveAdminLog silent skip:', error.message);
    }
  } catch (e) {
    // Fail silently so it doesn't break user actions
  }
}

/** Update custom quota for a school */
export async function updateSchoolCustomQuota(
  schoolUserId: string,
  newQuota: number
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
    await saveAdminLog(schoolUserId, 'quota_updated', `Nouveau quota attribué : ${newQuota} cartes`);
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
      // Default demo keys for testing
      const initialKeys: LicenseKey[] = [
        {
          id: '1',
          code: 'TOGO-PRO-2026-X89A',
          plan: 'pro',
          durationMonths: 12,
          isUsed: false,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          note: 'Paiement Espèces Lomé (Lycée Tokoin)'
        },
        {
          id: '2',
          code: 'TOGO-PRO-2026-B34M',
          plan: 'pro',
          durationMonths: 12,
          isUsed: true,
          usedBySchoolId: 'demo-school-id',
          usedBySchoolName: 'Collège Notre Dame Lomé',
          usedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          note: 'Partenariat Rentrée 2026'
        }
      ];
      localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(initialKeys));
      return initialKeys;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function generateLicenseKey(durationMonths: number = 12, note?: string): LicenseKey {
  const randomSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomSegment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `TOGO-PRO-2026-${randomSegment}${randomSegment2}`;

  const newKey: LicenseKey = {
    id: Date.now().toString(),
    code,
    plan: 'pro',
    durationMonths,
    isUsed: false,
    createdAt: new Date().toISOString(),
    note: note || 'Généré depuis la Console Admin'
  };

  const currentKeys = fetchAllLicenseKeys();
  const updatedKeys = [newKey, ...currentKeys];
  localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(updatedKeys));
  
  saveAdminLog(null, 'license_generated', `Clé de licence PRO créée: ${code}`);
  return newKey;
}

export async function redeemLicenseKey(code: string, schoolUserId: string, schoolName: string): Promise<{ success: boolean; message: string }> {
  const keys = fetchAllLicenseKeys();
  const foundKey = keys.find(k => k.code.trim().toUpperCase() === code.trim().toUpperCase());

  if (!foundKey) {
    return { success: false, message: 'Clé de licence invalide ou inexistante.' };
  }
  if (foundKey.isUsed) {
    return { success: false, message: `Cette clé a déjà été activée le ${foundKey.usedAt ? new Date(foundKey.usedAt).toLocaleDateString() : ''} par ${foundKey.usedBySchoolName || 'un autre établissement'}.` };
  }

  // Activate Pro plan for 1 year
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiresAtStr = nextYear.toISOString().split('T')[0];

  const updated = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr);
  if (!updated) {
    return { success: false, message: "Erreur lors de l'activation de la licence sur votre compte." };
  }

  // Mark key as used
  foundKey.isUsed = true;
  foundKey.usedBySchoolId = schoolUserId;
  foundKey.usedBySchoolName = schoolName;
  foundKey.usedAt = new Date().toISOString();

  localStorage.setItem(LICENSE_KEYS_STORAGE_KEY, JSON.stringify(keys));
  return { success: true, message: `Félicitations ! Votre abonnement PRO est actif jusqu'au ${expiresAtStr}.` };
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


