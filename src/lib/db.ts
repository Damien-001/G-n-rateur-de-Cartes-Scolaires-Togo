import { supabase } from './supabase';
import { Student, SchoolInfo, DEFAULT_CARD_COLORS } from '../types';
import type { DbStudent, DbSchoolInfo } from './supabase';

// ─── Helpers de conversion ────────────────────────────────────────────────────

function dbToStudent(row: DbStudent): Student {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    matricule: row.matricule,
    className: row.class_name,
    schoolYear: row.school_year,
    birthDate: row.birth_date,
    birthPlace: row.birth_place,
    examCenter: row.exam_center,
    photoUrl: row.photo_url,
    qrCodeData: row.qr_code_data,
  };
}

function studentToDb(student: Student, userId: string): Omit<DbStudent, 'created_at' | 'updated_at'> {
  return {
    id: student.id,
    user_id: userId,
    first_name: student.firstName,
    last_name: student.lastName,
    matricule: student.matricule,
    class_name: student.className,
    school_year: student.schoolYear,
    birth_date: student.birthDate,
    birth_place: student.birthPlace,
    exam_center: student.examCenter,
    photo_url: student.photoUrl,
    qr_code_data: student.qrCodeData,
  };
}

function dbToSchoolInfo(row: DbSchoolInfo): SchoolInfo {
  return {
    name: row.name,
    logoUrl: row.logo_url,
    signatureUrl: row.signature_url,
    cardColors: row.card_colors ?? DEFAULT_CARD_COLORS,
  };
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function fetchStudents(userId: string): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('fetchStudents error:', error.message);
      return [];
    }
    return (data as DbStudent[]).map(dbToStudent);
  } catch (e) {
    console.error('fetchStudents exception:', e);
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
        qr_code_data: student.qrCodeData || null,
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
    qr_code_data: s.qrCodeData || null,
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

// ─── School Info ──────────────────────────────────────────────────────────────

export async function fetchSchoolInfo(userId: string): Promise<SchoolInfo | null> {
  try {
    const { data, error } = await supabase
      .from('school_info')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('fetchSchoolInfo error:', error.message);
      return null;
    }
    if (!data) return null;
    return dbToSchoolInfo(data as DbSchoolInfo);
  } catch (e) {
    console.error('fetchSchoolInfo exception:', e);
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
      card_colors: info.cardColors ?? DEFAULT_CARD_COLORS,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('school_info')
      .upsert(row, { onConflict: 'user_id' });

    if (error) console.error('saveSchoolInfo error:', error.message);
  } catch (e) {
    console.error('saveSchoolInfo exception:', e);
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
