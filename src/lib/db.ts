import { supabase } from './supabase';
import { Student, SchoolInfo, DEFAULT_CARD_COLORS } from '../types';
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
  return {
    name: row.name,
    logoUrl: row.logo_url,
    signatureUrl: row.signature_url,
    stampUrl: row.stamp_url,
    cardColors: row.card_colors ?? DEFAULT_CARD_COLORS,
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
      logo_url: info.logoUrl,
      signature_url: info.signatureUrl,
      stamp_url: info.stampUrl,
      card_colors: info.cardColors ?? DEFAULT_CARD_COLORS,
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
